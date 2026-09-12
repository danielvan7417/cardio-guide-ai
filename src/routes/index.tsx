import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { guardarSesion, leerSesion, sesionInicial } from "@/lib/sesion";
import { Onda } from "@/components/Onda";

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
  const [correo, setCorreo] = useState("andres@ritmovital.co");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (leerSesion()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.includes("@")) return setError("Ingresa un correo electrónico válido.");
    if (clave.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    setError("");
    const previa = leerSesion();
    guardarSesion({ ...(previa ?? sesionInicial), correo });
    navigate({ to: "/dashboard", replace: true });
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
              <p className="font-display text-[15px] font-semibold">RitmoVital</p>
              <p className="text-[11px] text-ink/50">Monitoreo cardíaco</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            Ingresa a tu panel clínico
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Tus mediciones se procesan de forma local y cifrada.
          </p>

          <form onSubmit={entrar} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] uppercase tracking-[0.14em] text-ink/50">
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
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] uppercase tracking-[0.14em] text-ink/50">Contraseña</span>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="rounded-xl bg-panel/70 px-4 py-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive ring-1 ring-destructive/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="rounded-xl bg-brand px-4 py-3 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90"
            >
              Iniciar sesión
            </button>

            <div className="flex items-center justify-between text-[13px]">
              <a href="#recuperar" className="text-brand hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
              <span className="text-ink/45">Cifrado AES-256</span>
            </div>
          </form>

          <p className="mt-6 rounded-xl bg-panel/60 px-4 py-3 text-[12px] leading-relaxed text-ink/55 ring-1 ring-ink/5">
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
        <p className="text-[12px] uppercase tracking-[0.14em] text-ink/50">Monitoreo continuo</p>
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
