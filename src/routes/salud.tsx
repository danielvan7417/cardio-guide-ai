import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/Hub";

export const Route = createFileRoute("/salud")({
  head: () => ({
    meta: [
      { title: "Salud — RitmoVital" },
      { name: "description", content: "Diario de síntomas, reportes médicos exportables y zonas de entrenamiento." },
      { property: "og:title", content: "Salud — RitmoVital" },
      { property: "og:description", content: "Registro de síntomas y reportes clínicos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Hub
      titulo="Salud"
      seccion="Salud"
      opciones={[
        { to: "/sintomas", titulo: "Registro de Síntomas", descripcion: "Bitácora de síntomas con pulso y contexto.", icono: "✚" },
        { to: "/reportes", titulo: "Reportes y Zonas", descripcion: "Exporta PDF/Excel y calcula tus zonas cardíacas.", icono: "▦" },
      ]}
    />
  ),
});
