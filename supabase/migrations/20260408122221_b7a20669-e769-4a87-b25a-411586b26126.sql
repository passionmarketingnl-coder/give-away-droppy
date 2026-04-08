
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  display_location,
  is_banned,
  created_at
FROM public.profiles;
