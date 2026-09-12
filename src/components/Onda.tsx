export function Onda({ alto = "h-28" }: { alto?: string }) {
  return (
    <div className={`relative ${alto} overflow-hidden rounded-[14px] bg-brand/5 ring-1 ring-brand/10`}>
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
          d="M0,50 L40,50 L52,50 L58,20 L64,80 L70,50 L95,50 L105,50 L112,24 L118,78 L124,50 L150,50 L160,50 L168,18 L174,82 L180,50 L210,50 L220,50 L228,22 L234,80 L240,50 L268,50 L278,50 L286,20 L292,82 L298,50 L330,50 L340,50 L348,24 L354,78 L360,50 L400,50"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div
        className="rv-sweep absolute bottom-0 top-0 w-24"
        style={{
          background:
            "linear-gradient(to right, transparent, color-mix(in oklab, var(--brand) 18%, transparent), transparent)",
        }}
      />
    </div>
  );
}
