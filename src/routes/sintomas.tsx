import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { CONTEXTOS, estadoDe, type Contexto } from "@/lib/ritmo";
import { useSesion } from "@/lib/sesion";
import { useSintomas } from "@/lib/datos";
import { useDispositivo } from "@/lib/dispositivo";

export const Route = createFileRoute("/sintomas")({
  head: () => ({
    meta: [
      { title: "Diario de síntomas — RitmoVital" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

const SINTOMAS_COMUNES = ["Mareo", "Fatiga", "Dolor de cabeza", "Palpitaciones"];
const SINTOMAS_ALERTA = ["Dolor en el pecho", "Falta de aire", "Sudor frío"];

function Sintomas() {
  const { sesion } = useSesion();
  const dispositivo = useDispositivo();
  const [fuentePulso, setFuentePulso] = useState<"simulacion" | "manual" | "esp32">("manual");
  const [bpmManual, setBpm] = useState("");
  const [contexto, setContexto] = useState<Contexto>("Reposo");
  const [seleccion, setSeleccion] = useState<string[]>(["Ninguno"]);
  const [nota, setNota] = useState("");
  const { lista: bitacora, agregar, eliminar, eliminarTodas } = useSintomas(sesion?.id);
  const [errorGuardar, setErrorGuardar] = useState("");

  // El pulso del registro depende de la fuente elegida.
  const bpmFuente =
    fuentePulso === "manual"
      ? bpmManual.trim()
        ? Number(bpmManual)
        : null
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

  const botonSintoma = (s: string, esAlerta: boolean) => {
    const activo = seleccion.includes(s);
    const estilo = activo
      ? esAlerta
        ? "bg-alert/12 text-alert ring-alert/30"
        : "bg-warn/12 text-warn ring-warn/30"
      : esAlerta
        ? "bg-panel/60 text-ink/70 ring-alert/25 hover:bg-alert/5"
        : "bg-panel/60 text-ink/70 ring-ink/5 hover:bg-panel/80";
    return (
      <button
        key={s}
        type="button"
        onClick={() => alternar(s)}
        aria-pressed={activo}
        className={`rounded-xl px-3 py-2 text-sm ring-1 ${estilo}`}
      >
        {s}
      </button>
    );
  };

  const alertaSeleccionada = seleccion.some((s) => SINTOMAS_ALERTA.includes(s));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGuardar("");
    if (bpmFuente === null) {
      setErrorGuardar(
        fuentePulso === "esp32"
          ? "No hay lectura del ESP32. Verifica que el sensor y el servidor local estén encendidos."
          : fuentePulso === "manual"
            ? "Ingresa el pulso de tu registro."
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
    setBpm("");
    setSeleccion(["Ninguno"]);
  };

  return (
    <AppShell
      sesion={sesion}
      titulo="Mapeo y diario de síntomas"
      migas={[
        { label: "Inicio", to: "/inicio" },
        { label: "Salud", to: "/salud" },
        { label: "Registro de Síntomas" },
      ]}
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Etiqueta>Nuevo registro</Etiqueta>
          <form onSubmit={guardar} className="mt-4 flex flex-col gap-5">
            <div>
              <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">
                Fuente del pulso
              </span>
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
                  type="number"
                  min={45}
                  max={185}
                  value={bpmManual}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="Ingresa tu pulso (BPM)"
                  aria-label="Pulso manual (BPM)"
                  className="w-full rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                />
              ) : (
                <p className="rounded-xl bg-panel/55 px-4 py-2.5 text-[0.8125rem] text-ink/60 ring-1 ring-ink/5">
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
              <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">
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
              <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">
                Síntomas
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SINTOMAS_COMUNES.map((s) => botonSintoma(s, false))}
                {SINTOMAS_ALERTA.map((s) => botonSintoma(s, true))}
                {botonSintoma("Ninguno", false)}
              </div>
              {alertaSeleccionada && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-alert/10 p-3 text-sm text-alert ring-1 ring-alert/30"
                >
                  Algunos síntomas seleccionados pueden requerir atención médica inmediata. Si los
                  sientes ahora, busca atención de urgencia.
                </p>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/50">
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
            {errorGuardar && <p className="text-[0.8125rem] text-destructive">{errorGuardar}</p>}
          </form>
        </Card>

        <div className="relative min-h-0">
          <Card className="flex flex-col gap-3 lg:absolute lg:inset-0">
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
                  className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-[0.6875rem] font-medium text-destructive ring-1 ring-destructive/20 hover:bg-destructive/15"
                >
                  Borrar todo
                </button>
              )}
            </div>
            {bitacora.length === 0 && (
              <p className="text-sm text-ink/55">Aún no tienes registros guardados.</p>
            )}
            <div className="rv-scrollbar flex min-h-0 max-h-96 flex-1 flex-col gap-3 overflow-y-auto pr-1 lg:max-h-none">
              {bitacora.map((r) => (
                <div
                  key={r.id}
                  className="shrink-0 rounded-xl bg-panel/55 px-4 py-3 ring-1 ring-ink/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-sm font-medium">{r.bpm} BPM</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.75rem] text-ink/50">{r.fecha}</span>
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
                        className="grid size-6 place-items-center rounded-md text-[0.6875rem] text-destructive ring-1 ring-destructive/20 hover:bg-destructive/10"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[0.75rem] text-ink/55">{r.contexto}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.sintomas.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-panel/70 px-2 py-0.5 text-[0.6875rem] text-ink/60 ring-1 ring-ink/5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink/65">{r.nota}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
