import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cerrarSesion, type Sesion } from "@/lib/sesion";

type NavItem = { to: string; label: string; icon: string };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Inicio", icon: "◉" },
  { to: "/mediciones", label: "Mediciones", icon: "▤" },
  { to: "/sintomas", label: "Síntomas", icon: "✚" },
  { to: "/reportes", label: "Reportes", icon: "▦" },
  { to: "/perfil", label: "Perfil", icon: "◐" },
];

const CLAVE_SIDEBAR = "ritmovital:sidebar";

export function AppShell({
  sesion,
  titulo,
  migas,
  acciones,
  children,
}: {
  sesion: Sesion;
  titulo: string;
  migas: { label: string; to?: string }[];
  acciones?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [colapsada, setColapsada] = useState(false);

  useEffect(() => {
    setColapsada(localStorage.getItem(CLAVE_SIDEBAR) === "1");
  }, []);

  const alternarSidebar = () => {
    setColapsada((v) => {
      localStorage.setItem(CLAVE_SIDEBAR, v ? "0" : "1");
      return !v;
    });
  };

  const salir = async () => {
    await cerrarSesion();
    navigate({ to: "/", replace: true });
  };

  const enlaces = (mini = false) => (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          title={item.label}
          onClick={() => setMenuAbierto(false)}
          className={`flex items-center gap-3 rounded-xl py-2.5 text-sm text-ink/70 transition-colors hover:bg-panel/50 ${
            mini ? "justify-center px-0" : "px-3"
          }`}
          activeProps={{
            className: `flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium bg-panel/70 text-brand ring-1 ring-brand/15 ${
              mini ? "justify-center px-0" : "px-3"
            }`,
          }}
        >
          <span className="text-[13px]">{item.icon}</span>
          {!mini && item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="flex w-full min-h-screen">
        <aside
          className={`glass-soft sticky top-0 hidden h-screen shrink-0 flex-col gap-5 overflow-hidden border-r border-panel/60 p-4 transition-[width] duration-300 ease-out lg:flex ${
            colapsada ? "w-[76px]" : "w-64"
          }`}
        >
          <div
            className={`flex items-center gap-2 ${colapsada ? "justify-center" : "justify-between"}`}
          >
            {!colapsada && <Marca />}
            <button
              onClick={alternarSidebar}
              aria-expanded={!colapsada}
              aria-label={colapsada ? "Expandir menú lateral" : "Contraer menú lateral"}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-panel/70 text-sm text-ink/70 ring-1 ring-ink/5 transition-colors hover:bg-panel"
            >
              ☰
            </button>
          </div>
          <div className="mt-1">{enlaces(colapsada)}</div>
          {colapsada ? (
            <button
              onClick={salir}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="mt-auto grid size-9 place-items-center self-center rounded-xl bg-panel/70 text-sm text-ink/70 ring-1 ring-ink/5 hover:bg-panel"
            >
              ⏻
            </button>
          ) : (
            <div className="mt-auto rounded-2xl bg-panel/50 p-4 ring-1 ring-ink/5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink/45">Sesión</p>
              <p className="mt-1 font-display text-sm font-medium">{sesion.nombre}</p>
              <p className="text-[11px] text-ink/50">
                Tipo {sesion.tipoSangre} · {sesion.edad} años
              </p>
              <button
                onClick={salir}
                className="mt-3 w-full rounded-lg bg-panel/70 px-3 py-2 text-[12px] font-medium text-ink/70 ring-1 ring-ink/5 hover:bg-panel"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 xl:p-8 2xl:p-10 2xl:text-[1.05rem]">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Marca />
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              aria-expanded={menuAbierto}
              className="rounded-xl bg-panel/70 px-3 py-2 text-sm ring-1 ring-ink/5"
            >
              ☰ Menú
            </button>
          </div>
          {menuAbierto && (
            <div className="glass mb-4 rounded-2xl p-3 ring-1 ring-ink/5 lg:hidden">
              {enlaces()}
              <button
                onClick={salir}
                className="mt-2 w-full rounded-lg bg-panel/70 px-3 py-2 text-[12px] font-medium text-ink/70 ring-1 ring-ink/5"
              >
                Cerrar sesión
              </button>
            </div>
          )}


          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-2 text-[13px] text-ink/55">
                {migas.map((m, i) => (
                  <span key={m.label} className="flex items-center gap-2">
                    {m.to ? (
                      <Link to={m.to} className="text-brand hover:underline">
                        {m.label}
                      </Link>
                    ) : (
                      <span className={i === migas.length - 1 ? "font-medium text-ink/80" : ""} aria-current={i === migas.length - 1 ? "page" : undefined}>{m.label}</span>
                    )}
                    {i < migas.length - 1 && <span className="text-ink/35">/</span>}
                  </span>
                ))}
              </nav>
              <h1 className="mt-1 max-w-[40ch] text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {titulo}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.history.back()}
                className="inline-flex items-center gap-2 rounded-xl bg-volver py-2 pl-3 pr-4 text-sm font-medium text-volver-foreground shadow-sm ring-1 ring-volver-hover/40 transition-colors hover:bg-volver-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volver-hover"
              >
                <span className="text-[13px]">←</span> Volver
              </button>
              {acciones}
            </div>
          </header>

          {children}

          <footer className="mt-8 text-[12px] text-ink/45">
            RitmoVital · Herramienta de monitoreo, no sustituye la valoración médica. Datos tratados
            conforme a la Ley 1581 de 2012 (Colombia).
          </footer>
        </main>
      </div>
    </div>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-[10px] bg-brand/15">
        <span className="rv-pulse size-2.5 rounded-full bg-brand" />
      </div>
      <div>
        <p className="font-display text-[15px] font-semibold">RitmoVital</p>
        <p className="text-[11px] text-ink/50">Monitoreo cardíaco</p>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-[20px] p-5 ring-1 ring-ink/5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] uppercase tracking-[0.14em] text-ink/50">{children}</p>
  );
}

export function EstadoPill({ estado }: { estado: "Normal" | "Elevado" }) {
  const ok = estado === "Normal";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ${
        ok ? "bg-ok/10 text-ok ring-ok/25" : "bg-warn/10 text-warn ring-warn/25"
      }`}
    >
      <span className={`size-1.5 rounded-full ${ok ? "bg-ok" : "bg-warn"}`} /> {estado}
    </span>
  );
}
