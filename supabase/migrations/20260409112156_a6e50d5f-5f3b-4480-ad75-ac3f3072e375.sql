-- Drop the overly permissive realtime subscription policy on messages
-- The existing "Participants can view messages" policy already properly restricts
-- message access to conversation participants via a JOIN on conversations.
-- The bad policy used a broad EXISTS + topic match that allowed cross-conversation snooping.
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;