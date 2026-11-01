/*
# Add personal heart-rate alert threshold to profiles

1. Modified Tables
- `profiles`: new column `umbral_alerta_bpm` (integer, not null, default 120). This is the pulse value at or above which the app raises a heart-rate alert for that person.

2. Notes
- Existing profiles receive the default of 120 BPM automatically, so current behavior does not change until a user adjusts it.
- A check constraint keeps the value between 60 and 220 BPM.
- Table-level grants and row-level policies on `profiles` already cover the new column, so no security changes are needed.
*/

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS umbral_alerta_bpm integer NOT NULL DEFAULT 120;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_umbral_alerta_bpm_rango'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_umbral_alerta_bpm_rango CHECK (umbral_alerta_bpm BETWEEN 60 AND 220);
  END IF;
END $$;
