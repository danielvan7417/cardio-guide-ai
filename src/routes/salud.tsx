import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { useSintomas } from "@/lib/datos";
import { imcDe, useSesion } from "@/lib/sesion";
import { CONTEXTOS } from "@/lib/ritmo";

export const Route = createFileRoute("/salud")({
  head: () => ({
    meta: [
      { title: "Salud y bienestar — RitmoVital" },
      {
        name: "description",
        content: "Resumen de tus síntomas, IMC, zonas cardíacas y accesos a reportes.",
      },
      { property: "og:title", content: "Salud y bienestar — RitmoVital" },
      { property: "og:description", content: "Síntomas frecuentes, IMC y zonas de entrenamiento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Salud,
});

function Salud() {
  const { sesion } = useSesion();
  const { lista } = useSintomas(sesion?.id);
  if (!sesion) return null;

  const conteo = new Map<string, number>();
  lista.forEach((r) =>
    r.sintomas
      .filter((s) => s !== "Ninguno")
      .forEach((s) => conteo.set(s, (conteo.get(s) ?? 0) + 1)),
  );
  const frecuentes = [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  const maxConteo = frecuentes[0]?.[1] ?? 1;
  const contextos = CONTEXTOS.map((c) => ({ c, n: lista.filter((r) => r.contexto === c).length }));

  const imc = imcDe(sesion);
  const imcTexto =
    imc < 18.5 ? "Bajo peso" : imc < 25 ? "Saludable" : imc < 30 ? "Sobrepeso" : "Obesidad";
  const fcMax = 220 - (sesion.edad || 0);
  const zonas = [
    { n: "Calentamiento", a: 0.5, b: 0.6 },
    { n: "Quema de grasa", a: 0.6, b: 0.7 },
    { n: "Cardio", a: 0.7, b: 0.85 },
    { n: "Pico", a: 0.85, b: 1 },
  ];

  return (
    <AppShell
      sesion={sesion}
      titulo="Tu salud y bienestar"
      migas={[{ label: "Inicio", to: "/inicio" }, { label: "Salud" }]}
      acciones={
        <Link
          to="/sintomas"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90"
        >
          ＋ Registrar síntoma
        </Link>
      }
    >
      <section className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-5">
        <Card>
          <Etiqueta>Registros de síntomas</Etiqueta>
          <p className="mt-2 font-display text-3xl font-semibold">{lista.length}</p>
          <p className="text-sm text-ink/55">
            {lista[0] ? `Último: ${lista[0].fecha}` : "Sin registros aún"}
          </p>
        </Card>
        <Card>
          <Etiqueta>Índice de masa corporal</Etiqueta>
          <p className="mt-2 font-display text-3xl font-semibold">{imc || "—"}</p>
          <p className="text-sm text-ink/55">
            {imc ? imcTexto : "Completa peso y estatura en tu perfil"}
          </p>
        </Card>
        <Card>
          <Etiqueta>FC en reposo</Etiqueta>
          <p className="mt-2 font-display text-3xl font-semibold">
            {sesion.fcReposo || "—"} <span className="text-base text-ink/50">BPM</span>
          </p>
          <p className="text-sm text-ink/55">Tipo de sangre {sesion.tipoSangre}</p>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <Etiqueta>Síntomas más frecuentes</Etiqueta>
            <Link to="/sintomas" className="text-sm font-medium text-brand hover:underline">
              Ver diario →
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {frecuentes.map(([s, n]) => (
              <div key={s}>
                <div className="flex justify-between text-sm">
                  <span>{s}</span>
                  <span className="text-ink/55">{n}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-panel ring-1 ring-ink/5">
                  <div
                    className="h-full rounded-full bg-warn/60"
                    style={{ width: `${(n / maxConteo) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!frecuentes.length && (
              <p className="text-sm text-ink/55">Sin síntomas registrados. ¡Buena señal!</p>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {contextos.map(({ c, n }) => (
              <span
                key={c}
                className="rounded-lg bg-panel/70 px-3 py-1 text-sm text-ink/65 ring-1 ring-ink/5"
              >
                {c}: {n}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <Etiqueta>Tus zonas cardíacas</Etiqueta>
            <Link to="/reportes" className="text-sm font-medium text-brand hover:underline">
              Calculadora →
            </Link>
          </div>
          {sesion.edad ? (
            <div className="mt-4 flex flex-col gap-2">
              {zonas.map((z) => (
                <div
                  key={z.n}
                  className="flex items-center justify-between rounded-xl bg-panel/55 px-4 py-2.5 ring-1 ring-ink/5"
                >
                  <span>{z.n}</span>
                  <span className="font-display font-semibold">
                    {Math.round(fcMax * z.a)}–{Math.round(fcMax * z.b)} BPM
                  </span>
                </div>
              ))}
              <p className="text-sm text-ink/55">
                Basado en tu edad ({sesion.edad} años), FC máxima {fcMax} BPM.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/55">
              Agrega tu edad en el perfil para calcular tus zonas.
            </p>
          )}
        </Card>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5">
        <Link
          to="/sintomas"
          className="glass group rounded-[20px] p-6 ring-1 ring-ink/5 transition hover:ring-brand/30"
        >
          <p className="font-display text-lg font-semibold">✚ Registro de Síntomas</p>
          <p className="mt-1 text-sm text-ink/60">Anota pulso, contexto, síntomas y notas.</p>
        </Link>
        <Link
          to="/reportes"
          className="glass group rounded-[20px] p-6 ring-1 ring-ink/5 transition hover:ring-brand/30"
        >
          <p className="font-display text-lg font-semibold">▦ Reportes y Zonas</p>
          <p className="mt-1 text-sm text-ink/60">Exporta tu historial en PDF o Excel.</p>
        </Link>
      </section>
    </AppShell>
  );
}
