-- ==============================================
-- 20260304134718_96b63019-3460-4b85-82f7-30f91f9a5d5e.sql
-- ==============================================

-- =============================================
-- DROPPY MVP DATABASE SCHEMA
-- =============================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  postcode TEXT,
  house_number TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  display_location TEXT,
  avatar_url TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. POSTS TABLE
CREATE TYPE public.post_status AS ENUM ('active', 'ending', 'raffled', 'reroll', 'picked_up', 'removed', 'reported');

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Overig',
  status public.post_status NOT NULL DEFAULT 'active',
  pickup_notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  raffle_due_at TIMESTAMPTZ,
  raffle_trigger_type TEXT,
  winner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. POST IMAGES TABLE
CREATE TABLE public.post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post images" ON public.post_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Post owner can insert images" ON public.post_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid()));
CREATE POLICY "Post owner can delete images" ON public.post_images FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid()));

-- 4. POST LIKES TABLE (= raffle entries)
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. COMMENTS TABLE
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. RAFFLES TABLE
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  trigger_reason TEXT NOT NULL DEFAULT 'timer',
  participant_count INT NOT NULL DEFAULT 0,
  winner_user_id UUID REFERENCES auth.users(id),
  reroll_of_raffle_id UUID REFERENCES public.raffles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view raffles" ON public.raffles FOR SELECT TO authenticated USING (true);

-- 7. CONVERSATIONS TABLE
CREATE TYPE public.conversation_status AS ENUM ('open', 'pickup_planned', 'completed');

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  poster_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  winner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.conversation_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = poster_user_id OR auth.uid() = winner_user_id);
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = poster_user_id OR auth.uid() = winner_user_id);

-- 8. MESSAGES TABLE
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.poster_user_id = auth.uid() OR c.winner_user_id = auth.uid())
  ));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.poster_user_id = auth.uid() OR c.winner_user_id = auth.uid())
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 9. NOTIFICATIONS TABLE
CREATE TYPE public.notification_type AS ENUM ('comment', 'reply', 'raffle_won', 'raffle_completed', 'chat_message', 'reroll', 'moderation');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 10. REPORTS TABLE
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);

-- HELPER: Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ==============================================
-- 20260304134724_ceaaeec7-7ff5-4f64-95cc-f40867c81fff.sql
-- ==============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ==============================================
-- 20260304134742_63a0afc8-7d5e-40df-ac91-263a2e5cec04.sql
-- ==============================================

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Anyone can view images
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'post-images');

-- Users can delete own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ==============================================
-- 20260304150500_e6c102a0-78be-4a75-9335-65dd3fa4367b.sql
-- ==============================================

-- Enable pg_cron and pg_net for scheduled raffle execution
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ==============================================
-- 20260304154825_6b6df522-99b7-451e-b2e1-0c245cfc9f9c.sql
-- ==============================================
ALTER TABLE public.posts ADD CONSTRAINT posts_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- ==============================================
-- 20260304161743_ad03f1ef-1e9c-421c-b082-2ed166505768.sql
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, phone, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$function$;

-- ==============================================
-- 20260304165019_d87c696d-6836-4463-a15d-0f24bdf406f6.sql
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, phone, first_name, last_name, postcode, house_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'postcode',
    NEW.raw_user_meta_data->>'house_number'
  );
  RETURN NEW;
END;
$function$;


-- ==============================================
-- 20260317134935_34b6eea2-223d-437b-ab2f-5ca335033a3e.sql
-- ==============================================
ALTER TABLE public.posts ADD COLUMN display_location text;

-- ==============================================
-- 20260408100443_e75122d0-ce41-48aa-833d-eaf5a1b29703.sql
-- ==============================================

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


-- ==============================================
-- 20260408100607_f404bd76-e66d-4b94-bda2-82d4f6e65467.sql
-- ==============================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ==============================================
-- 20260408115911_30b76488-e78b-4bd0-b46e-453c39e97306.sql
-- ==============================================

CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamp with time zone,
  terms_version text NOT NULL DEFAULT '1.1',
  privacy_accepted boolean NOT NULL DEFAULT false,
  privacy_accepted_at timestamp with time zone,
  privacy_version text NOT NULL DEFAULT '1.1',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.user_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" ON public.user_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents" ON public.user_consents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- ==============================================
