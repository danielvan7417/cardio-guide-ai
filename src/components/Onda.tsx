const PATRON =
  "L40,50 L52,50 L58,20 L64,80 L70,50 L95,50 L105,50 L112,24 L118,78 L124,50 L150,50 L160,50 L168,18 L174,82 L180,50 L210,50 L220,50 L228,22 L234,80 L240,50 L268,50 L278,50 L286,20 L292,82 L298,50 L330,50 L340,50 L348,24 L354,78 L360,50 L400,50";

/** Dos copias del patrón (0–800) para desplazar en bucle sin cortes. */
const PATH_BUCLE = (() => {
  const desplazado = PATRON.replace(/L(\d+(?:\.\d+)?),/g, (_, x: string) => `L${Number(x) + 400},`);
  return `M0,50 ${PATRON} ${desplazado}`;
})();

/** Convierte las muestras de BPM en un ECG: un complejo QRS por muestra,
 *  cuya amplitud depende del pulso. Al llegar cada muestra la traza avanza. */
function pathDeMuestras(muestras: number[]) {
  const n = muestras.length;
  if (n < 2) return null;
  const paso = 400 / (n - 1);
  let d = "M0,50";
  muestras.forEach((v, i) => {
    const x = i * paso;
    const amp = Math.min(42, 14 + (v - 50) * 0.3);
    d += ` L${(x + paso * 0.35).toFixed(1)},50 L${(x + paso * 0.45).toFixed(1)},${(50 - amp).toFixed(1)} L${(x + paso * 0.55).toFixed(1)},${(50 + amp * 0.7).toFixed(1)} L${(x + paso * 0.65).toFixed(1)},50 L${(x + paso).toFixed(1)},50`;
  });
  return d;
}

export function Onda({
  alto = "h-28",
  muestras = [],
  activa = true,
  alerta = false,
}: {
  alto?: string;
  muestras?: number[];
  activa?: boolean;
  alerta?: boolean;
}) {
  const d = pathDeMuestras(muestras);
  const color = alerta ? "var(--warn)" : "var(--brand)";

  return (
    <div
      className={`relative ${alto} overflow-hidden rounded-[14px] bg-brand/5 ring-1 ring-brand/10`}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--brand) 12%, transparent) 1px, transparent 1px)",
          backgroundSize: "40px 100%",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to top, color-mix(in oklab, var(--brand) 12%, transparent) 1px, transparent 1px)",
          backgroundSize: "100% 34px",
        }}
      />
      {d ? (
        <svg
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full opacity-90"
          aria-hidden="true"
        >
          <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      ) : (
        <div className={`absolute inset-y-0 left-0 w-[200%] ${activa ? "rv-scroll" : "rv-scroll opacity-40"}`}>
          <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="size-full" aria-hidden="true">
            <path d={PATH_BUCLE} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
      )}
      {activa && (
        <div
          className="rv-sweep absolute bottom-0 top-0 w-24"
          style={{
            background: `linear-gradient(to right, transparent, color-mix(in oklab, ${color} 18%, transparent), transparent)`,
          }}
        />
      )}
      {!d && !activa && (
        <span className="absolute right-3 top-2 rounded-md bg-panel/80 px-2 py-0.5 text-[0.6875rem] text-ink/55">
          Esperando señal
        </span>
      )}
    </div>
  );
}
