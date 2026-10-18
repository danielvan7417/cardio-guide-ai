import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/Hub";

export const Route = createFileRoute("/monitoreo")({
  head: () => ({
    meta: [
      { title: "Monitoreo — RitmoVital" },
      { name: "description", content: "Accede al panel en tiempo real y al historial de mediciones cardíacas." },
      { property: "og:title", content: "Monitoreo — RitmoVital" },
      { property: "og:description", content: "Panel principal e historial de mediciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Hub
      titulo="Monitoreo"
      seccion="Monitoreo"
      opciones={[
        { to: "/dashboard", titulo: "Panel Principal", descripcion: "Pulso en vivo, alertas y asistente clínico.", icono: "◉" },
        { to: "/mediciones", titulo: "Historial de Mediciones", descripcion: "Traza del sensor y lecturas guardadas.", icono: "▤" },
      ]}
    />
  ),
});
