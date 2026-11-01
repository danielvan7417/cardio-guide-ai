import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Download, Pause, Play, Save, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Onda } from "@/components/Onda";
import { ControlBluetooth } from "@/components/ControlBluetooth";
import { IndicadorDispositivo, useDispositivo } from "@/lib/dispositivo";
import { useMediciones } from "@/lib/datos";
import { useSesion } from "@/lib/sesion";
import { fragmentoPulsoCSV, tasaRecepcion } from "@/lib/clinical-summary";

export const Route = createFileRoute("/monitoreo")({
  head: () => ({ meta: [
    { title: "Centro de monitoreo ESP32 — RitmoVital" },
    { name: "description", content: "Sala de control del ESP32: pulso esquemático en vivo, conexión, pausa, simulación y captura de tomas." },
    { property: "og:title", content: "Centro de monitoreo ESP32 — RitmoVital" },
    { property: "og:description", content: "Recepción en vivo y diagnóstico de conexión del sensor cardíaco." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Monitoreo,
});

function Monitoreo() {
  const { sesion } = useSesion();
  const d = useDispositivo();
  const { agregar } = useMediciones(sesion?.id);
  const [congelada, setCongelada] = useState<{ muestras: number[]; tiempos: number[]; bpm: number; alerta: boolean; fuente: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState(false);
  if (!sesion) return null;
  const activa = d.enVivo || d.simulacion;
  const fuente = d.simulacion ? "simulacion" : d.fuente ?? "sin_senal";
  const display = congelada ?? { muestras: d.muestras, tiempos: d.tiemposMuestras, bpm: d.bpm, alerta: d.alertaActiva, fuente };
  const hz = activa ? tasaRecepcion(d.tiemposMuestras) : null;
  const guardar = async () => {
    if (!activa || guardando) return;
    setGuardando(true); setAviso(""); setError(false);
    const bpm = d.bpm;
    try { await agregar({ titulo: d.simulacion ? "Toma de simulación" : "Toma actual ESP32", bpm, contexto: "Reposo", origen: d.simulacion ? "simulacion" : d.fuente === "ble" ? "ble" : "esp32" }); setAviso(`Toma de ${bpm} BPM guardada en Mediciones · contexto Reposo.`); }
    catch { setError(true); setAviso("No se pudo guardar la toma. Inténtalo de nuevo."); }
    finally { setGuardando(false); }
  };
  const exportar = () => {
    if (!display.muestras.length) return;
    const url = URL.createObjectURL(new Blob([fragmentoPulsoCSV(display.muestras, display.tiempos, display.fuente)], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `ritmovital-pulso-${display.fuente}-${Date.now()}.csv`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setError(false); setAviso("Fragmento de BPM exportado. No contiene señal ECG ni voltajes.");
  };
  return <AppShell sesion={sesion} titulo="Centro de monitoreo" migas={[{ label: "Inicio", to: "/inicio" }, { label: "Monitoreo" }]} acciones={<><IndicadorDispositivo estado={d.estado} ultimaTrama={d.ultimaTrama} /><ControlBluetooth /></>}>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="size-5 text-brand" /> Sala de control · ESP32</p>
      <div className="flex gap-3"><Button asChild variant="link"><Link to="/dashboard">Resumen de salud</Link></Button><Button asChild variant="link"><Link to="/mediciones">Mediciones</Link></Button></div>
    </div>
    <section aria-label="Pulso en vivo" className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-xl font-semibold">Pulso en vivo</h2><p className="mt-1 text-sm text-muted-foreground">{display.fuente === "simulacion" ? "Fuente simulada · no es una lectura del paciente" : display.fuente === "ble" ? "Fuente: Bluetooth Low Energy" : display.fuente === "wifi" ? "Fuente: servidor local / Wi-Fi" : "Esperando sensor"}</p></div>
        <div className="flex flex-wrap items-center gap-3"><span className={`text-sm font-medium ${congelada ? "text-warn" : activa ? "text-ok" : "text-muted-foreground"}`}>{congelada ? "Pantalla congelada · recepción continúa" : activa ? "Trazado activo" : "Sin señal activa"}</span><Button variant="outline" disabled={!activa && !congelada} onClick={() => setCongelada(congelada ? null : { muestras: [...d.muestras], tiempos: [...d.tiemposMuestras], bpm: d.bpm, alerta: d.alertaActiva, fuente })}>{congelada ? <Play /> : <Pause />}{congelada ? "Reanudar pantalla" : "Congelar pantalla"}</Button></div>
      </div>
      <div className="mt-5"><Onda alto="h-64 sm:h-80 lg:h-96" muestras={display.muestras} activa={Boolean(congelada) || activa} pausada={Boolean(congelada)} alerta={display.alerta && (Boolean(congelada) || activa)} /></div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>Pulso esquemático basado en BPM; no es un ECG medido.</span><span>Muestreo ECG: no disponible · recepción: {hz === null ? "—" : `${hz.toFixed(2)} Hz`}</span></div>
    </section>
    <div className="grid gap-6 border-y border-border py-6 lg:grid-cols-[1fr_1.4fr]">
      <section aria-label="Lectura en tiempo real">
        <h2 className="text-lg font-semibold">Lectura en tiempo real</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="border-l-2 border-brand pl-4"><p className="text-sm text-muted-foreground">BPM instantáneo</p><p className="mt-2 font-display text-4xl font-semibold">{activa ? d.bpm : "—"}</p><p className="mt-2 text-xs text-muted-foreground">{d.simulacion ? "Simulación" : "Sensor"}</p></div>
          <div className="border-l-2 border-ok pl-4"><p className="text-sm text-muted-foreground">SpO₂ detectado</p><p className="mt-2 font-display text-4xl font-semibold">{d.spo2Esp32 ?? "—"}<span className="text-lg">{d.spo2Esp32 !== null ? "%" : ""}</span></p><p className="mt-2 text-xs text-muted-foreground">{d.spo2Esp32 === null ? "El sensor no reporta SpO₂" : "Sensor real"}</p></div>
        </div>
        {activa && d.alertaActiva && <p role="alert" className="mt-5 border-l-4 border-alert bg-alert/10 p-3 text-sm text-alert">{d.simulacion ? "Alerta de prueba" : "Alerta activa"} · {d.bpm} BPM. Umbral de 120 BPM alcanzado.</p>}
      </section>
      <section aria-label="Panel técnico ESP32">
        <h2 className="text-lg font-semibold">Panel técnico del ESP32</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Dato k="Bluetooth" v={d.bleConectado ? "Conectado" : "No vinculado"} />
          <Dato k="Wi-Fi / servidor local" v={d.bleConectado ? "Consulta suspendida por BLE" : d.fuente === "wifi" ? "Recibiendo datos" : "Sin conexión confirmada"} />
          <Dato k="Batería" v="No reportada por el dispositivo" />
          <Dato k="Tasa de recepción" v={hz === null ? "Sin datos" : `${hz.toFixed(2)} Hz${d.simulacion ? " · simulador" : ""}`} />
          <Dato k="Última trama de la fuente activa" v={activa ? d.ultimaTrama || "—" : "Sin lectura vigente"} />
          <Dato k="Muestreo del sensor" v="No reportado · no hay señal ECG" />
        </dl>
      </section>
    </div>
    <section aria-label="Simulación" className="flex flex-col gap-5 border-b border-border py-6 sm:flex-row sm:items-center">
      <label htmlFor="simulacion-monitor" className="flex shrink-0 items-center gap-3"><Switch id="simulacion-monitor" checked={d.simulacion} onCheckedChange={d.activarSimulacion} /><span className="text-sm font-medium">Modo simulación</span></label>
      {d.simulacion && <label className="flex w-full flex-col gap-2"><span className="text-sm text-muted-foreground">BPM simulado · {d.bpmSimulado}</span><input type="range" min={45} max={185} value={d.bpmSimulado} onChange={(e) => d.setBpmSimulado(Number(e.target.value))} className="w-full accent-brand" aria-label="Frecuencia cardíaca simulada" /></label>}
      {!d.simulacion && <p className="text-sm text-muted-foreground">Lecturas del sensor real cuando haya conexión.</p>}
    </section>
    <section aria-label="Acciones de captura" className="py-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={guardar} disabled={!activa || guardando}><Save />{guardando ? "Guardando…" : "Guardar toma actual"}</Button>
        <Button variant="outline" disabled title="El hardware no ofrece un comando de calibración"><SlidersHorizontal />Calibrar sensor</Button>
        <Button variant="outline" onClick={exportar} disabled={!display.muestras.length}><Download />Exportar fragmento de pulso</Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Calibración no disponible: requiere soporte del firmware. Exportación CSV de BPM; el ESP32 actual no transmite señal ECG.</p>
      {aviso && <p role="status" className={`mt-4 text-sm ${error ? "text-destructive" : "text-ok"}`}>{aviso}</p>}
    </section>
  </AppShell>;
}
function Dato({ k, v }: { k: string; v: string }) { return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 break-words text-sm font-medium">{v}</dd></div>; }
