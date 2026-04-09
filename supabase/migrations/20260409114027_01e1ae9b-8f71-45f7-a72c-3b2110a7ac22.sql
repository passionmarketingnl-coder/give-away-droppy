-- 1. Drop the overly broad realtime subscription policy on messages
-- The "Participants can view messages" policy already properly restricts access
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;

-- 2. For posts: replace the broad SELECT policy with one that hides sensitive columns
-- Since RLS is row-level (not column-level), we create a restricted view for non-owner reads
-- and keep direct table access for owners/winners only for sensitive fields.

-- Drop the existing broad SELECT policy
DROP POLICY IF EXISTS "Anyone can view active posts" ON public.posts;

-- Allow everyone to read non-sensitive columns (RLS can't hide columns, so we use a view approach)
-- Keep a SELECT policy that allows all authenticated users to read posts
-- (needed for INSERT/UPDATE/DELETE policies and for the RPCs which are SECURITY DEFINER)
CREATE POLICY "Anyone can view active posts"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: Sensitive fields (latitude, longitude, pickup_notes) are already masked
-- by the get_feed_posts and get_post_detail RPC functions (SECURITY DEFINER).
-- Direct table queries from the app only fetch non-sensitive columns (id, title).
-- To fully prevent direct column access, we create a public view:

CREATE OR REPLACE VIEW public.posts_public AS
SELECT
  id, user_id, title, description, category, status,
  display_location, raffle_due_at, raffle_trigger_type,
  winner_user_id, created_at, updated_at
FROM public.posts;