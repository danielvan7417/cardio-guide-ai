import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { guardarSesion, imcDe, useSesion, type Sesion } from "@/lib/sesion";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil y consentimiento — RitmoVital" },
      {
        name: "description",
        content:
          "Edita tus datos biométricos, tipo de sangre y contraseña, y gestiona el consentimiento de datos según la Ley 1581 de 2012.",
      },
      { property: "og:title", content: "Perfil y consentimiento — RitmoVital" },
      {
        property: "og:description",
        content: "Gestión de cuenta y tratamiento de datos personales sensibles.",
      },
    ],
  }),
  component: Perfil,
});

const SANGRE = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function Perfil() {
  const { sesion } = useSesion();
  const [form, setForm] = useState<Sesion | null>(null);
  const [aviso, setAviso] = useState("");
  const [clave, setClave] = useState("");

  useEffect(() => setForm(sesion), [sesion]);
  if (!sesion || !form) return null;

  const set = <K extends keyof Sesion>(k: K, v: Sesion[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentimiento) {
      setAviso("Debes autorizar el tratamiento de datos para guardar los cambios.");
      return;
    }
    try {
      await guardarSesion(form);
      if (clave) {
        if (clave.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        const { error } = await supabase.auth.updateUser({ password: clave });
        if (error) throw error;
      }
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
      return;
    }
    setClave("");
    setAviso("Cambios guardados correctamente.");
  };

  return (
    <AppShell
      sesion={sesion}
      titulo="Gestión de perfil"
      migas={[{ label: "Inicio", to: "/inicio" }, { label: "Configuración", to: "/configuracion" }, { label: "Perfil de Usuario" }]}
    >
      <form onSubmit={enviar} className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Etiqueta>Datos de cuenta y biométricos</Etiqueta>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre completo">
              <input
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                className={inputCls}
              />
            </Campo>
            <Campo label="Correo electrónico">
              <input
                type="email"
                value={form.correo}
                onChange={(e) => set("correo", e.target.value)}
                className={inputCls}
              />
            </Campo>
            <Campo label="Edad">
              <input
                type="number"
                min={12}
                max={95}
                value={form.edad}
                onChange={(e) => set("edad", Number(e.target.value) || 0)}
                className={inputCls}
              />
            </Campo>
            <Campo label="Tipo de sangre">
              <select
                value={form.tipoSangre}
                onChange={(e) => set("tipoSangre", e.target.value)}
                className={inputCls}
              >
                {SANGRE.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Peso (kg)">
              <input
                type="number"
                step="0.1"
                value={form.peso}
                onChange={(e) => set("peso", Number(e.target.value) || 0)}
                className={inputCls}
              />
            </Campo>
            <Campo label="Estatura (m)">
              <input
                type="number"
                step="0.01"
                value={form.estatura}
                onChange={(e) => set("estatura", Number(e.target.value) || 0)}
                className={inputCls}
              />
            </Campo>
            <Campo label="Nueva contraseña">
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </Campo>
            <Campo label="IMC calculado">
              <p className="rounded-xl bg-panel/55 px-4 py-2.5 font-display text-sm ring-1 ring-ink/5">
                {imcDe(form)}
              </p>
            </Campo>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <Etiqueta>Consentimiento informado</Etiqueta>
          <p className="text-[0.8125rem] leading-relaxed text-ink/65">
            Autorizo de manera previa, expresa e informada a RitmoVital para recolectar, almacenar y
            tratar mis datos personales sensibles de salud, conforme a la Ley 1581 de 2012 y el
            Decreto 1377 de 2013 de Colombia. Puedo revocar esta autorización en cualquier momento.
          </p>
          <label className="flex items-start gap-3 rounded-xl bg-panel/55 px-4 py-3 ring-1 ring-ink/5">
            <input
              type="checkbox"
              checked={form.consentimiento}
              onChange={(e) => set("consentimiento", e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span className="text-[0.8125rem] text-ink/75">
              Acepto el tratamiento de mis datos personales sensibles (obligatorio).
            </span>
          </label>

          {aviso && (
            <p
              className={`rounded-xl px-3 py-2 text-[0.8125rem] ring-1 ${
                aviso.startsWith("Cambios")
                  ? "bg-ok/10 text-ok ring-ok/25"
                  : "bg-destructive/10 text-destructive ring-destructive/20"
              }`}
            >
              {aviso}
            </p>
          )}

          <button
            type="submit"
            className="mt-auto rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90"
          >
            Guardar cambios
          </button>
        </Card>
      </form>
    </AppShell>
  );
}

const inputCls =
  "rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand w-full";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">{label}</span>
      {children}
    </label>
  );
}
