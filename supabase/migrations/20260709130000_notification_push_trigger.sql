-- Trigger dat na een INSERT op public.notifications een HTTP POST doet naar
-- de send-push edge function via pg_net. De edge function ziet dan de nieuwe
-- notification_id, haalt de user_push_tokens op en stuurt push naar alle
-- actieve devices via de Expo Push API.
--
-- pg_net is standaard beschikbaar in Supabase. De function-URL en anon-key
-- worden opgeslagen in de public.app_config tabel zodat deze bij een project-
-- verhuis makkelijk aangepast kunnen worden zonder migratie te wijzigen.

create extension if not exists pg_net;

-- Config tabel voor runtime settings die niet in code horen (URL van edge
-- functions, anon key). Alleen service_role mag hier bij.
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

-- Geen SELECT policy voor anon/authenticated → alleen service_role kan bij
-- (via de trigger die security definer is).

-- Zorg dat de vereiste keys aanwezig zijn (idempotent).
insert into public.app_config (key, value) values
  ('supabase_url', 'https://coaegkysijwigkhjhsdx.supabase.co'),
  ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWVna3lzaWp3aWdraGpoc2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MjQ2MzMsImV4cCI6MjA3MjIwMDYzM30.82sPpm21MrREIBq9B7Ih17JtOplo7J6I36thSvcLoCI')
on conflict (key) do nothing;

create or replace function public.trigger_send_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_url text;
  anon_key text;
begin
  select value into base_url from public.app_config where key = 'supabase_url';
  select value into anon_key from public.app_config where key = 'supabase_anon_key';

  if base_url is null or anon_key is null then
    -- Geen config → skip stil zodat notification-insert niet faalt
    return new;
  end if;

  perform net.http_post(
    url := base_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('notification_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists send_push_on_notification on public.notifications;
create trigger send_push_on_notification
  after insert on public.notifications
  for each row execute function public.trigger_send_push();
