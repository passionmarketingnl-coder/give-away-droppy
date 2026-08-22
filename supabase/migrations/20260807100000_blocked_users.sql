-- ================================================================
-- Blokkeer-functionaliteit (App Store 1.2 UGC-vereiste: gebruikers
-- moeten andere gebruikers kunnen blokkeren).
--
-- Client filtert feed, comments en chats op deze lijst.
--
-- LET OP: niet via `supabase db push` draaien (historie out-of-sync);
-- direct uitgevoerd via `supabase db query --linked` op 2026-08-07.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own blocks" ON public.blocked_users
  FOR SELECT TO authenticated USING (auth.uid() = blocker_user_id);

CREATE POLICY "Users create own blocks" ON public.blocked_users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_user_id);

CREATE POLICY "Users delete own blocks" ON public.blocked_users
  FOR DELETE TO authenticated USING (auth.uid() = blocker_user_id);
