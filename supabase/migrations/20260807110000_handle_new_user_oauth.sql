-- ================================================================
-- handle_new_user: ook namen uit OAuth-metadata halen.
-- E-mail registratie zet first_name/last_name in raw_user_meta_data;
-- Google levert full_name/name. Apple levert de naam alleen client-side
-- bij de eerste login (de app schrijft die zelf naar het profiel).
--
-- LET OP: niet via `supabase db push` draaien (historie out-of-sync);
-- direct uitgevoerd via `supabase db query -f ... --linked` op 2026-08-07.
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_full text;
  v_first text;
  v_last text;
BEGIN
  v_full := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    ''
  );

  v_first := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(split_part(v_full, ' ', 1), ''),
    ''
  );

  v_last := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NULLIF(substring(v_full from position(' ' in v_full) + 1), v_full), ''),
    ''
  );

  INSERT INTO public.profiles (id, phone, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone),
    v_first,
    v_last
  );
  RETURN NEW;
END;
$function$;
