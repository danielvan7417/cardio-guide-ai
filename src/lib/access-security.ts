import { z } from "zod";

export const passwordRequirements = [
  { label: "Mínimo 8 caracteres", valid: (value: string) => value.length >= 8 },
  { label: "Al menos un número", valid: (value: string) => /[0-9]/.test(value) },
  { label: "Al menos una mayúscula", valid: (value: string) => /\p{Lu}/u.test(value) },
  { label: "Al menos un carácter especial", valid: (value: string) => /[^\p{L}\p{N}\s]/u.test(value) },
];

export const signupSchema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido.").max(255),
  password: z.string().max(128).superRefine((value, context) => {
    for (const rule of passwordRequirements) {
      if (!rule.valid(value)) context.addIssue({ code: z.ZodIssueCode.custom, message: rule.label });
    }
  }),
  nombre: z.string().trim().max(100),
  consentimiento: z.literal(true),
});

export const LOGIN_LOCK_KEY = "ritmovital:login-cooldown";
export const MAX_FAILED_LOGINS = 5;
export const LOGIN_LOCK_MS = 60_000;
export type LoginAttempts = { failures: number; lockedUntil: number };
export const emptyAttempts: LoginAttempts = { failures: 0, lockedUntil: 0 };

export function normalizeAttempts(value: unknown, now: number): LoginAttempts {
  if (!value || typeof value !== "object" || !("failures" in value) || !("lockedUntil" in value)) return { ...emptyAttempts };
  const { failures, lockedUntil } = value;
  if (typeof failures !== "number" || !Number.isInteger(failures) || failures < 0 || failures > MAX_FAILED_LOGINS ||
    typeof lockedUntil !== "number" || !Number.isFinite(lockedUntil) || lockedUntil < 0) return { ...emptyAttempts };
  if (lockedUntil > 0 && lockedUntil <= now) return { ...emptyAttempts };
  return { failures, lockedUntil };
}

export function failedLogin(state: LoginAttempts, now: number): LoginAttempts {
  const current = normalizeAttempts(state, now);
  if (current.lockedUntil > now) return current;
  const failures = current.failures + 1;
  return failures >= MAX_FAILED_LOGINS
    ? { failures: MAX_FAILED_LOGINS, lockedUntil: now + LOGIN_LOCK_MS }
    : { failures, lockedUntil: 0 };
}

export function remainingLockSeconds(state: LoginAttempts, now: number) {
  return Math.max(0, Math.ceil((state.lockedUntil - now) / 1000));
}

export function isInvalidCredentials(error: { code?: string; message: string }) {
  return error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message);
}