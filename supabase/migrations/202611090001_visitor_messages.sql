begin;

create table public.visitor_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('contact', 'feedback')),
  name text not null check (char_length(name) between 1 and 80),
  email text check (email is null or char_length(email) <= 254),
  message text not null check (char_length(message) between 20 and 4000),
  status text not null default 'new' check (status in ('new', 'read', 'archived'))
);
create index visitor_messages_inbox on public.visitor_messages(status, created_at desc);
alter table public.visitor_messages enable row level security;
revoke all on public.visitor_messages from public, anon, authenticated;

create table public.message_rate_buckets (
  key text not null,
  window_start timestamptz not null,
  count integer not null,
  primary key (key, window_start)
);
alter table public.message_rate_buckets enable row level security;
revoke all on public.message_rate_buckets from public, anon, authenticated;

-- Only the verified server endpoint can execute this atomic rate-limit/write operation.
create function public.submit_visitor_message(
  p_rate_key text, p_kind text, p_name text, p_email text, p_message text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  bucket timestamptz := date_trunc('hour', now());
  hits integer;
  result uuid;
begin
  if p_rate_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid rate key'; end if;
  delete from public.message_rate_buckets where window_start < now() - interval '2 hours';
  insert into public.message_rate_buckets values ('global', bucket, 1)
    on conflict (key, window_start) do update set count = public.message_rate_buckets.count + 1
    returning count into hits;
  if hits > 50 then return null; end if;
  insert into public.message_rate_buckets values (p_rate_key, bucket, 1)
    on conflict (key, window_start) do update set count = public.message_rate_buckets.count + 1
    returning count into hits;
  if hits > 3 then return null; end if;
  insert into public.visitor_messages(kind, name, email, message)
    values(p_kind, p_name, nullif(p_email, ''), p_message) returning id into result;
  return result;
end;
$$;
revoke all on function public.submit_visitor_message(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_visitor_message(text,text,text,text,text) to service_role;
commit;
