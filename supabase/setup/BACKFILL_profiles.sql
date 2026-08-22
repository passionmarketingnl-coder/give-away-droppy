-- ================================================================
-- Fix voor "posts_user_id_profiles_fkey" violation bij post aanmaken.
--
-- 1) Backfill: maak public.profiles rijen aan voor auth.users die er
--    (nog) geen hebben.
-- 2) Zorg dat de trigger on_auth_user_created bestaat + de function
--    idempotent is (ON CONFLICT DO NOTHING) zodat toekomstige signups
--    ook niet meer klappen als de trigger 2x fires of ergens al een
--    profiles rij bestaat.
-- ================================================================

-- Idempotente function: zelfde als 20260304165019_...sql maar met
-- ON CONFLICT om FK-error-loops te voorkomen als profile al bestaat.
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Trigger herstellen (drop+create voor de zekerheid).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missende profiles voor alle bestaande auth.users.
INSERT INTO public.profiles (id, phone, first_name, last_name, postcode, house_number)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'phone_number', u.phone),
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  u.raw_user_meta_data->>'postcode',
  u.raw_user_meta_data->>'house_number'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
