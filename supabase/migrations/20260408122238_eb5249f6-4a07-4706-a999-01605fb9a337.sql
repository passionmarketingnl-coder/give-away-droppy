
-- Restore the broad SELECT policy (needed for own profile reads and DB triggers)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Drop the view approach since it doesn't work with security invoker + restricted RLS
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function that returns only safe profile fields
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  display_location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.first_name, p.last_name, p.avatar_url, p.display_location
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$;
