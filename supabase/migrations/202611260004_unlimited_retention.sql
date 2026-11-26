begin;
-- NULL explicitly means no automatic expiry; finite periods retain their bounds.
alter table public.messaging_settings
  alter column network_retention_days drop not null,
  alter column visit_retention_days drop not null;
comment on column public.messaging_settings.network_retention_days is 'NULL means no automatic IP/location expiry; otherwise days from network_recorded_at.';
comment on column public.messaging_settings.visit_retention_days is 'NULL means no automatic visit deletion; otherwise days from created_at.';
create or replace function public.prune_visitor_network() returns void
language plpgsql security definer set search_path = '' as $$
declare network_days integer; visit_days integer;
begin
  select network_retention_days,visit_retention_days into strict network_days,visit_days
    from public.messaging_settings where singleton;
  if network_days is not null then
    update public.visitor_messages set reported_ip=null,approximate_location=null,network_recorded_at=null
      where network_recorded_at < now()-make_interval(days=>network_days);
    update public.visitor_visits set reported_ip=null,approximate_location=null,network_recorded_at=null
      where network_recorded_at < now()-make_interval(days=>network_days);
  end if;
  if visit_days is not null then
    delete from public.visitor_visits where created_at < now()-make_interval(days=>visit_days);
  end if;
end; $$;
revoke all on function public.prune_visitor_network() from public,anon,authenticated;
grant execute on function public.prune_visitor_network() to service_role;
commit;
