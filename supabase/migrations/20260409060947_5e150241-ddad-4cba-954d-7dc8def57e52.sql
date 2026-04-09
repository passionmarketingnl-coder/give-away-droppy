
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
