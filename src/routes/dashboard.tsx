import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, Heart, Scale, Wind, MessageCircle, Bell } from "lucide-react";
import { AppShell, Etiqueta } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useDispositivo } from "@/lib/dispositivo";
import { imcDe, useSesion } from "@/lib/sesion";
import { useMediciones } from "@/lib/datos";
import { resumenClinico } from "@/lib/clinical-summary";
import { consultarAsistente, type RespuestaAsistente } from "@/lib/ritmo";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel del paciente — RitmoVital" },
      {
        name: "description",
        content:
          "Resumen de salud, métricas del perfil, tendencia semanal, alertas recientes y asistente clínico local.",
      },
      { property: "og:title", content: "Panel del paciente — RitmoVital" },
      {
        property: "og:description",
        content: "Tu resumen cardiovascular y orientación clínica en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { sesion } = useSesion();
  const d = useDispositivo();
  const { lista, cargando: cargandoDatos } = useMediciones(sesion?.id);
  const [mensaje, setMensaje] = useState("");
  const [respuesta, setRespuesta] = useState<RespuestaAsistente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [saludo, setSaludo] = useState("Hola");
  useEffect(() => {
    const hour = Number(
      new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        hour: "numeric",
        hourCycle: "h23",
      }).format(new Date()),
    );
    setSaludo(hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches");
  }, []);
  if (!sesion) return null;
  const resumen = resumenClinico(lista, sesion?.umbralAlertaBpm);
  const imc = imcDe(sesion);
  const maxBar = Math.max(1, ...resumen.dias.map((day) => day.bpm ?? 0));
  const preguntar = async () => {
    if (cargando || !mensaje.trim()) return;
    setCargando(true);
    setError("");
    try {
      setRespuesta(
        await consultarAsistente({
          imc,
          bpm: d.enVivo || d.simulacion ? d.bpm : 0,
          mensaje: mensaje.trim(),
        }),
      );
    } catch {
      setRespuesta(null);
      setError("No se pudo conectar con la IA local. Comprueba que tu servidor esté encendido.");
    } finally {
      setCargando(false);
    }
  };
  const metrics = [
    {
      label: "IMC actual",
      value: imc > 0 ? String(imc) : "—",
      unit: "kg/m²",
      detail: "Según peso y estatura del perfil",
      icon: Scale,
    },
    {
      label: "Promedio BPM semanal",
      value: resumen.promedio ?? "—",
      unit: "BPM",
      detail: `${resumen.cantidad} tomas · últimos 7 días`,
      icon: Activity,
    },
    {
      label: "BPM en reposo",
      value: sesion.fcReposo > 0 ? sesion.fcReposo : "—",
      unit: "BPM",
      detail: "Valor guardado en tu perfil",
      icon: Heart,
    },
    {
      label: "Última oxigenación",
      value: d.ultimaOxigenacion?.valor ?? "—",
      unit: "% SpO₂",
      detail: d.ultimaOxigenacion
        ? new Date(d.ultimaOxigenacion.recibida).toLocaleString("es-CO")
        : "Sin lectura del sensor en esta sesión",
      icon: Wind,
    },
  ];
  return (
    <AppShell
      sesion={sesion}
      titulo={`${saludo}, ${sesion.nombre.split(" ")[0]}`}
      migas={[
        { label: "Inicio", to: "/inicio" },
        { label: "Monitoreo", to: "/monitoreo" },
        { label: "Panel Principal" },
      ]}
      acciones={
        <Button asChild>
          <Link to="/monitoreo">
            <Activity /> Abrir monitoreo
          </Link>
        </Button>
      }
    >
      <p className="mt-3 text-muted-foreground">Resumen de tu salud cardiovascular</p>
      <section
        aria-label="Métricas de salud"
        className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ label, value, unit, detail, icon: Icon }) => (
          <article key={label} className="glass rounded-lg border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="size-5 text-brand" />
            </div>
            <p className="mt-4 font-display text-3xl font-semibold">
              {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </article>
        ))}
      </section>
      <div className="mt-7 grid gap-7 xl:grid-cols-[1.45fr_1fr]">
        <div>
          <section aria-label="Tendencia semanal" className="border-y border-border py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Tendencia semanal</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Promedio diario de tomas guardadas · semana actual
                </p>
              </div>
              <Button asChild variant="link">
                <Link to="/reportes">
                  Reportes <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="mt-6 grid h-64 grid-cols-7 gap-2 sm:gap-4">
              {resumen.dias.map((day) => (
                <div key={day.dia} className="flex min-w-0 flex-col items-center justify-end gap-2">
                  <span className="text-xs font-medium">{day.bpm ?? "—"}</span>
                  <div className="flex h-44 w-full items-end border-b border-border">
                    <svg
                      role="img"
                      aria-label={`${day.dia}: ${day.bpm === null ? "sin datos" : `${day.bpm} BPM`}`}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className={`h-full w-full ${day.bpm !== null && day.bpm >= 120 ? "text-warn" : "text-brand/65"}`}
                    >
                      <rect
                        x="8"
                        y={100 - ((day.bpm ?? 0) / maxBar) * 100}
                        width="84"
                        height={((day.bpm ?? 0) / maxBar) * 100}
                        rx="3"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground">{day.dia}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {cargandoDatos
                ? "Cargando tomas…"
                : resumen.cantidad
                  ? "BPM · los días sin tomas se muestran sin barra."
                  : "Aún no hay tomas en los últimos siete días."}
            </p>
          </section>
          <section aria-label="Alertas recientes" className="py-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Bell className="size-5 text-warn" /> Alertas rápidas
            </h2>
            {d.alertaActiva && (d.enVivo || d.simulacion) && (
              <p role="alert" className="mt-3 border-l-4 border-warn bg-warn/10 p-3 text-sm">
                {d.simulacion ? "Prueba simulada" : "Lectura actual"}: {d.bpm} BPM.{" "}
                <Link to="/monitoreo" className="font-medium text-brand underline">
                  Revisar en Monitoreo
                </Link>
              </p>
            )}
            <ul className="mt-3 divide-y divide-border">
              {resumen.alertas.slice(0, 3).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{m.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.fecha} · {m.contexto}
                    </p>
                  </div>
                  <span className="font-display font-semibold text-warn">{m.bpm} BPM</span>
                </li>
              ))}
            </ul>
            {!resumen.alertas.length && (
              <p className="mt-3 text-sm text-muted-foreground">
                {resumen.cantidad
                  ? "Sin picos por encima de tu límite de alerta en las tomas recientes."
                  : "Sin tomas recientes para evaluar picos cardíacos."}
              </p>
            )}
            <Button asChild variant="link" className="mt-3 px-0">
              <Link to="/mediciones">
                Ver mediciones <ArrowRight />
              </Link>
            </Button>
          </section>
        </div>
        <section aria-label="Asistente clínico" className="border-t border-border py-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageCircle className="size-5 text-brand" /> Asistente clínico IA
          </h2>
          <Etiqueta>Ollama · consulta local</Etiqueta>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Orientación general sobre salud cardíaca; no diagnostica ni sustituye a un profesional.
            Ante una urgencia, busca atención médica.
          </p>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={5}
            aria-label="Pregunta al asistente de salud"
            placeholder="Ej. ¿Qué significa mi pulso en reposo?"
            className="mt-4 w-full resize-y rounded-lg border border-input bg-panel/70 p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            IMC enviado: {imc || "sin datos"} ·{" "}
            {d.simulacion ? "BPM de simulación" : "BPM del sensor"}:{" "}
            {d.enVivo || d.simulacion ? d.bpm : "sin lectura"}
          </p>
          <Button onClick={preguntar} disabled={cargando || !mensaje.trim()} className="mt-4">
            <MessageCircle /> {cargando ? "Consultando…" : "Enviar consulta"}
          </Button>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          {respuesta && (
            <div className="mt-5 border-l-4 border-brand bg-accent/50 p-4 text-sm leading-relaxed">
              {respuesta.alerta_activa && (
                <p className="mb-2 font-semibold text-alert">
                  Alerta activa · {respuesta.bpm_registrado} BPM
                </p>
              )}
              <p>{respuesta.respuesta_asistente}</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
