
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
