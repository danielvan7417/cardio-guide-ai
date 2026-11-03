-- Los perfiles nuevos no deben nacer con datos biométricos ficticios.
ALTER TABLE public.profiles ALTER COLUMN edad SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN tipo_sangre SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN peso SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN estatura SET DEFAULT 0;

-- Reinicia solo las cuentas que nunca editaron sus datos y conservan el
-- combo exacto que asignaban los valores antiguos por defecto.
UPDATE public.profiles
SET edad = 0, tipo_sangre = '', peso = 0, estatura = 0
WHERE edad = 30 AND tipo_sangre = 'O+' AND peso = 70 AND estatura = 1.70;