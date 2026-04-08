
-- 1. Create a public_profiles view exposing only safe fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  display_location,
  is_banned,
  created_at
FROM public.profiles;

-- 2. Restrict the base profiles SELECT to owner only
DROP POLICY "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Fix storage upload path ownership
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