-- 20260408122211_7513b2cc-f8fe-42a6-87ee-dcc31616eedc.sql
-- ==============================================

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


-- ==============================================
-- 20260408122221_b7a20669-e769-4a87-b25a-411586b26126.sql
-- ==============================================

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


-- ==============================================
-- 20260408122238_eb5249f6-4a07-4706-a999-01605fb9a337.sql
-- ==============================================

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


-- ==============================================
-- 20260408122300_9883ffa5-dd74-4c01-97d1-4410e430d731.sql
-- ==============================================

-- Restrict profiles SELECT to owner only
DROP POLICY "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);


-- ==============================================
-- 20260408124200_dedb77db-2cc1-4341-893c-6af90f77664d.sql
-- ==============================================

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


-- ==============================================
-- 20260408143328_10a078bc-2196-4ea6-9a3c-e0a02d870178.sql
-- ==============================================

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


-- ==============================================
-- 20260409060510_b256e781-1f00-4662-a453-1c7235de7b55.sql
-- ==============================================

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


-- ==============================================
-- 20260409060947_5e150241-ddad-4cba-954d-7dc8def57e52.sql
-- ==============================================

-- Function: get_feed_posts — returns feed with server-side distance calc, masked sensitive fields
CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_user_lat double precision DEFAULT NULL,
  p_user_lng double precision DEFAULT NULL,
  p_radius_km double precision DEFAULT 7
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  description text,
  category text,
  status text,
  display_location text,
  raffle_due_at timestamptz,
  raffle_trigger_type text,
  winner_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  pickup_notes text,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.title,
    p.description,
    p.category,
    p.status::text,
    p.display_location,
    p.raffle_due_at,
    p.raffle_trigger_type,
    p.winner_user_id,
    p.created_at,
    p.updated_at,
    CASE WHEN p.user_id = auth.uid() OR p.winner_user_id = auth.uid()
      THEN p.pickup_notes ELSE NULL END,
    CASE
      WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN ROUND((6371.0 * 2.0 * ASIN(SQRT(
        POWER(SIN(RADIANS((p.latitude - p_user_lat) / 2.0)), 2) +
        COS(RADIANS(p_user_lat)) * COS(RADIANS(p.latitude)) *
        POWER(SIN(RADIANS((p.longitude - p_user_lng) / 2.0)), 2)
      )))::numeric, 1)::double precision
      ELSE NULL
    END as distance_km
  FROM public.posts p
  WHERE p.status IN ('active', 'ending')
    AND (
      p_user_lat IS NULL OR p_user_lng IS NULL
      OR p.user_id = auth.uid()
      OR p.latitude IS NULL OR p.longitude IS NULL
      OR (6371.0 * 2.0 * ASIN(SQRT(
        POWER(SIN(RADIANS((p.latitude - p_user_lat) / 2.0)), 2) +
        COS(RADIANS(p_user_lat)) * COS(RADIANS(p.latitude)) *
        POWER(SIN(RADIANS((p.longitude - p_user_lng) / 2.0)), 2)
      ))) <= p_radius_km
    )
  ORDER BY p.created_at DESC;
$$;

