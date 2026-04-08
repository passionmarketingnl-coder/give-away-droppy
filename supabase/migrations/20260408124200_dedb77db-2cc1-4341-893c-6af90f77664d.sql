
CREATE OR REPLACE FUNCTION public.prevent_is_banned_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent any user from changing is_banned on their own profile
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    NEW.is_banned := OLD.is_banned;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_is_banned_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_is_banned_change();
