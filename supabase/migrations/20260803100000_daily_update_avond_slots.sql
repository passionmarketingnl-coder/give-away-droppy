-- ================================================================
-- Daily neighborhood update: van 07:00 UTC (1 batch) naar gespreide
-- avond-slots. Cron vuurt elke 15 min tussen 16:00-18:45 UTC
-- (= 18:00-20:45 NL in de zomer, 17:00-19:45 in de winter).
--
-- De edge function bepaalt per aanroep het actieve slot (0-11) uit de
-- UTC-tijd en verstuurt alleen naar gebruikers wiens id-hash op dat
-- slot valt. Zo krijgt elke gebruiker de update dagelijks rond
-- hetzelfde eigen moment en is er geen piek van pushes tegelijk.
--
-- LET OP: niet via `supabase db push` draaien (historie out-of-sync);
-- deze SQL is direct via `supabase db query --linked` uitgevoerd op
-- 2026-08-03. Dit bestand dient als documentatie/single source.
-- ================================================================

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-neighborhood-update') then
    perform cron.unschedule('daily-neighborhood-update');
  end if;
end $$;

select cron.schedule(
  'daily-neighborhood-update',
  '0,15,30,45 16-18 * * *',
  $$select public.trigger_cron_function('daily-neighborhood-update')$$
);
