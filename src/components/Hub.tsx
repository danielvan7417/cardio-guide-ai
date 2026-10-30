import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useSesion } from "@/lib/sesion";

export type OpcionHub = { to: string; titulo: string; descripcion: string; icono: string };

/** Página de sección (nivel 2 de la miga de pan) con accesos a sus subpáginas. */
export function Hub({ titulo, seccion, opciones }: { titulo: string; seccion: string; opciones: OpcionHub[] }) {
  const { sesion } = useSesion();
  if (!sesion) return null;
  return (
    <AppShell
      sesion={sesion}
      titulo={titulo}
      migas={[{ label: "Inicio", to: "/inicio" }, { label: seccion }]}
    >
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
        {opciones.map((o) => (
          <Link
            key={o.to}
            to={o.to}
            className="glass group flex flex-col gap-3 rounded-[20px] p-6 ring-1 ring-ink/5 transition hover:ring-brand/30 2xl:p-8"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-brand/12 text-lg text-brand">
              {o.icono}
            </span>
            <div>
              <p className="font-display text-lg font-semibold">{o.titulo}</p>
              <p className="mt-1 text-sm text-ink/60">{o.descripcion}</p>
            </div>
            <span className="mt-auto text-[0.8125rem] font-medium text-brand group-hover:underline">
              Abrir →
            </span>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
