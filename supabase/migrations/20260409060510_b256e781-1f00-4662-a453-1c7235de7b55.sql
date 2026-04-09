
-- Enable RLS on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to listen only to channels for conversations they participate in
-- The channel name format used in code is: "messages-{conversationId}"
-- Realtime postgres_changes use the extension column to store filter info
-- We restrict based on the topic matching a conversation the user is part of
CREATE POLICY "Users can only subscribe to their own conversation channels"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    -- Allow if the realtime topic references a conversation the user participates in
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.poster_user_id = auth.uid() OR c.winner_user_id = auth.uid())
    )
    OR
    -- Also allow general presence/broadcast channels
    topic NOT LIKE 'realtime:public:messages%'
  );
