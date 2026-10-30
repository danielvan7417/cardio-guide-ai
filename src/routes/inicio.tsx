import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { useSesion } from "@/lib/sesion";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Bienvenido a RitmoVital — Salud cardíaca" },
      {
        name: "description",
        content: "Conoce RitmoVital: qué es, en qué se basa y qué funciones ofrece para cuidar tu corazón.",
      },
      { property: "og:title", content: "Bienvenido a RitmoVital — Salud cardíaca" },
      {
        property: "og:description",
        content: "Monitoreo cardíaco con sensor ESP32, diario de síntomas, reportes e IA local.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

const FUNCIONES = [
  { icono: "◉", titulo: "Panel en tiempo real", texto: "Onda de pulso en vivo, estado óptimo o de alerta y tendencia semanal.", to: "/dashboard" },
  { icono: "▤", titulo: "Historial de mediciones", texto: "Todas tus lecturas guardadas, filtrables por contexto.", to: "/mediciones" },
  { icono: "✚", titulo: "Diario de síntomas", texto: "Registra pulso, contexto (reposo, ejercicio, estrés), síntomas y notas.", to: "/sintomas" },
  { icono: "▦", titulo: "Reportes y zonas", texto: "Exporta tu historial y calcula tus zonas de entrenamiento cardíaco.", to: "/reportes" },
  { icono: "◐", titulo: "Perfil biométrico", texto: "Edad, peso, estatura, tipo de sangre y FC en reposo.", to: "/perfil" },
] as const;

function Inicio() {
  const { sesion } = useSesion();
  if (!sesion) return null;
  return (
    <AppShell
      sesion={sesion}
      titulo="Bienvenido a RitmoVital"
      migas={[{ label: "Inicio" }]}
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Etiqueta>¿Qué es RitmoVital?</Etiqueta>
          <p className="mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">
            Tu corazón, monitoreado en tiempo real y explicado en palabras sencillas.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/70">
            RitmoVital es una plataforma de monitoreo de salud cardíaca. Recibe el pulso desde un
            sensor físico (ESP32), lo muestra al instante, detecta cuando supera un umbral seguro y te
            permite consultar a un asistente con inteligencia artificial que corre en tu propio
            computador, usando tu IMC y tu pulso actual.
          </p>
        </Card>
        <Card>
          <Etiqueta>En qué se basa</Etiqueta>
          <ul className="mt-3 flex flex-col gap-3 text-base text-ink/75">
            <li>• Sensor ESP32 que envía tu pulso en vivo.</li>
            <li>• Regla clínica fija: alerta cuando el pulso supera el umbral.</li>
            <li>• Zonas cardíacas calculadas con tu edad y FC en reposo.</li>
            <li>• Asistente de IA local: tus consultas no salen de tu equipo.</li>
            <li>• Datos protegidos según la Ley 1581 de 2012.</li>
          </ul>
        </Card>
      </section>

      <h2 className="mt-8 font-display text-xl font-semibold">Lo que encontrarás</h2>
      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
        {FUNCIONES.map((f) => (
          <Link
            key={f.to}
            to={f.to}
            className="glass group flex flex-col gap-3 rounded-[20px] p-6 ring-1 ring-ink/5 transition hover:ring-brand/30"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-brand/12 text-lg text-brand">
              {f.icono}
            </span>
            <p className="font-display text-lg font-semibold">{f.titulo}</p>
            <p className="text-base text-ink/65">{f.texto}</p>
            <span className="mt-auto text-sm font-medium text-brand group-hover:underline">Abrir →</span>
          </Link>
        ))}
      </section>

      <Card className="mt-5">
        <p className="text-base text-ink/70">
          <strong>Importante:</strong> RitmoVital es una herramienta de acompañamiento y no reemplaza
          la valoración de un profesional de la salud. Ante una alerta persistente, consulta a tu médico.
        </p>
      </Card>
    </AppShell>
  );
}
