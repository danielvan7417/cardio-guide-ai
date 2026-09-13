const PATH_BASE =
  "M0,50 L40,50 L52,50 L58,20 L64,80 L70,50 L95,50 L105,50 L112,24 L118,78 L124,50 L150,50 L160,50 L168,18 L174,82 L180,50 L210,50 L220,50 L228,22 L234,80 L240,50 L268,50 L278,50 L286,20 L292,82 L298,50 L330,50 L340,50 L348,24 L354,78 L360,50 L400,50";

function pathDeMuestras(muestras: number[]) {
  const n = muestras.length;
  if (n < 2) return null;
  const min = Math.min(...muestras, 50);
  const max = Math.max(...muestras, 120);
  const rango = Math.max(max - min, 1);
  return muestras
    .map((v, i) => {
      const x = (i / (n - 1)) * 400;
      const y = 90 - ((v - min) / rango) * 76;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
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
  const d = pathDeMuestras(muestras) ?? PATH_BASE;
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
      <svg
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full opacity-85"
        aria-hidden="true"
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: "d 300ms linear" }}
        />
      </svg>
      {activa && (
        <div
          className="rv-sweep absolute bottom-0 top-0 w-24"
          style={{
            background: `linear-gradient(to right, transparent, color-mix(in oklab, ${color} 18%, transparent), transparent)`,
          }}
        />
      )}
    </div>
  );
}
