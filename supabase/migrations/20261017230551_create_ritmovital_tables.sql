/*
# Create RitmoVital tables (profiles, mediciones, sintomas)

1. New Tables
- `profiles` — user biometric profile, 1:1 with auth.users. Columns: id (FK auth.users), nombre, correo, edad, tipo_sangre, peso, estatura, consentimiento, created_at, updated_at.
- `mediciones` — heart-rate measurements. Columns: id, user_id (owner), titulo, bpm, contexto, origen, created_at.
- `sintomas` — symptom diary entries. Columns: id, user_id (owner), bpm, contexto, sintomas (text[]), nota, created_at.

2. Security
- RLS enabled on all three tables.
- 4 separate ownership-scoped policies (select/insert/update/delete) on mediciones and sintomas, scoped TO authenticated with auth.uid() = user_id.
- profiles: select/insert/update scoped to auth.uid() = id (no delete — profiles cascade from auth.users).
- user_id columns default to auth.uid() so inserts that omit user_id still pass WITH CHECK.

3. Functions / Triggers
- handle_new_user(): SECURITY DEFINER trigger that auto-creates a profiles row when a new auth.users row is inserted (sign-up).
- touch_updated_at(): trigger that bumps profiles.updated_at on UPDATE.
- updated_at increment helper function.

4. Notes
- Idempotent: uses IF NOT EXISTS for tables/indexes/functions, DROP POLICY IF EXISTS before each CREATE POLICY.
- Triggers use DROP TRIGGER IF EXISTS before CREATE.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  correo text NOT NULL DEFAULT '',
  edad integer NOT NULL DEFAULT 30,
  tipo_sangre text NOT NULL DEFAULT 'O+',
  peso numeric(5,1) NOT NULL DEFAULT 70,
  estatura numeric(3,2) NOT NULL DEFAULT 1.70,
  consentimiento boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mediciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT 'Medición',
  bpm integer NOT NULL,
  contexto text NOT NULL DEFAULT 'Reposo',
  origen text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sintomas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bpm integer NOT NULL,
  contexto text NOT NULL DEFAULT 'Reposo',
  sintomas text[] NOT NULL DEFAULT ARRAY['Ninguno'],
  nota text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mediciones_user_idx ON public.mediciones(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sintomas_user_idx ON public.sintomas(user_id, created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sintomas ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- mediciones policies
DROP POLICY IF EXISTS "select_own_mediciones" ON public.mediciones;
CREATE POLICY "select_own_mediciones" ON public.mediciones FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mediciones" ON public.mediciones;
CREATE POLICY "insert_own_mediciones" ON public.mediciones FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mediciones" ON public.mediciones;
CREATE POLICY "update_own_mediciones" ON public.mediciones FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mediciones" ON public.mediciones;
CREATE POLICY "delete_own_mediciones" ON public.mediciones FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- sintomas policies
DROP POLICY IF EXISTS "select_own_sintomas" ON public.sintomas;
CREATE POLICY "select_own_sintomas" ON public.sintomas FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sintomas" ON public.sintomas;
CREATE POLICY "insert_own_sintomas" ON public.sintomas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sintomas" ON public.sintomas;
CREATE POLICY "update_own_sintomas" ON public.sintomas FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sintomas" ON public.sintomas;
CREATE POLICY "delete_own_sintomas" ON public.sintomas FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, correo, nombre, consentimiento)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
          COALESCE((NEW.raw_user_meta_data->>'consentimiento')::boolean, false));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mediciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sintomas TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.mediciones TO service_role;
GRANT ALL ON public.sintomas TO service_role;
