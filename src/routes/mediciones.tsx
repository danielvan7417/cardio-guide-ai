import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta, EstadoPill } from "@/components/AppShell";
import { Onda } from "@/components/Onda";
import { IndicadorDispositivo, useDispositivo } from "@/lib/dispositivo";
import { useMediciones } from "@/lib/datos";

import { useSesion } from "@/lib/sesion";

export const Route = createFileRoute("/mediciones")({
  head: () => ({
    meta: [
      { title: "Mediciones — RitmoVital" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "description",
        content:
          "Bitácora completa de mediciones de frecuencia cardíaca con contexto de actividad y estado Normal o Elevado.",
      },
      { property: "og:title", content: "Mediciones — RitmoVital" },
      {
        property: "og:description",
        content: "Historial de lecturas cardíacas filtrable por contexto y estado.",
      },
    ],
  }),
  component: Mediciones,
});

const FILTROS = ["Todas", "Reposo", "Ejercicio", "Estrés"] as const;

function Mediciones() {
  const { sesion } = useSesion();
  const dispositivo = useDispositivo();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todas");
  const { lista: mediciones, agregar } = useMediciones(sesion?.id);
  const [titulo, setTitulo] = useState("");
  const [nuevoBpm, setNuevoBpm] = useState("");
  const [nuevoCtx, setNuevoCtx] = useState<"Reposo" | "Ejercicio" | "Estrés">("Reposo");
  const [aviso, setAviso] = useState("");
  if (!sesion) return null;

  const guardar = async (e: React.FormEvent, desdeSensor = false) => {
    e.preventDefault();
    const bpmFinal = desdeSensor ? dispositivo.bpm : Number(nuevoBpm);
    if (!bpmFinal || bpmFinal < 30 || bpmFinal > 230) return setAviso("Pulso fuera de rango (30–230).");
    try {
      await agregar({
        titulo: titulo.trim() || (desdeSensor ? "Lectura del sensor ESP32" : "Medición manual"),
        bpm: bpmFinal,
        contexto: nuevoCtx,
        origen: desdeSensor ? "esp32" : "manual",
      });
      setTitulo("");
      setNuevoBpm("");
      setAviso("Medición guardada.");
    } catch {
      setAviso("No se pudo guardar la medición.");
    }
  };

  const lista = mediciones.filter((m) => filtro === "Todas" || m.contexto === filtro);
  const promedio = Math.round(lista.reduce((a, m) => a + m.bpm, 0) / (lista.length || 1));

  return (
    <AppShell
      sesion={sesion}
      titulo="Historial de mediciones"
      migas={[{ label: "Inicio", to: "/inicio" }, { label: "Monitoreo", to: "/monitoreo" }, { label: "Historial de Mediciones" }]}
      acciones={
        <IndicadorDispositivo estado={dispositivo.estado} ultimaTrama={dispositivo.ultimaTrama} />
      }
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Etiqueta>Traza en vivo del sensor</Etiqueta>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => dispositivo.activarSimulacion(!dispositivo.simulacion)}
                aria-pressed={dispositivo.simulacion}
                className={`rounded-xl px-3 py-1.5 text-[0.75rem] font-medium ring-1 ${
                  dispositivo.simulacion
                    ? "bg-brand text-brand-foreground ring-brand/40"
                    : "bg-panel/70 text-ink/70 ring-ink/10 hover:bg-panel"
                }`}
              >
                {dispositivo.simulacion ? "Simulación activa" : "Activar simulación"}
              </button>
              <span className="font-display text-lg font-semibold">
                {dispositivo.bpm} <span className="text-[0.75rem] text-ink/50">BPM</span>
              </span>
            </div>
          </div>
          {dispositivo.simulacion && (
            <label className="mt-3 flex items-center gap-3 text-[0.8125rem] text-ink/65">
              Pulso simulado: <strong className="font-display">{dispositivo.bpmSimulado}</strong>
              <input
                type="range"
                min={45}
                max={185}
                value={dispositivo.bpmSimulado}
                onChange={(e) => dispositivo.setBpmSimulado(Number(e.target.value))}
                className="flex-1 accent-[var(--brand)]"
              />
            </label>
          )}
          <div className="mt-4">
            <Onda
              alto="h-24"
              muestras={dispositivo.muestras}
              activa={dispositivo.enVivo || dispositivo.simulacion}
              alerta={dispositivo.alertaActiva}
            />
          </div>
        </Card>
        <Card className="flex flex-col justify-center gap-2">
          <Etiqueta>Promedio del filtro</Etiqueta>
          <p className="font-display text-4xl font-semibold">
            {promedio} <span className="text-base text-ink/50">BPM</span>
          </p>
          <p className="text-sm text-ink/60">{lista.length} lecturas mostradas</p>
        </Card>
      </section>


      <Card className="mt-5">
        <Etiqueta>Registrar medición</Etiqueta>
        <form onSubmit={(e) => guardar(e)} className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto_auto] sm:items-end">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Descripción (ej. Caminata ligera)"
            className="rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="number"
            min={30}
            max={230}
            value={nuevoBpm}
            onChange={(e) => setNuevoBpm(e.target.value)}
            placeholder="BPM"
            aria-label="BPM"
            className="rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
          />
          <select
            value={nuevoCtx}
            onChange={(e) => setNuevoCtx(e.target.value as typeof nuevoCtx)}
            aria-label="Contexto"
            className="rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
          >
            <option>Reposo</option>
            <option>Ejercicio</option>
            <option>Estrés</option>
          </select>
          <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90">
            Guardar
          </button>
          <button
            type="button"
            onClick={(e) => guardar(e, true)}
            className="rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 hover:bg-panel"
          >
            Guardar lectura del sensor ({dispositivo.bpm})
          </button>
        </form>
        {aviso && <p className="mt-2 text-[0.8125rem] text-ink/65">{aviso}</p>}
      </Card>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-xl px-3 py-2 text-sm ring-1 ${
              filtro === f
                ? "bg-brand text-brand-foreground ring-brand/40"
                : "bg-panel/60 text-ink/70 ring-ink/5 hover:bg-panel/80"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="glass mt-4 overflow-hidden rounded-[20px] ring-1 ring-ink/5">
        <div className="divide-y divide-ink/5">
          {lista.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:px-6"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
                    m.estado === "Normal" ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"
                  }`}
                >
                  <span className="text-[0.8125rem]">❯</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{m.titulo}</p>
                  <p className="text-[0.75rem] text-ink/50">{m.fecha}</p>
                </div>
              </div>
              <div className="hidden text-sm text-ink/65 sm:block">{m.bpm} BPM</div>
              <div className="hidden text-[0.8125rem] text-ink/50 sm:block">{m.contexto}</div>
              <span className="justify-self-start sm:justify-self-end">
                <EstadoPill estado={m.estado} />
              </span>
            </div>
          ))}
          {lista.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-ink/55">
              No hay mediciones para este filtro.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
