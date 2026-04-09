
-- 1. Protect raffle-sensitive columns from direct user manipulation
-- Only service_role (used by edge functions) can change these columns
CREATE OR REPLACE FUNCTION public.protect_raffle_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to make any changes (edge functions, triggers)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For regular users: prevent changes to raffle-sensitive columns
  IF NEW.winner_user_id IS DISTINCT FROM OLD.winner_user_id THEN
    NEW.winner_user_id := OLD.winner_user_id;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Users can only set status to 'removed' (delete their own post)
    IF NEW.status = 'removed' AND OLD.status = 'active' THEN
      -- Allow: owner cancelling their active post
      NULL;
    ELSE
      NEW.status := OLD.status;
    END IF;
  END IF;

  IF NEW.raffle_due_at IS DISTINCT FROM OLD.raffle_due_at THEN
    NEW.raffle_due_at := OLD.raffle_due_at;
  END IF;

  IF NEW.raffle_trigger_type IS DISTINCT FROM OLD.raffle_trigger_type THEN
    NEW.raffle_trigger_type := OLD.raffle_trigger_type;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_raffle_columns
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_raffle_columns();

-- 2. Drop the lingering overly broad realtime subscription policy on messages
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;
