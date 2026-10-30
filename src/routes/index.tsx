import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Onda } from "@/components/Onda";
import { Button } from "@/components/ui/button";
import { isInvalidCredentials, MAX_FAILED_LOGINS, passwordRequirements, signupSchema } from "@/lib/access-security";
import { useLoginCooldown } from "@/lib/use-login-cooldown";
import { registerAccount } from "@/lib/registration.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — RitmoVital" },
      {
        name: "description",
        content:
          "Accede a RitmoVital para monitorear tu frecuencia cardíaca en tiempo real, registrar síntomas y generar reportes clínicos.",
      },
      { property: "og:title", content: "Iniciar sesión — RitmoVital" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Monitoreo clínico de salud cardíaca en tiempo real con asistente de IA local.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "registro" | "recuperar">("entrar");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [consiente, setConsiente] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inFlight = useRef(false);
  const cooldown = useLoginCooldown();
  const register = useServerFn(registerAccount);
  const passwordValid = passwordRequirements.every((rule) => rule.valid(clave));

  const cambiarModo = (nuevo: typeof modo) => {
    setModo(nuevo);
    setError("");
    setInfo("");
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/inicio", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === "SIGNED_IN" && s) navigate({ to: "/inicio", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current || !cooldown.ready) return;
    setError("");
    setInfo("");
    if (modo === "entrar" && cooldown.check() > 0) return;
    if (!correo.trim().includes("@")) return setError("Ingresa un correo electrónico válido.");
    if (modo === "entrar" && !clave) return setError("Ingresa tu contraseña.");
    if (modo === "registro" && !consiente)
      return setError("Debes aceptar el tratamiento de datos (Ley 1581 de 2012).");
    const signup = modo === "registro"
      ? signupSchema.safeParse({ email: correo, password: clave, nombre, consentimiento: consiente })
      : null;
    if (signup && !signup.success) return setError(signup.error.issues.map((issue) => issue.message).join(". "));
    inFlight.current = true;
    setEnviando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
        if (error) {
          if (isInvalidCredentials(error)) cooldown.fail();
          throw error;
        }
        cooldown.reset();
      } else if (modo === "registro") {
        if (!signup?.success) return;
        const result = await register({ data: signup.data });
        if (result.error) throw new Error(result.error);
        if (result.session) {
          const { error } = await supabase.auth.setSession(result.session);
          if (error) throw error;
        } else {
          setInfo("Cuenta creada. Revisa tu correo y confirma tu cuenta para ingresar.");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(correo, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Te enviamos un enlace para restablecer tu contraseña.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("Invalid login")
          ? "Correo o contraseña incorrectos."
          : msg.includes("not confirmed")
            ? "Debes confirmar tu correo antes de ingresar."
            : msg || "No se pudo completar la operación.",
      );
    } finally {
      inFlight.current = false;
      setEnviando(false);
    }
  };

  const titulos = {
    entrar: "Ingresa a tu panel clínico",
    registro: "Crea tu cuenta",
    recuperar: "Recupera tu contraseña",
  };

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="glass w-full max-w-md rounded-[20px] p-6 ring-1 ring-ink/5 sm:p-8">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-[10px] bg-brand/15">
              <span className="rv-pulse size-2.5 rounded-full bg-brand" />
            </div>
            <div>
              <p className="font-display text-[0.9375rem] font-semibold">RitmoVital</p>
              <p className="text-[0.6875rem] text-ink/50">Monitoreo cardíaco</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{titulos[modo]}</h1>
          <p className="mt-1 text-sm text-ink/60">
            Tus datos se guardan de forma segura y cifrada en la nube.
          </p>

          <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
            {modo === "registro" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">
                  Nombre completo
                </span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="rounded-xl bg-panel/70 px-4 py-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Tu nombre"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">
                Correo electrónico
              </span>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="rounded-xl bg-panel/70 px-4 py-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                placeholder="nombre@correo.com"
              />
            </label>
            {modo !== "recuperar" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">Contraseña</span>
                <input
                  type="password"
                  aria-label="Contraseña"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete={modo === "registro" ? "new-password" : "current-password"}
                  maxLength={modo === "registro" ? 128 : undefined}
                  aria-describedby={modo === "registro" ? "password-requirements" : undefined}
                  className="rounded-xl bg-panel/70 px-4 py-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                  placeholder="••••••••"
                />
                {modo === "registro" && (
                  <ul id="password-requirements" className="mt-1 grid gap-1 text-xs">
                    {passwordRequirements.map((rule) => {
                      const valid = rule.valid(clave);
                      const Icon = valid ? Check : Circle;
                      return <li key={rule.label} className={`flex items-center gap-2 ${valid ? "text-ok" : "text-ink/60"}`}>
                        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                        <span>{rule.label}{valid ? " — Cumplido" : ""}</span>
                      </li>;
                    })}
                  </ul>
                )}
              </label>
            )}
            {modo === "registro" && (
              <label className="flex items-start gap-3 text-[0.8125rem] text-ink/70">
                <input
                  type="checkbox"
                  checked={consiente}
                  onChange={(e) => setConsiente(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--brand)]"
                />
                Autorizo el tratamiento de mis datos de salud conforme a la Ley 1581 de 2012.
              </label>
            )}

            {modo === "entrar" && cooldown.seconds > 0 && (
              <p role="status" className="rounded-xl bg-warn/10 px-3 py-2 text-[0.8125rem] text-ink ring-1 ring-warn/25">
                Inicio de sesión bloqueado en este navegador tras 5 intentos fallidos. Podrás intentarlo de nuevo en {cooldown.seconds} s.
              </p>
            )}
            {modo === "entrar" && cooldown.seconds === 0 && cooldown.attempts.failures > 0 && (
              <p role="status" className="text-xs text-ink/60">
                Te quedan {MAX_FAILED_LOGINS - cooldown.attempts.failures} intentos antes del bloqueo de 60 segundos.
              </p>
            )}
            {error && !(modo === "entrar" && cooldown.seconds > 0) && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[0.8125rem] text-destructive ring-1 ring-destructive/20">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-xl bg-ok/10 px-3 py-2 text-[0.8125rem] text-ok ring-1 ring-ok/25">
                {info}
              </p>
            )}

            <Button
              type="submit"
              disabled={enviando || !cooldown.ready || (modo === "entrar" && cooldown.seconds > 0) || (modo === "registro" && !passwordValid)}
              className="h-auto rounded-xl bg-brand px-4 py-3 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90 disabled:opacity-60"
            >
              {enviando
                ? "Procesando…"
                : modo === "entrar"
                  ? "Iniciar sesión"
                  : modo === "registro"
                    ? "Crear cuenta"
                    : "Enviar enlace"}
            </Button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.8125rem]">
              {modo === "entrar" ? (
                <>
                  <Button variant="link" disabled={enviando} type="button" onClick={() => cambiarModo("recuperar")} className="h-auto p-0 text-brand hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Button>
                  <Button variant="link" disabled={enviando} type="button" onClick={() => cambiarModo("registro")} className="h-auto p-0 text-brand hover:underline">
                    Crear cuenta
                  </Button>
                </>
              ) : (
                <Button variant="link" disabled={enviando} type="button" onClick={() => cambiarModo("entrar")} className="h-auto p-0 text-brand hover:underline">
                  ← Ya tengo cuenta
                </Button>
              )}
              <span className="text-ink/45">Cifrado AES-256</span>
            </div>
          </form>

          <p className="mt-6 rounded-xl bg-panel/60 px-4 py-3 text-[0.75rem] leading-relaxed text-ink/55 ring-1 ring-ink/5">
            Protección de datos sensibles de salud conforme a la Ley 1581 de 2012 de Colombia. Tus
            datos biométricos nunca se comparten sin tu consentimiento.
          </p>
        </div>
      </section>

      <section className="relative hidden flex-col justify-center gap-6 border-l border-panel/60 bg-brand/5 p-10 lg:flex">
        <Etiquetas />
      </section>
    </div>
  );
}

function Etiquetas() {
  return (
    <>
      <div>
        <p className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">Monitoreo continuo</p>
        <h2 className="mt-2 max-w-[18ch] text-3xl font-semibold leading-tight tracking-tight">
          Tu ritmo cardíaco, vigilado en tiempo real
        </h2>
      </div>
      <div className="glass rounded-[20px] p-6 ring-1 ring-ink/5">
        <div className="flex items-end gap-3">
          <span className="rv-pulse font-display text-5xl font-semibold leading-none">72</span>
          <span className="mb-1.5 text-sm text-ink/55">BPM</span>
        </div>
        <div className="mt-5">
          <Onda />
        </div>
      </div>
      <p className="max-w-[46ch] text-sm text-ink/60">
        Alertas médicas automáticas, diario de síntomas y reportes exportables para tu profesional
        de salud.
      </p>
    </>
  );
}
