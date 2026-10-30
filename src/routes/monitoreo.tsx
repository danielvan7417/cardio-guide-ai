import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Etiqueta, EstadoPill } from "@/components/AppShell";
import { Onda } from "@/components/Onda";
import { IndicadorDispositivo, useDispositivo } from "@/lib/dispositivo";
import { useMediciones } from "@/lib/datos";
import { useSesion } from "@/lib/sesion";
import { UMBRAL_BPM } from "@/lib/ritmo";

export const Route = createFileRoute("/monitoreo")({
  head: () => ({
    meta: [
      { title: "Monitoreo cardíaco — RitmoVital" },
      { name: "description", content: "Estado del sensor ESP32, pulso en vivo y resumen de tus mediciones." },
      { property: "og:title", content: "Monitoreo cardíaco — RitmoVital" },
      { property: "og:description", content: "Sensor ESP32, pulso en vivo y mediciones guardadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Monitoreo,
});

function Monitoreo() {
  const { sesion } = useSesion();
  const d = useDispositivo();
  const { lista } = useMediciones(sesion?.id);
  if (!sesion) return null;

  const promedio = lista.length ? Math.round(lista.reduce((a, m) => a + m.bpm, 0) / lista.length) : null;
  const max = lista.length ? Math.max(...lista.map((m) => m.bpm)) : null;
  const elevadas = lista.filter((m) => m.estado === "Elevado").length;

  return (
    <AppShell
      sesion={sesion}
      titulo="Centro de monitoreo"
      migas={[{ label: "Inicio", to: "/inicio" }, { label: "Monitoreo" }]}
      acciones={<IndicadorDispositivo estado={d.estado} ultimaTrama={d.ultimaTrama} />}
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Etiqueta>{d.simulacion ? "Pulso · modo simulación" : d.enVivo ? "Pulso · sensor ESP32" : "Pulso"}</Etiqueta>
              <p className="mt-1 font-display text-5xl font-semibold">
                {d.bpm} <span className="text-lg text-ink/50">BPM</span>
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${
                d.alertaActiva ? "bg-alert/10 text-alert ring-alert/25" : "bg-ok/10 text-ok ring-ok/25"
              }`}
            >
              {d.alertaActiva ? `Alerta · sobre ${UMBRAL_BPM} BPM` : "Ritmo óptimo"}
            </span>
          </div>
          <div className="mt-4">
            <Onda muestras={d.muestras} alerta={d.alertaActiva} />
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <Etiqueta>Sensor ESP32</Etiqueta>
          <Dato k="Estado" v={d.estado} />
          <Dato k="Última trama" v={d.ultimaTrama || "—"} />
          <Dato k="Pulso real" v={d.bpmEsp32 != null ? `${d.bpmEsp32} BPM` : "Sin lectura"} />
          <Dato k="Oxigenación" v={d.spo2Esp32 != null ? `${d.spo2Esp32}%` : "Sin lectura"} />
          <Dato k="Simulación" v={d.simulacion ? "Activa" : "Apagada"} />
        </Card>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-5">
        <Card><Etiqueta>Promedio guardado</Etiqueta><p className="mt-2 font-display text-3xl font-semibold">{promedio ?? "—"} <span className="text-base text-ink/50">BPM</span></p></Card>
        <Card><Etiqueta>Pulso máximo</Etiqueta><p className="mt-2 font-display text-3xl font-semibold">{max ?? "—"} <span className="text-base text-ink/50">BPM</span></p></Card>
        <Card><Etiqueta>Lecturas elevadas</Etiqueta><p className="mt-2 font-display text-3xl font-semibold">{elevadas} <span className="text-base text-ink/50">de {lista.length}</span></p></Card>
      </section>

      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <Etiqueta>Últimas mediciones</Etiqueta>
            <Link to="/mediciones" className="text-sm font-medium text-brand hover:underline">Ver historial →</Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {lista.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-xl bg-panel/55 px-4 py-3 ring-1 ring-ink/5">
                <div>
                  <p className="font-medium">{m.titulo}</p>
                  <p className="text-sm text-ink/55">{m.fecha} · {m.contexto}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold">{m.bpm} BPM</span>
                  <EstadoPill estado={m.estado} />
                </div>
              </li>
            ))}
            {!lista.length && <li className="text-sm text-ink/55">Aún no hay mediciones guardadas.</li>}
          </ul>
        </Card>
        <div className="flex flex-col gap-4 sm:gap-5">
          <Acceso to="/dashboard" icono="◉" titulo="Panel Principal" texto="Onda en vivo, tendencia y asistente clínico." />
          <Acceso to="/mediciones" icono="▤" titulo="Historial de Mediciones" texto="Traza del sensor, simulación y lecturas." />
        </div>
      </section>
    </AppShell>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-panel/55 px-4 py-2.5 ring-1 ring-ink/5">
      <span className="text-sm text-ink/55">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export function Acceso({ to, icono, titulo, texto }: { to: string; icono: string; titulo: string; texto: string }) {
  return (
    <Link to={to} className="glass group flex flex-1 items-start gap-4 rounded-[20px] p-5 ring-1 ring-ink/5 transition hover:ring-brand/30">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/12 text-lg text-brand">{icono}</span>
      <div>
        <p className="font-display text-lg font-semibold">{titulo}</p>
        <p className="text-sm text-ink/60">{texto}</p>
        <span className="mt-2 inline-block text-sm font-medium text-brand group-hover:underline">Abrir →</span>
      </div>
    </Link>
  );
}
