import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta, EstadoPill } from "@/components/AppShell";
import { Onda } from "@/components/Onda";
import { ControlBluetooth } from "@/components/ControlBluetooth";
import { IndicadorDispositivo, useDispositivo } from "@/lib/dispositivo";
import { useMediciones } from "@/lib/datos";
import { Trash2 } from "lucide-react";
import { CONTEXTOS } from "@/lib/ritmo";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

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

const FILTROS = ["Todas", ...CONTEXTOS] as const;

function Mediciones() {
  const { sesion } = useSesion();
  const dispositivo = useDispositivo();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todas");
  const { lista: mediciones, eliminar } = useMediciones(sesion?.id);
  const [pendiente, setPendiente] = useState<{ id: string; titulo: string } | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");
  const [aviso, setAviso] = useState("");
  if (!sesion) return null;

  const borrar = async () => {
    if (!pendiente || borrando) return;
    setBorrando(true);
    setErrorBorrado("");
    try {
      await eliminar(pendiente.id);
      setPendiente(null);
      setAviso("Medición eliminada.");
    } catch {
      setErrorBorrado("No se pudo eliminar la medición. Inténtalo de nuevo.");
    } finally {
      setBorrando(false);
    }
  };

  const lista = mediciones.filter((m) => filtro === "Todas" || m.contexto === filtro);
  const promedio = Math.round(lista.reduce((a, m) => a + m.bpm, 0) / (lista.length || 1));

  return (
    <AppShell
      sesion={sesion}
      titulo="Historial de mediciones"
      migas={[
        { label: "Inicio", to: "/inicio" },
        { label: "Monitoreo", to: "/monitoreo" },
        { label: "Historial de Mediciones" },
      ]}
      acciones={
        <>
          <IndicadorDispositivo estado={dispositivo.estado} ultimaTrama={dispositivo.ultimaTrama} />
          <ControlBluetooth />
        </>
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

      {aviso && <p className="mt-4 text-[0.8125rem] text-ink/65">{aviso}</p>}

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
        <div className="max-h-[28rem] divide-y divide-ink/5 overflow-y-auto">
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
              <div className="flex items-center gap-2 justify-self-end">
                <EstadoPill estado={m.estado} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-ink/50 hover:bg-alert/10 hover:text-alert"
                  aria-label={`Eliminar medición: ${m.titulo}`}
                  title="Eliminar medición"
                  onClick={() => {
                    setErrorBorrado("");
                    setPendiente(m);
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
          {lista.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-ink/55">
              No hay mediciones para este filtro.
            </p>
          )}
        </div>
      </section>
      <AlertDialog
        open={pendiente !== null}
        onOpenChange={(abierto) => {
          if (!abierto && !borrando) setPendiente(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta medición?</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              «{pendiente?.titulo}» se borrará de tu historial. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorBorrado && (
            <p role="alert" className="text-sm text-alert">
              {errorBorrado}
            </p>
          )}
          <AlertDialogFooter className="gap-2">
            <Button variant="outline" disabled={borrando} onClick={() => setPendiente(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={borrando} onClick={borrar}>
              <Trash2 />
              {borrando ? "Eliminando…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
