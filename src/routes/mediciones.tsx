import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta, EstadoPill } from "@/components/AppShell";
import { Onda } from "@/components/Onda";
import { IndicadorDispositivo, useDispositivo } from "@/lib/dispositivo";
import { mediciones } from "@/lib/ritmo";

import { useSesion } from "@/lib/sesion";

export const Route = createFileRoute("/mediciones")({
  head: () => ({
    meta: [
      { title: "Mediciones — RitmoVital" },
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
  if (!sesion) return null;

  const lista = mediciones.filter((m) => filtro === "Todas" || m.contexto === filtro);
  const promedio = Math.round(lista.reduce((a, m) => a + m.bpm, 0) / (lista.length || 1));

  return (
    <AppShell
      sesion={sesion}
      titulo="Historial de mediciones"
      migas={[{ label: "Inicio", to: "/dashboard" }, { label: "Mediciones" }]}
      acciones={
        <IndicadorDispositivo estado={dispositivo.estado} ultimaTrama={dispositivo.ultimaTrama} />
      }
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Etiqueta>Traza en vivo del sensor</Etiqueta>
            <span className="font-display text-lg font-semibold">
              {dispositivo.bpm} <span className="text-[12px] text-ink/50">BPM</span>
            </span>
          </div>
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
                  <span className="text-[13px]">❯</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{m.titulo}</p>
                  <p className="text-[12px] text-ink/50">{m.fecha}</p>
                </div>
              </div>
              <div className="hidden text-sm text-ink/65 sm:block">{m.bpm} BPM</div>
              <div className="hidden text-[13px] text-ink/50 sm:block">{m.contexto}</div>
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
