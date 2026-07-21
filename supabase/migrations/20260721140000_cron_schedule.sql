-- ================================================================
-- Cron schedule + secret voor de 3 achtergrond edge functions.
-- run-raffle             elke 5 minuten
-- pickup-reminder        elk uur op :05
-- daily-neighborhood-update  elke dag om 07:00 UTC (~09:00 NL zomer)
--
-- De functions checken een X-Cron-Secret header. Dit geheim wordt in
-- public.app_config opgeslagen (single source of truth) en door
-- trigger_cron_function meegestuurd. Zonder juiste header → 401,
-- ook vanuit dashboard "invoke".
-- ================================================================

create extension if not exists pg_cron with schema extensions;

-- 1) Genereer een sterke random secret als hij nog niet bestaat.
insert into public.app_config (key, value)
select 'cron_secret', encode(gen_random_bytes(32), 'hex')
where not exists (select 1 from public.app_config where key = 'cron_secret');

-- 2) Helper function die de edge function POST'd met anon key + secret.
create or replace function public.trigger_cron_function(fn_name text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  base_url text;
  anon_key text;
  secret text;
begin
  select value into base_url from public.app_config where key = 'supabase_url';
  select value into anon_key from public.app_config where key = 'supabase_anon_key';
  select value into secret from public.app_config where key = 'cron_secret';

  if base_url is null or anon_key is null or secret is null then
    raise notice 'trigger_cron_function: config incompleet, skip %', fn_name;
    return;
  end if;

  perform net.http_post(
    url := base_url || '/functions/v1/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'X-Cron-Secret', secret
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- 3) Bestaande cron jobs met deze namen weggooien (idempotent bij herhaald draaien)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'run-raffle') then
    perform cron.unschedule('run-raffle');
  end if;
  if exists (select 1 from cron.job where jobname = 'pickup-reminder') then
    perform cron.unschedule('pickup-reminder');
  end if;
  if exists (select 1 from cron.job where jobname = 'daily-neighborhood-update') then
    perform cron.unschedule('daily-neighborhood-update');
  end if;
end $$;

-- 4) Nieuwe schedule
select cron.schedule(
  'run-raffle',
  '*/5 * * * *',
  $$select public.trigger_cron_function('run-raffle')$$
);

select cron.schedule(
  'pickup-reminder',
  '5 * * * *',
  $$select public.trigger_cron_function('pickup-reminder')$$
);

select cron.schedule(
  'daily-neighborhood-update',
  '0 7 * * *',
  $$select public.trigger_cron_function('daily-neighborhood-update')$$
);
