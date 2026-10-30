import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { signupSchema } from "./access-security";

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("No se pudo conectar con el servicio de registro.");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const origin = getRequest().headers.get("origin");
    if (!origin) throw new Error("No se pudo verificar el origen del registro.");
    const { data: result, error } = await client.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: new URL(origin).origin, data: { nombre: data.nombre, consentimiento: true } },
    });
    if (error) return { error: error.message, session: null };
    return {
      error: null,
      session: result.session ? { access_token: result.session.access_token, refresh_token: result.session.refresh_token } : null,
    };
  });