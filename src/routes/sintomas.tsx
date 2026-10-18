import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { estadoDe } from "@/lib/ritmo";
import { useSesion } from "@/lib/sesion";
import { useSintomas } from "@/lib/datos";
import { useDispositivo } from "@/lib/dispositivo";

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
  const dispositivo = useDispositivo();
  const [fuentePulso, setFuentePulso] = useState<"simulacion" | "manual" | "esp32">("manual");
  const [bpmManual, setBpm] = useState(88);
  const [contexto, setContexto] = useState<(typeof CONTEXTOS)[number]>("Reposo");
  const [seleccion, setSeleccion] = useState<string[]>(["Ninguno"]);
  const [nota, setNota] = useState("");
  const { lista: bitacora, agregar, eliminar, eliminarTodas } = useSintomas(sesion?.id);
  const [errorGuardar, setErrorGuardar] = useState("");

  // El pulso del registro depende de la fuente elegida.
  const bpmFuente =
    fuentePulso === "manual"
      ? bpmManual
      : fuentePulso === "simulacion"
        ? dispositivo.simulacion
          ? dispositivo.bpm
          : null
        : dispositivo.bpmEsp32;
  const bpm = bpmFuente ?? 0;

  if (!sesion) return null;

  const alternar = (s: string) => {
    if (s === "Ninguno") return setSeleccion(["Ninguno"]);
    setSeleccion((prev) => {
      const sin = prev.filter((x) => x !== "Ninguno");
      return sin.includes(s) ? sin.filter((x) => x !== s) : [...sin, s];
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGuardar("");
    if (bpmFuente === null) {
      setErrorGuardar(
        fuentePulso === "esp32"
          ? "No hay lectura del ESP32. Verifica que el sensor y el servidor local estén encendidos."
          : "Activa el modo simulación para tomar el pulso simulado.",
      );
      return;
    }
    try {
      await agregar({
        bpm,
        contexto,
        sintomas: seleccion.length ? seleccion : ["Ninguno"],
        nota: nota.trim(),
      });
    } catch {
      setErrorGuardar("No se pudo guardar el registro. Intenta de nuevo.");
      return;
    }
    setNota("");
    setSeleccion(["Ninguno"]);
  };

  return (
    <AppShell
      sesion={sesion}
      titulo="Mapeo y diario de síntomas"
      migas={[{ label: "Inicio", to: "/dashboard" }, { label: "Salud", to: "/salud" }, { label: "Registro de Síntomas" }]}
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Etiqueta>Nuevo registro</Etiqueta>
          <form onSubmit={guardar} className="mt-4 flex flex-col gap-5">
            <div>
              <span className="text-[12px] uppercase tracking-[0.14em] text-ink/50">Fuente del pulso</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ["simulacion", "Modo simulación"],
                  ["manual", "Manual"],
                  ["esp32", "ESP32 real"],
                ].map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => {
                      const fuente = valor as typeof fuentePulso;
                      setFuentePulso(fuente);
                      if (fuente === "simulacion") dispositivo.activarSimulacion(true);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm ring-1 ${
                      fuentePulso === valor
                        ? "bg-brand text-brand-foreground ring-brand/40"
                        : "bg-panel/60 text-ink/70 ring-ink/5 hover:bg-panel/80"
                    }`}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink/70">
                Pulso actual:{" "}
                {bpmFuente === null ? (
                  <strong className="text-warn">sin lectura</strong>
                ) : (
                  <>
                    <strong className="font-display">{bpm} BPM</strong> ·{" "}
                    <span className={estadoDe(bpm) === "Normal" ? "text-ok" : "text-warn"}>
                      {estadoDe(bpm)}
                    </span>
                  </>
                )}
              </span>
              {fuentePulso === "manual" ? (
                <input
                  type="range"
                  min={45}
                  max={185}
                  value={bpmManual}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full accent-[var(--brand)]"
                />
              ) : (
                <p className="rounded-xl bg-panel/55 px-4 py-2.5 text-[13px] text-ink/60 ring-1 ring-ink/5">
                  {fuentePulso === "simulacion"
                    ? dispositivo.simulacion
                      ? `Lectura simulada en vivo · ${dispositivo.bpmSimulado} BPM base`
                      : "El modo simulación está apagado"
                    : dispositivo.bpmEsp32 !== null
                      ? "Lectura recibida del ESP32 en tiempo real"
                      : "Esperando una lectura real del ESP32"}
                </p>
              )}
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
            {errorGuardar && <p className="text-[13px] text-destructive">{errorGuardar}</p>}
          </form>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Etiqueta>Bitácora reciente</Etiqueta>
            {bitacora.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("¿Borrar toda la bitácora de síntomas?")) return;
                  try {
                    await eliminarTodas();
                  } catch {
                    setErrorGuardar("No se pudo borrar la bitácora.");
                  }
                }}
                className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-[11px] font-medium text-destructive ring-1 ring-destructive/20 hover:bg-destructive/15"
              >
                Borrar todo
              </button>
            )}
          </div>
          {bitacora.length === 0 && (
            <p className="text-sm text-ink/55">Aún no tienes registros guardados.</p>
          )}
          {bitacora.map((r) => (
            <div key={r.id} className="rounded-xl bg-panel/55 px-4 py-3 ring-1 ring-ink/5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-medium">{r.bpm} BPM</p>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-ink/50">{r.fecha}</span>
                  <button
                    type="button"
                    aria-label={`Borrar registro del ${r.fecha}`}
                    onClick={async () => {
                      try {
                        await eliminar(r.id);
                      } catch {
                        setErrorGuardar("No se pudo borrar el registro.");
                      }
                    }}
                    className="grid size-6 place-items-center rounded-md text-[11px] text-destructive ring-1 ring-destructive/20 hover:bg-destructive/10"
                  >
                    ×
                  </button>
                </div>
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
