import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Etiqueta } from "@/components/AppShell";
import { zonasEntrenamiento } from "@/lib/ritmo";
import { useSesion } from "@/lib/sesion";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes y zonas de entrenamiento — RitmoVital" },
      {
        name: "description",
        content:
          "Exporta informes médicos por rango de fechas en PDF o Excel y calcula tus zonas de entrenamiento por BPM.",
      },
      { property: "og:title", content: "Reportes y zonas — RitmoVital" },
      {
        property: "og:description",
        content: "Informes clínicos exportables y calculadora de zonas cardíacas.",
      },
    ],
  }),
  component: Reportes,
});

function Reportes() {
  const { sesion } = useSesion();
  const [desde, setDesde] = useState("2026-09-01");
  const [hasta, setHasta] = useState("2026-09-12");
  const [aviso, setAviso] = useState("");
  const [edad, setEdad] = useState(34);
  const [reposo, setReposo] = useState(68);

  if (!sesion) return null;
  const zonas = zonasEntrenamiento(edad, reposo);
  const fcMax = 220 - edad;

  const exportar = (formato: "PDF" | "Excel") =>
    setAviso(`Informe ${formato} generado para el rango ${desde} → ${hasta}.`);

  return (
    <AppShell
      sesion={sesion}
      titulo="Reportes y zonas de entrenamiento"
      migas={[{ label: "Inicio", to: "/dashboard" }, { label: "Reportes" }]}
    >
      <section className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <Etiqueta>Informe médico</Etiqueta>
          <p className="mt-0.5 text-sm text-ink/60">Selecciona el rango de fechas a exportar.</p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink/55">Desde</span>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink/55">Hasta</span>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="rounded-xl bg-panel/70 px-4 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => exportar("PDF")}
                className="flex-1 rounded-xl bg-brand px-3 py-2.5 text-sm font-medium text-brand-foreground ring-1 ring-brand/40 hover:bg-brand/90"
              >
                Exportar PDF
              </button>
              <button
                onClick={() => exportar("Excel")}
                className="flex-1 rounded-xl bg-panel/60 px-3 py-2.5 text-sm font-medium text-ink/80 ring-1 ring-ink/10 hover:bg-panel/80"
              >
                Exportar Excel
              </button>
            </div>
            {aviso && (
              <p className="rounded-xl bg-ok/10 px-3 py-2 text-[13px] text-ok ring-1 ring-ok/25">
                {aviso}
              </p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Etiqueta>Calculadora de zonas</Etiqueta>
              <p className="mt-0.5 text-sm text-ink/60">
                Frecuencia máxima estimada: <strong className="font-display">{fcMax} BPM</strong>
              </p>
            </div>
            <div className="flex gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] text-ink/55">Edad</span>
                <input
                  type="number"
                  min={12}
                  max={95}
                  value={edad}
                  onChange={(e) => setEdad(Number(e.target.value) || 0)}
                  className="w-24 rounded-xl bg-panel/70 px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] text-ink/55">FC en reposo</span>
                <input
                  type="number"
                  min={35}
                  max={110}
                  value={reposo}
                  onChange={(e) => setReposo(Number(e.target.value) || 0)}
                  className="w-28 rounded-xl bg-panel/70 px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {zonas.map((z, i) => (
              <div key={z.nombre} className="rounded-xl bg-panel/55 p-4 ring-1 ring-ink/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-sm font-semibold">{z.nombre}</p>
                  <span className="text-[13px] text-ink/60">
                    {z.desde} – {z.hasta} BPM · {z.porcentaje}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand/10">
                  <div
                    className={`h-full rounded-full ${i === 3 ? "bg-warn" : "bg-brand"}`}
                    style={{ width: `${40 + i * 20}%`, opacity: 0.4 + i * 0.2 }}
                  />
                </div>
                <p className="mt-2 text-[12px] text-ink/55">{z.descripcion}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
