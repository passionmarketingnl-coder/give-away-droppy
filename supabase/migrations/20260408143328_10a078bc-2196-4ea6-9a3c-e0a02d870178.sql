
-- 1. Restrict post_likes SELECT to own likes only
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Users can view own likes"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Create RPC for like counts (accessible to all authenticated users)
CREATE OR REPLACE FUNCTION public.get_post_likes_info(p_post_ids uuid[])
RETURNS TABLE(post_id uuid, like_count bigint, user_liked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pl.post_id,
    COUNT(*) FILTER (WHERE pl.is_valid) as like_count,
    COALESCE(BOOL_OR(pl.user_id = auth.uid() AND pl.is_valid), false) as user_liked
  FROM public.post_likes pl
  WHERE pl.post_id = ANY(p_post_ids)
  GROUP BY pl.post_id;
$$;

-- 3. Add storage UPDATE policy restricting to own folder
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 4. Enable Realtime RLS enforcement (messages table RLS already restricts to participants)
ALTER PUBLICATION supabase_realtime SET TABLE public.messages;
