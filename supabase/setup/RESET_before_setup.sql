-- ================================================================
-- RESET script voor Droppi Supabase project.
-- Draai dit EENMALIG voordat je 00_full_schema.sql runt op een
-- project met bestaande resten (bijv. na een half-gemislukte
-- eerdere setup). Dropt alles in het public schema.
--
-- Storage buckets kunnen niet direct via SQL worden gedropt door
-- Supabase's protect_delete trigger. Als de post-images bucket al
-- bestaat, verwijder hem handmatig via het Storage dashboard:
-- https://supabase.com/dashboard/project/coaegkysijwigkhjhsdx/storage/buckets
-- Op een fresh project bestaat de bucket nog niet, dus dan is er
-- niks te verwijderen.
-- ================================================================

drop schema if exists public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to public;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