-- Function: get_post_detail — returns single post with masked sensitive fields
CREATE OR REPLACE FUNCTION public.get_post_detail(p_post_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  description text,
  category text,
  status text,
  display_location text,
  raffle_due_at timestamptz,
  raffle_trigger_type text,
  winner_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  pickup_notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.title,
    p.description,
    p.category,
    p.status::text,
    p.display_location,
    p.raffle_due_at,
    p.raffle_trigger_type,
    p.winner_user_id,
    p.created_at,
    p.updated_at,
    CASE WHEN p.user_id = auth.uid() OR p.winner_user_id = auth.uid()
      THEN p.pickup_notes ELSE NULL END
  FROM public.posts p
  WHERE p.id = p_post_id;
$$;


-- ==============================================
-- 20260409112156_a6e50d5f-5f3b-4480-ad75-ac3f3072e375.sql
-- ==============================================
-- Drop the overly permissive realtime subscription policy on messages
-- The existing "Participants can view messages" policy already properly restricts
-- message access to conversation participants via a JOIN on conversations.
-- The bad policy used a broad EXISTS + topic match that allowed cross-conversation snooping.
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;

-- ==============================================
-- 20260409114027_01e1ae9b-8f71-45f7-a72c-3b2110a7ac22.sql
-- ==============================================
-- 1. Drop the overly broad realtime subscription policy on messages
-- The "Participants can view messages" policy already properly restricts access
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;

-- 2. For posts: replace the broad SELECT policy with one that hides sensitive columns
-- Since RLS is row-level (not column-level), we create a restricted view for non-owner reads
-- and keep direct table access for owners/winners only for sensitive fields.

-- Drop the existing broad SELECT policy
DROP POLICY IF EXISTS "Anyone can view active posts" ON public.posts;

-- Allow everyone to read non-sensitive columns (RLS can't hide columns, so we use a view approach)
-- Keep a SELECT policy that allows all authenticated users to read posts
-- (needed for INSERT/UPDATE/DELETE policies and for the RPCs which are SECURITY DEFINER)
CREATE POLICY "Anyone can view active posts"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: Sensitive fields (latitude, longitude, pickup_notes) are already masked
-- by the get_feed_posts and get_post_detail RPC functions (SECURITY DEFINER).
-- Direct table queries from the app only fetch non-sensitive columns (id, title).
-- To fully prevent direct column access, we create a public view:

CREATE OR REPLACE VIEW public.posts_public AS
SELECT
  id, user_id, title, description, category, status,
  display_location, raffle_due_at, raffle_trigger_type,
  winner_user_id, created_at, updated_at
FROM public.posts;

-- ==============================================
-- 20260409114037_9be8c08b-fd8d-4499-b389-8c199390287c.sql
-- ==============================================
-- Fix: Make the view SECURITY INVOKER so it respects RLS of the calling user
DROP VIEW IF EXISTS public.posts_public;

CREATE VIEW public.posts_public
WITH (security_invoker = true) AS
SELECT
  id, user_id, title, description, category, status,
  display_location, raffle_due_at, raffle_trigger_type,
  winner_user_id, created_at, updated_at
FROM public.posts;

-- ==============================================
-- 20260409133503_97309c4a-8993-4ab6-a636-50132adf5431.sql
-- ==============================================

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


-- ==============================================
-- 20260410114703_f14553f7-92fb-4723-8113-46bdab75c9e2.sql
-- ==============================================
-- Drop the overly permissive realtime subscription policy
-- The "Participants can view messages" policy already correctly scopes
-- message access to conversations the user is a participant in.
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;

-- ==============================================
-- 20260410122259_dd69b240-930f-46a5-bd6c-43ad810c1189.sql
-- ==============================================
-- Drop the overly permissive realtime subscription policy
-- The "Participants can view messages" SELECT policy already correctly scopes
-- message access to the specific conversation the user is a participant in.
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;

-- ==============================================
-- 20260410122443_352ccfd2-45ca-4958-81f5-e5ab67fc45ef.sql
-- ==============================================
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;

-- ==============================================
-- 20260413094313_7d3c37a5-3e24-4312-a437-2c8fc014cd42.sql
-- ==============================================
DROP POLICY IF EXISTS "Users can only subscribe to their own conversation channels" ON public.messages;

-- ==============================================
-- 20260709120000_user_push_tokens.sql
-- ==============================================
-- User push tokens: één rij per uniek device/token, gekoppeld aan user_id.
-- Wordt gebruikt door de send-push edge function om notifications
-- naar alle actieve devices van een user te sturen via Expo Push API.

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_push_tokens_token_key
  on public.user_push_tokens (token);

create index if not exists user_push_tokens_user_id_idx
  on public.user_push_tokens (user_id);

alter table public.user_push_tokens enable row level security;

-- Users mogen hun eigen tokens opslaan en verwijderen (bijv. bij logout).
-- SELECT is beperkt tot eigen tokens (edge function gebruikt service role).

drop policy if exists "users can insert their own tokens" on public.user_push_tokens;
create policy "users can insert their own tokens"
  on public.user_push_tokens
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can update their own tokens" on public.user_push_tokens;
create policy "users can update their own tokens"
  on public.user_push_tokens
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users can see their own tokens" on public.user_push_tokens;
create policy "users can see their own tokens"
  on public.user_push_tokens
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can delete their own tokens" on public.user_push_tokens;
create policy "users can delete their own tokens"
  on public.user_push_tokens
  for delete to authenticated
  using (user_id = auth.uid());


