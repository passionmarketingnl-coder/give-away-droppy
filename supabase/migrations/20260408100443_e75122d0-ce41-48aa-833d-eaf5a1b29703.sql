
-- Add new enum values
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'daily_update';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'pickup_confirm';

-- Trigger function: notification on new comment on your post
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post RECORD;
  v_commenter RECORD;
  v_parent_comment RECORD;
  v_parent_author_id uuid;
BEGIN
  -- Get post info
  SELECT id, user_id, title INTO v_post FROM posts WHERE id = NEW.post_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Get commenter name
  SELECT first_name INTO v_commenter FROM profiles WHERE id = NEW.user_id;

  -- Case 1: Reply to a comment (parent_id is set)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_author_id FROM comments WHERE id = NEW.parent_id;
    -- Don't notify yourself
    IF v_parent_author_id IS NOT NULL AND v_parent_author_id <> NEW.user_id THEN
      -- Check no duplicate
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = v_parent_author_id 
          AND type = 'reply' 
          AND post_id = NEW.post_id
          AND body = COALESCE(v_commenter.first_name, 'Iemand') || ' reageerde op jouw reactie bij ' || v_post.title
          AND created_at > now() - interval '1 minute'
      ) THEN
        INSERT INTO notifications (user_id, type, title, body, post_id)
        VALUES (
          v_parent_author_id,
          'reply',
          'Reactie op jouw reactie ↩️',
          COALESCE(v_commenter.first_name, 'Iemand') || ' reageerde op jouw reactie bij ' || v_post.title,
          NEW.post_id
        );
      END IF;
    END IF;
  END IF;

  -- Case 2: Comment on post (notify post owner, not if commenter is owner, not if already notified as reply)
  IF v_post.user_id <> NEW.user_id THEN
    -- Don't double-notify if the post owner is also the parent comment author
    IF NEW.parent_id IS NULL OR v_post.user_id <> COALESCE(v_parent_author_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = v_post.user_id 
          AND type = 'comment' 
          AND post_id = NEW.post_id
          AND body = COALESCE(v_commenter.first_name, 'Iemand') || ' reageerde op jouw ' || v_post.title
          AND created_at > now() - interval '1 minute'
      ) THEN
        INSERT INTO notifications (user_id, type, title, body, post_id)
        VALUES (
          v_post.user_id,
          'comment',
          'Nieuwe reactie 💬',
          COALESCE(v_commenter.first_name, 'Iemand') || ' reageerde op jouw ' || v_post.title,
          NEW.post_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function: notification on new chat message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_convo RECORD;
  v_recipient_id uuid;
  v_sender RECORD;
BEGIN
  -- Get conversation
  SELECT poster_user_id, winner_user_id INTO v_convo FROM conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Determine recipient
  IF NEW.sender_user_id = v_convo.poster_user_id THEN
    v_recipient_id := v_convo.winner_user_id;
  ELSE
    v_recipient_id := v_convo.poster_user_id;
  END IF;

  -- Don't notify yourself
  IF v_recipient_id = NEW.sender_user_id THEN RETURN NEW; END IF;

  -- Get sender name
  SELECT first_name INTO v_sender FROM profiles WHERE id = NEW.sender_user_id;

  -- Dedup: don't send if same notification in last minute
  IF NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = v_recipient_id
      AND type = 'chat_message'
      AND post_id = (SELECT post_id FROM conversations WHERE id = NEW.conversation_id)
      AND created_at > now() - interval '1 minute'
  ) THEN
    INSERT INTO notifications (user_id, type, title, body, post_id)
    VALUES (
      v_recipient_id,
      'chat_message',
      'Nieuw bericht 💌',
      COALESCE(v_sender.first_name, 'Iemand') || ' stuurde je een bericht',
      (SELECT post_id FROM conversations WHERE id = NEW.conversation_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the triggers
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

CREATE TRIGGER on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_message();
