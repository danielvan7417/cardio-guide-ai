import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { estadoDe, type RegistroSintoma } from "@/lib/ritmo";
import { useSesion } from "@/lib/sesion";

export const Route = createFileRoute("/sintomas")({
  head: () => ({
    meta: [
      { title: "Diario de síntomas — RitmoVital" },
      {
        name: "description",
        content:
          "Registra pulso, contexto de actividad y síntomas como mareo o fatiga en tu bitácora clínica.",
      },
      { property: "og:title", content: "Diario de síntomas — RitmoVital" },
      {
        property: "og:description",
        content: "Mapeo de síntomas asociados a tu frecuencia cardíaca.",
      },
    ],
  }),
  component: Sintomas,
});

const CONTEXTOS = ["Reposo", "Ejercicio", "Estrés"] as const;
const SINTOMAS = ["Mareo", "Fatiga", "Dolor de cabeza", "Palpitaciones", "Ninguno"];

function Sintomas() {
  const { sesion } = useSesion();
  const [bpm, setBpm] = useState(88);
  const [contexto, setContexto] = useState<(typeof CONTEXTOS)[number]>("Reposo");
  const [seleccion, setSeleccion] = useState<string[]>(["Ninguno"]);
  const [nota, setNota] = useState("");
  const [bitacora, setBitacora] = useState<RegistroSintoma[]>([
    {
      id: "s1",
      fecha: "Hoy · 07:30",
      bpm: 135,
      contexto: "Ejercicio",
      sintomas: ["Mareo", "Fatiga"],
      nota: "Sensación de falta de aire al finalizar el trote.",
    },
    {
      id: "s2",
      fecha: "Ayer · 21:10",
      bpm: 76,
      contexto: "Reposo",
      sintomas: ["Ninguno"],
      nota: "Noche tranquila, sin molestias.",
    },
  ]);

  if (!sesion) return null;

  const alternar = (s: string) => {
    if (s === "Ninguno") return setSeleccion(["Ninguno"]);
    setSeleccion((prev) => {
      const sin = prev.filter((x) => x !== "Ninguno");
      return sin.includes(s) ? sin.filter((x) => x !== s) : [...sin, s];
    });
  };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    setBitacora((prev) => [
      {
        id: crypto.randomUUID(),
        fecha: new Date().toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }),
        bpm,
        contexto,
        sintomas: seleccion.length ? seleccion : ["Ninguno"],
        nota: nota.trim() || "Sin notas adicionales.",
      },
      ...prev,
    ]);
    setNota("");
    setSeleccion(["Ninguno"]);
  };

  return (
    <AppShell
      sesion={sesion}
      titulo="Mapeo y diario de síntomas"
      migas={[{ label: "Inicio", to: "/dashboard" }, { label: "Salud", to: "/sintomas" }, { label: "Registro de Síntomas" }]}
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Etiqueta>Nuevo registro</Etiqueta>
          <form onSubmit={guardar} className="mt-4 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink/70">
                Pulso actual:{" "}
                <strong className="font-display">{bpm} BPM</strong> ·{" "}
                <span className={estadoDe(bpm) === "Normal" ? "text-ok" : "text-warn"}>
                  {estadoDe(bpm)}
                </span>
              </span>
              <input
                type="range"
                min={45}
                max={185}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full accent-[var(--brand)]"
              />
            </label>

            <div>
              <span className="text-[12px] uppercase tracking-[0.14em] text-ink/50">
                Contexto de actividad
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {CONTEXTOS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setContexto(c)}
                    className={`rounded-xl px-3 py-2 text-sm ring-1 ${
                      contexto === c
                        ? "bg-brand text-brand-foreground ring-brand/40"
                        : "bg-panel/60 text-ink/70 ring-ink/5 hover:bg-panel/80"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[12px] uppercase tracking-[0.14em] text-ink/50">Síntomas</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SINTOMAS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => alternar(s)}
                    aria-pressed={seleccion.includes(s)}
                    className={`rounded-xl px-3 py-2 text-sm ring-1 ${
                      seleccion.includes(s)
                        ? "bg-warn/12 text-warn ring-warn/30"
                        : "bg-panel/60 text-ink/70 ring-ink/5 hover:bg-panel/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] uppercase tracking-[0.14em] text-ink/50">
                Notas de bitácora
              </span>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder="Describe lo que sentiste, duración y contexto."
                className="rounded-xl bg-panel/70 px-4 py-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
              />
            </label>

            <button
              type="submit"
              className="self-start rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90"
            >
              Guardar en bitácora
            </button>
          </form>
        </Card>

        <Card className="flex flex-col gap-3">
          <Etiqueta>Bitácora reciente</Etiqueta>
          {bitacora.map((r) => (
            <div key={r.id} className="rounded-xl bg-panel/55 px-4 py-3 ring-1 ring-ink/5">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-medium">{r.bpm} BPM</p>
                <span className="text-[12px] text-ink/50">{r.fecha}</span>
              </div>
              <p className="mt-1 text-[12px] text-ink/55">{r.contexto}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.sintomas.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg bg-panel/70 px-2 py-0.5 text-[11px] text-ink/60 ring-1 ring-ink/5"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/65">{r.nota}</p>
            </div>
          ))}
        </Card>
      </section>
    </AppShell>
  );
}
