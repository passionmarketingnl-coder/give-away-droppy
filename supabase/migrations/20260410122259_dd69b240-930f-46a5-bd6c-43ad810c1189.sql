-- Drop the overly permissive realtime subscription policy
-- The "Participants can view messages" SELECT policy already correctly scopes
-- message access to the specific conversation the user is a participant in.
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;