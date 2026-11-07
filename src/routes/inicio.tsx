import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { useSesion } from "@/lib/sesion";
import { Activity, ArrowRight, Bluetooth, BrainCircuit, FileText, HeartPulse, List, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import corazonHero from "@/assets/corazon-hero.jpg";

const PASOS = [
  { icono: Bluetooth, titulo: "Conecta", texto: "Vincula tu sensor ESP32 por Bluetooth en un clic." },
  { icono: HeartPulse, titulo: "Monitorea", texto: "Pulso y oxigenación en vivo, con alertas al instante." },
  { icono: BrainCircuit, titulo: "Analiza", texto: "El asistente interpreta tus datos con tu edad e IMC." },
] as const;

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Bienvenido a RitmoVital — Salud cardíaca" },
      {
        name: "description",
        content:
          "Conoce RitmoVital: qué es, en qué se basa y qué funciones ofrece para cuidar tu corazón.",
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
  {
    icono: Activity,
    titulo: "Panel Principal",
    texto: "Resumen de salud, tendencia semanal, alertas recientes y asistente clínico.",
    to: "/dashboard",
  },
  {
    icono: HeartPulse,
    titulo: "Centro de monitoreo",
    texto: "Pulso en vivo, conexión del ESP32 y controles de adquisición.",
    to: "/monitoreo",
  },
  {
    icono: List,
    titulo: "Historial de mediciones",
    texto: "Todas tus lecturas guardadas, filtrables por contexto.",
    to: "/mediciones",
  },
  {
    icono: Stethoscope,
    titulo: "Diario de síntomas",
    texto: "Registra pulso, contexto (reposo, ejercicio, estrés), síntomas y notas.",
    to: "/sintomas",
  },
  {
    icono: FileText,
    titulo: "Reportes y zonas",
    texto: "Exporta tu historial y calcula tus zonas de entrenamiento cardíaco.",
    to: "/reportes",
  },
  {
    icono: UserRound,
    titulo: "Perfil biométrico",
    texto: "Edad, peso, estatura, tipo de sangre y FC en reposo.",
    to: "/perfil",
  },
] as const;

function Inicio() {
  const { sesion } = useSesion();
  if (!sesion) return null;
  return (
    <AppShell sesion={sesion} titulo="Bienvenido a RitmoVital" migas={[{ label: "Inicio" }]}>
      <section className="glass mt-5 grid items-center gap-6 overflow-hidden rounded-[24px] p-6 ring-1 ring-ink/5 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/12 px-3 py-1 text-sm font-medium text-brand">
            <HeartPulse className="size-4" /> Salud cardíaca en tiempo real
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Tu corazón, monitoreado y explicado en palabras sencillas.
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { i: Bluetooth, t: "Sensor en vivo" },
              { i: BrainCircuit, t: "IA local" },
              { i: ShieldCheck, t: "Ley 1581" },
            ].map(({ i: I, t }) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-sm text-ink/75 ring-1 ring-ink/10">
                <I className="size-4 text-brand" /> {t}
              </span>
            ))}
          </div>
          <p className="mt-6 text-base text-ink/70">
            <strong className="text-ink">Primer paso:</strong> completa tu perfil (edad, peso,
            estatura y FC en reposo) para que tu IMC, tus zonas y el asistente sean más precisos.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/monitoreo" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-medium text-brand-foreground transition hover:opacity-90">
              Comenzar monitoreo <ArrowRight className="size-4" />
            </Link>
            <Link to="/perfil" className="inline-flex items-center gap-2 rounded-xl bg-panel px-5 py-3 font-medium text-ink ring-1 ring-ink/10 transition hover:ring-brand/40">
              Completar mi perfil
            </Link>
          </div>
        </div>
        <img src={corazonHero} alt="Corazón de cristal con línea de pulso" width={1024} height={1024} className="mx-auto aspect-square w-full max-w-sm rounded-[20px] object-cover" />
      </section>

      <h2 className="mt-8 font-display text-xl font-semibold">Cómo funciona</h2>
      <section className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {PASOS.map((p, n) => (
          <div key={p.titulo} className="glass relative rounded-[20px] p-6 ring-1 ring-ink/5">
            <span className="absolute right-5 top-4 font-display text-4xl font-semibold text-brand/20">{n + 1}</span>
            <span className="grid size-12 place-items-center rounded-2xl bg-brand text-brand-foreground">
              <p.icono className="size-6" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold">{p.titulo}</p>
            <p className="mt-1 text-base text-ink/65">{p.texto}</p>
          </div>
        ))}
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
              <f.icono className="size-5" />
            </span>
            <p className="font-display text-lg font-semibold">{f.titulo}</p>
            <p className="text-base text-ink/65">{f.texto}</p>
            <span className="mt-auto text-sm font-medium text-brand group-hover:underline">
              Abrir →
            </span>
          </Link>
        ))}
      </section>

      <Card className="mt-5">
        <p className="text-base text-ink/70">
          <strong>Importante:</strong> RitmoVital es una herramienta de acompañamiento y no
          reemplaza la valoración de un profesional de la salud. Ante una alerta persistente,
          consulta a tu médico.
        </p>
      </Card>
    </AppShell>
  );
}
