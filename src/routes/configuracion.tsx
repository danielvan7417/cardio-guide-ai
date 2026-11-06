import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/Hub";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — RitmoVital" },
      { name: "description", content: "Gestiona tu perfil, datos biométricos y consentimiento de datos." },
      { property: "og:title", content: "Configuración — RitmoVital" },
      { property: "og:description", content: "Ajustes de cuenta y perfil de usuario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Hub
      titulo="Configuración"
      seccion="Configuración"
      opciones={[
        { to: "/perfil", titulo: "Perfil de Usuario", descripcion: "Datos biométricos, contraseña y consentimiento.", icono: "◐" },
      ]}
    />
  ),
});
