-- Fix: Make the view SECURITY INVOKER so it respects RLS of the calling user
DROP VIEW IF EXISTS public.posts_public;

CREATE VIEW public.posts_public
WITH (security_invoker = true) AS
SELECT
  id, user_id, title, description, category, status,
  display_location, raffle_due_at, raffle_trigger_type,
  winner_user_id, created_at, updated_at
FROM public.posts;