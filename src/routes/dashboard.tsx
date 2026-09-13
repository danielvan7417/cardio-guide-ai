import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta, EstadoPill } from "@/components/AppShell";
import { Onda } from "@/components/Onda";
import { IndicadorDispositivo, useDispositivo } from "@/lib/dispositivo";
import { imcDe, useSesion } from "@/lib/sesion";
import {
  consultarAsistente,
  mediciones,
  tendencia,
  UMBRAL_BPM,
  type RespuestaAsistente,
} from "@/lib/ritmo";


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel de monitoreo — RitmoVital" },
      {
        name: "description",
        content:
          "Panel con frecuencia cardíaca en tiempo real, tendencia semanal, bitácora de mediciones y asistente clínico.",
      },
      { property: "og:title", content: "Panel de monitoreo — RitmoVital" },
      {
        property: "og:description",
        content: "Frecuencia cardíaca en vivo, tendencias y alertas médicas automáticas.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { sesion } = useSesion();
  const dispositivo = useDispositivo();
  const [mensaje, setMensaje] = useState("¿Puedo trotar hoy?");
  const [respuesta, setRespuesta] = useState<RespuestaAsistente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const [verSimulador, setVerSimulador] = useState(false);

  if (!sesion) return null;
  const imc = imcDe(sesion);
  const bpm = dispositivo.bpm;
  const elevado = dispositivo.alertaActiva;

  const preguntar = async () => {
    setCargando(true);
    setErrorApi("");
    try {
      setRespuesta(await consultarAsistente({ imc, bpm, mensaje }));
    } catch {
      setErrorApi(
        "No se pudo conectar con el servidor local (127.0.0.1:5000). Verifica que el backend esté encendido.",
      );
      setRespuesta(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AppShell
      sesion={sesion}
      titulo={`Buenos días, ${sesion.nombre.split(" ")[0]}`}
      migas={[{ label: "Inicio", to: "/dashboard" }, { label: "Panel de monitoreo" }]}
      acciones={
        <>
          <IndicadorDispositivo
            estado={dispositivo.estado}
            ultimaTrama={dispositivo.ultimaTrama}
          />
          <Link
            to="/sintomas"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90"
          >
            <span className="text-[13px]">＋</span> Nueva medición
          </Link>
        </>
      }
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rv-pulse size-2 rounded-full ${elevado ? "bg-warn" : "bg-ok"}`}
                />
                <Etiqueta>
                  {dispositivo.enVivo ? "Ritmo en vivo · sensor ESP32" : "Ritmo en tiempo real"}
                </Etiqueta>
              </div>
              <div className="mt-2 flex items-end gap-3">
                <span className="rv-pulse font-display text-5xl font-semibold leading-none">
                  {bpm}
                </span>
                <span className="mb-1.5 text-sm text-ink/55">BPM</span>
              </div>
              <p className="mt-1 text-[12px] text-ink/50">
                {dispositivo.ultimaTrama
                  ? `Última trama recibida ${dispositivo.ultimaTrama}`
                  : "Esperando tramas del microcontrolador…"}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ${
                elevado ? "bg-warn/10 text-warn ring-warn/25" : "bg-ok/10 text-ok ring-ok/25"
              }`}
            >
              {elevado ? "Alerta activa" : "Estado óptimo"}
            </span>
          </div>

          <div className="mt-5">
            <Onda
              muestras={dispositivo.muestras}
              activa={dispositivo.enVivo || dispositivo.simulacion}
              alerta={elevado}
            />
          </div>

          {elevado && (
            <p className="mt-4 rounded-xl bg-warn/10 px-4 py-3 text-[13px] text-ink ring-1 ring-warn/25">
              <span className="font-semibold text-warn">Regla de seguridad activada:</span> el
              sensor reporta {bpm} BPM, por encima del umbral de {UMBRAL_BPM} BPM. Detén la
              actividad y consulta al asistente.
            </p>
          )}

          <div className="mt-4 rounded-xl bg-panel/50 p-3 ring-1 ring-ink/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] text-ink/60">
                Modo de simulación avanzada (solo pruebas sin hardware)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const activar = !dispositivo.simulacion;
                    dispositivo.activarSimulacion(activar);
                    setVerSimulador(activar);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ring-1 ${
                    dispositivo.simulacion
                      ? "bg-brand text-brand-foreground ring-brand/40"
                      : "bg-panel/70 text-ink/70 ring-ink/5 hover:bg-panel"
                  }`}
                >
                  {dispositivo.simulacion ? "Simulación activa" : "Activar simulación"}
                </button>
              </div>
            </div>
            {verSimulador && dispositivo.simulacion && (
              <label className="mt-3 block">
                <span className="text-[12px] text-ink/55">
                  BPM simulado · umbral seguro {UMBRAL_BPM} BPM
                </span>
                <input
                  type="range"
                  min={45}
                  max={185}
                  value={dispositivo.bpmSimulado}
                  onChange={(e) => dispositivo.setBpmSimulado(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--brand)]"
                  aria-label="Frecuencia cardíaca simulada"
                />
              </label>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              dispositivo.simulacion ? "Fuente: simulador" : "Fuente: ESP32",
              `Frecuencia ${bpm}`,
              `IMC ${imc}`,
            ].map((t) => (
              <span
                key={t}
                className="rounded-lg bg-panel/70 px-2.5 py-1 text-[11px] text-ink/60 ring-1 ring-ink/5"
              >
                {t}
              </span>
            ))}
          </div>
        </Card>


        <Card className="flex flex-col gap-4">
          <Etiqueta>Lectura rápida</Etiqueta>
          <div className="flex flex-col gap-3">
            <Lectura titulo="Presión sistólica" valor="118" sufijo="mmHg" />
            <Lectura titulo="Oxigenación (SpO₂)" valor="98%" punto />
            <Lectura titulo="Ritmo medio 7 días" valor="74" sufijo="BPM" />
            <Lectura titulo="Índice de masa corporal" valor={String(imc)} sufijo="IMC" />
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Etiqueta>Tendencia semanal</Etiqueta>
              <p className="mt-0.5 text-sm text-ink/60">Frecuencia cardíaca promedio por día</p>
            </div>
            <span className="text-[12px] text-ink/50">Últimos 7 días</span>
          </div>
          <div className="mt-5 flex h-32 items-end gap-2 sm:gap-4">
            {tendencia.map((d) => (
              <div key={d.dia} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className={`w-full rounded-t-lg ${d.alto ? "bg-warn/50" : "bg-brand/35"}`}
                  style={{ height: `${d.valor}%` }}
                />
                <span className="text-[11px] text-ink/45">{d.dia}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <Etiqueta>Asistente clínico</Etiqueta>
          <p className="mt-0.5 text-sm text-ink/60">
            Consulta con IA local usando tu IMC y BPM actuales.
          </p>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={3}
            className="mt-3 rounded-xl bg-panel/70 px-4 py-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={preguntar}
            disabled={cargando}
            className="mt-3 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90 disabled:opacity-60"
          >
            {cargando ? "Consultando…" : "Enviar consulta"}
          </button>

          {errorApi && (
            <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive ring-1 ring-destructive/20">
              {errorApi}
            </p>
          )}

          {respuesta && (
            <div
              className={`mt-3 rounded-xl px-4 py-3 text-[13px] leading-relaxed ring-1 ${
                respuesta.alerta_activa
                  ? "bg-warn/10 text-ink ring-warn/25"
                  : "bg-ok/10 text-ink ring-ok/25"
              }`}
            >
              {respuesta.alerta_activa && (
                <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-warn">
                  Alerta médica activa · {respuesta.bpm_registrado} BPM
                </p>
              )}
              <p>{respuesta.respuesta_asistente}</p>
            </div>
          )}
        </Card>
      </section>

      <section className="glass mt-5 overflow-hidden rounded-[20px] ring-1 ring-ink/5">
        <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <Etiqueta>Registro de mediciones</Etiqueta>
            <p className="mt-0.5 text-sm text-ink/60">Últimas lecturas detectadas</p>
          </div>
          <Link to="/mediciones" className="text-[13px] font-medium text-brand hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="mt-4 divide-y divide-ink/5">
          {mediciones.slice(0, 4).map((m) => (
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
        </div>
      </section>
    </AppShell>
  );
}

function Lectura({
  titulo,
  valor,
  sufijo,
  punto,
}: {
  titulo: string;
  valor: string;
  sufijo?: string;
  punto?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-panel/55 px-4 py-3 ring-1 ring-ink/5">
      <div>
        <p className="text-[12px] text-ink/55">{titulo}</p>
        <p className="font-display text-xl font-semibold">{valor}</p>
      </div>
      {punto ? (
        <span className="size-2 rounded-full bg-ok" />
      ) : (
        <span className="text-[12px] text-ink/45">{sufijo}</span>
      )}
    </div>
  );
}
