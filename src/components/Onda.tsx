import { useEffect, useRef } from "react";

// BPM readings describe cadence, not raw ECG voltage. Use a schematic pulse
// with six fixed-width beats per viewport; history length never changes it.
const BEATS_PER_LOOP = 6;
const BASE_BPM = 72;
const PATH_BUCLE = Array.from({ length: BEATS_PER_LOOP * 2 }, (_, i) => {
  const start = i * (400 / BEATS_PER_LOOP);
  const x = (offset: number) => (start + offset).toFixed(3);
  return `L${x(24)},50 L${x(30)},50 L${x(35)},22 L${x(40)},72 L${x(46)},50 L${x(400 / BEATS_PER_LOOP)},50`;
}).join(" ");

export function Onda({
  alto = "h-28",
  muestras = [],
  activa = true,
  alerta = false,
  pausada = false,
}: {
  alto?: string;
  muestras?: number[];
  activa?: boolean;
  alerta?: boolean;
  pausada?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const lastReading = muestras.at(-1);
  const bpm = typeof lastReading === "number" && Number.isFinite(lastReading) && lastReading > 0
    ? lastReading : BASE_BPM;
  const cadence = useRef(bpm);
  const frozen = useRef(pausada);
  frozen.current = pausada;

  useEffect(() => {
    cadence.current = bpm;
    // Change speed without restarting the animation or resetting its phase.
    animation.current?.updatePlaybackRate(bpm / BASE_BPM);
  }, [bpm]);

  useEffect(() => {
    const element = track.current;
    if (!element || !activa) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      animation.current?.cancel();
      animation.current = null;
      if (reducedMotion.matches) return;
      animation.current = element.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
        { duration: BEATS_PER_LOOP * 60_000 / BASE_BPM, iterations: Infinity, easing: "linear" },
      );
      animation.current.updatePlaybackRate(cadence.current / BASE_BPM);
      if (frozen.current) animation.current.pause();
    };
    sync();
    reducedMotion.addEventListener("change", sync);
    return () => {
      reducedMotion.removeEventListener("change", sync);
      animation.current?.cancel();
      animation.current = null;
    };
  }, [activa]);

  useEffect(() => {
    if (pausada) animation.current?.pause();
    else animation.current?.play();
  }, [pausada, activa]);

  return (
    <div
      className={`rv-waveform relative ${alto} overflow-hidden rounded-[14px] bg-brand/5 ring-1 ring-brand/10 ${alerta ? "rv-waveform-alert" : ""}`}
      role="img"
      aria-label={pausada ? "Pulso esquemático congelado" : activa ? "Representación ilustrativa del ritmo cardíaco" : "Ritmo cardíaco sin señal activa"}
      title="Representación ilustrativa basada en BPM; no es un electrocardiograma."
    >
      <div ref={track} className={`absolute inset-y-0 left-0 w-[200%] ${activa ? "opacity-90" : "opacity-40"}`}>
        <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="size-full" aria-hidden="true">
          <path d={`M0,50 ${PATH_BUCLE}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      {!activa && (
        <span className="absolute right-3 top-2 rounded-md bg-panel/80 px-2 py-0.5 text-[0.6875rem] text-ink/55">
          Esperando señal
        </span>
      )}
    </div>
  );
}
