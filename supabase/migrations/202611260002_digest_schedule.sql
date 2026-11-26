begin;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Vault holds the separate job credential; no service-role key in Cron text.
select cron.schedule('portfolio-weekly-digest','0 15 * * 1',$job$
  select net.http_post(
    url := 'https://bqdhhsrezdkaqvwgyncz.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets
        where name='portfolio_digest_job_secret' limit 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$job$);

select cron.schedule('portfolio-network-retention','20 4 * * *',
  'select public.prune_visitor_network();');
commit;
