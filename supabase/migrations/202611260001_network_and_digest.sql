begin;
alter table public.visitor_messages add column reported_ip inet,
  add column approximate_location jsonb,
  add column network_recorded_at timestamptz,
  add column updated_at timestamptz not null default now();

create function public.message_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.status,new.name,new.email,new.message,new.kind) is distinct from
     (old.status,old.name,old.email,old.message,old.kind) then new.updated_at := now(); end if;
  return new;
end; $$;
revoke all on function public.message_updated_at() from public,anon,authenticated;
create trigger message_updated_at before update on public.visitor_messages
for each row execute function public.message_updated_at();

create table public.visitor_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visit_day date not null default (now() at time zone 'UTC')::date,
  session_id uuid not null,
  path text not null check (path = '/'),
  network_hash text not null check (network_hash ~ '^[a-f0-9]{64}$'),
  reported_ip inet,
  approximate_location jsonb,
  network_recorded_at timestamptz,
  unique (session_id,visit_day)
);
alter table public.visitor_visits enable row level security;
revoke all on public.visitor_visits from public,anon,authenticated;
create index visitor_visits_created on public.visitor_visits(created_at);

create function public.prune_visitor_network() returns void
language sql security definer set search_path = '' as $$
  update public.visitor_messages set reported_ip=null,approximate_location=null,network_recorded_at=null
    where network_recorded_at < now()-interval '30 days';
  update public.visitor_visits set reported_ip=null,approximate_location=null,network_recorded_at=null
    where network_recorded_at < now()-interval '30 days';
  delete from public.visitor_visits where created_at < now()-interval '90 days';
$$;
revoke all on function public.prune_visitor_network() from public,anon,authenticated;
grant execute on function public.prune_visitor_network() to service_role;

create function public.record_network_details(p_kind text,p_id uuid,p_ip inet,p_location jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_kind='message' then
    update public.visitor_messages set reported_ip=p_ip,approximate_location=p_location,
      network_recorded_at=now() where id=p_id;
  elsif p_kind='visit' then
    update public.visitor_visits set reported_ip=p_ip,approximate_location=p_location,
      network_recorded_at=now() where id=p_id;
  else raise exception 'invalid record kind'; end if;
  perform public.prune_visitor_network();
end; $$;
revoke all on function public.record_network_details(text,uuid,inet,jsonb) from public,anon,authenticated;
grant execute on function public.record_network_details(text,uuid,inet,jsonb) to service_role;

create function public.record_visitor_visit(p_session uuid,p_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare bucket timestamptz := date_trunc('hour',now()); hits integer; result uuid;
begin
  if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid network hash'; end if;
  perform public.prune_visitor_network();
  if exists(select 1 from public.visitor_visits where session_id=p_session
    and visit_day=(now() at time zone 'UTC')::date) then return null; end if;
  delete from public.message_rate_buckets where window_start < now()-interval '2 hours';
  insert into public.message_rate_buckets values ('visit:global',bucket,1)
    on conflict (key,window_start) do update set count=public.message_rate_buckets.count+1 returning count into hits;
  if hits>500 then return null; end if;
  insert into public.message_rate_buckets values ('visit:'||p_hash,bucket,1)
    on conflict (key,window_start) do update set count=public.message_rate_buckets.count+1 returning count into hits;
  if hits>20 then return null; end if;
  insert into public.visitor_visits(session_id,path,network_hash) values(p_session,'/',p_hash)
    on conflict(session_id,visit_day) do nothing returning id into result;
  return result;
end; $$;
revoke all on function public.record_visitor_visit(uuid,text) from public,anon,authenticated;
grant execute on function public.record_visitor_visit(uuid,text) to service_role;

create table public.weekly_digest_runs (
  period_start timestamptz primary key,
  period_end timestamptz not null,
  snapshot jsonb not null,
  first_attempt timestamptz not null default now(),
  lease_until timestamptz,
  sent_at timestamptz,
  provider_id text
);
alter table public.weekly_digest_runs enable row level security;
revoke all on public.weekly_digest_runs from public,anon,authenticated;

create function public.prepare_weekly_digest(p_start timestamptz,p_end timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare payload jsonb; run public.weekly_digest_runs;
begin
  if p_end-p_start <> interval '7 days' or p_end>now() then raise exception 'invalid period'; end if;
  perform public.prune_visitor_network();
  select jsonb_build_object(
    'start',p_start,'end',p_end,
    'messages',(select count(*) from public.visitor_messages where created_at>=p_start and created_at<p_end),
    'contact',(select count(*) from public.visitor_messages where kind='contact' and created_at>=p_start and created_at<p_end),
    'feedback',(select count(*) from public.visitor_messages where kind='feedback' and created_at>=p_start and created_at<p_end),
    'unread',(select count(*) from public.visitor_messages where status='new'),
    'updated_existing',(select count(*) from public.visitor_messages where created_at<p_start and updated_at>=p_start and updated_at<p_end),
    'visits',(select count(*) from public.visitor_visits where created_at>=p_start and created_at<p_end),
    'networks',(select count(distinct network_hash) from public.visitor_visits where created_at>=p_start and created_at<p_end),
    'locations',(select coalesce(jsonb_agg(x),'[]') from (
      select approximate_location->>'country' as country,count(*) as visits from public.visitor_visits
      where created_at>=p_start and created_at<p_end and approximate_location->>'country' is not null
      group by approximate_location->>'country' order by count(*) desc limit 10) x),
    'excerpts',(select coalesce(jsonb_agg(x),'[]') from (
      select id,kind,status,left(name,80) as name,left(message,160) as excerpt from public.visitor_messages
      where created_at>=p_start and created_at<p_end order by created_at desc,id limit 20) x)
  ) into payload;
  insert into public.weekly_digest_runs(period_start,period_end,snapshot) values(p_start,p_end,payload)
    on conflict do nothing;
  select * into run from public.weekly_digest_runs where period_start=p_start for update;
  if run.sent_at is not null then return jsonb_build_object('status','sent'); end if;
  if run.lease_until>now() then return jsonb_build_object('status','busy'); end if;
  -- Provider deduplication expires after 24h: ambiguous older sends need operator review.
  if run.first_attempt<now()-interval '23 hours' then return jsonb_build_object('status','review_required'); end if;
  update public.weekly_digest_runs set lease_until=now()+interval '5 minutes' where period_start=p_start;
  return jsonb_build_object('status','ready','snapshot',run.snapshot);
end; $$;
revoke all on function public.prepare_weekly_digest(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.prepare_weekly_digest(timestamptz,timestamptz) to service_role;

create function public.finish_weekly_digest(p_start timestamptz,p_provider_id text) returns void
language sql security definer set search_path = '' as $$
  update public.weekly_digest_runs set sent_at=now(),provider_id=p_provider_id,lease_until=null
    where period_start=p_start and sent_at is null;
$$;
revoke all on function public.finish_weekly_digest(timestamptz,text) from public,anon,authenticated;
grant execute on function public.finish_weekly_digest(timestamptz,text) to service_role;
commit;
