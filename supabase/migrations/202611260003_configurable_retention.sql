begin;
create table public.messaging_settings (
  singleton boolean primary key default true check (singleton),
  network_retention_days integer not null default 30 check (network_retention_days between 1 and 3650),
  visit_retention_days integer not null default 90 check (visit_retention_days between 1 and 3650)
);
insert into public.messaging_settings(singleton) values(true);
alter table public.messaging_settings enable row level security;
revoke all on public.messaging_settings from public,anon,authenticated;

create or replace function public.prune_visitor_network() returns void
language plpgsql security definer set search_path = '' as $$
declare network_days integer; visit_days integer;
begin
  select network_retention_days,visit_retention_days into strict network_days,visit_days
    from public.messaging_settings where singleton;
  update public.visitor_messages set reported_ip=null,approximate_location=null,network_recorded_at=null
    where network_recorded_at < now()-make_interval(days=>network_days);
  update public.visitor_visits set reported_ip=null,approximate_location=null,network_recorded_at=null
    where network_recorded_at < now()-make_interval(days=>network_days);
  delete from public.visitor_visits where created_at < now()-make_interval(days=>visit_days);
end; $$;
revoke all on function public.prune_visitor_network() from public,anon,authenticated;
grant execute on function public.prune_visitor_network() to service_role;
commit;
