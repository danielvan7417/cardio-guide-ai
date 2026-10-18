import { useSyncExternalStore } from "react";
import { UMBRAL_BPM } from "@/lib/ritmo";

export type EstadoDispositivo =
  | "Buscando dispositivo"
  | "Conectado"
  | "Transmitiendo Live"
  | "Desconectado";

/** Endpoint donde el ESP32 publica sus tramas y desde donde la interfaz las lee. */
export const SENSOR_URL = "http://127.0.0.1:5000/api/sensor";

export type TramaSensor = {
  bpm: number;
  alerta_activa?: boolean;
  dispositivo?: string;
  timestamp?: string;
};

type EstadoStore = {
  estado: EstadoDispositivo;
  bpm: number;
  muestras: number[];
  ultimaTrama: string;
  simulacion: boolean;
  bpmSimulado: number;
  /** Último pulso real recibido del ESP32 (null si nunca llegó o se perdió la señal). */
  bpmEsp32: number | null;
};

const MAX_MUESTRAS = 48;
const CLAVE_SIMULACION = "ritmovital:simulacion";
const CLAVE_BPM_SIMULADO = "ritmovital:bpm-simulado";
const INTERVALO = 1200;

const INICIAL: EstadoStore = {
  estado: "Buscando dispositivo",
  bpm: 72,
  muestras: [],
  ultimaTrama: "",
  simulacion: false,
  bpmSimulado: 72,
  bpmEsp32: null,
};

/* Store global: vive mientras la app está abierta, así el modo simulación
   y la traza no se reinician al cambiar de página. */
let state: EstadoStore = INICIAL;
const oyentes = new Set<() => void>();
let iniciado = false;
let fallos = 0;
let leyendo = false;

function set(parcial: Partial<EstadoStore>) {
  state = { ...state, ...parcial };
  oyentes.forEach((o) => o());
}

function empujar(valor: number, extra: Partial<EstadoStore> = {}) {
  set({
    bpm: valor,
    muestras: [...state.muestras, valor].slice(-MAX_MUESTRAS),
    ultimaTrama: new Date().toLocaleTimeString("es-CO"),
    ...extra,
  });
}

async function leerSensor() {
  if (leyendo) return;
  leyendo = true;
  try {
    const res = await fetch(SENSOR_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    const trama = (await res.json()) as TramaSensor;
    if (typeof trama.bpm !== "number") throw new Error("trama inválida");
    fallos = 0;
    const v = Math.round(trama.bpm);
    if (state.simulacion) set({ bpmEsp32: v });
    else empujar(v, { estado: "Transmitiendo Live", bpmEsp32: v });
  } catch {
    fallos += 1;
    const perdido = fallos >= 3;
    set({
      bpmEsp32: perdido ? null : state.bpmEsp32,
      ...(state.simulacion ? {} : { estado: perdido ? "Desconectado" : "Buscando dispositivo" }),
    });
  } finally {
    leyendo = false;
  }
}

function tick() {
  if (state.simulacion) {
    const ruido = Math.round((Math.random() - 0.5) * 6);
    empujar(Math.max(40, state.bpmSimulado + ruido), { estado: "Conectado" });
  }
  void leerSensor();
}

function iniciar() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;
  const sim = window.localStorage.getItem(CLAVE_SIMULACION) === "1";
  const n = Number(window.localStorage.getItem(CLAVE_BPM_SIMULADO));
  set({
    simulacion: sim,
    bpmSimulado: Number.isFinite(n) && n > 0 ? n : 72,
    estado: sim ? "Conectado" : "Buscando dispositivo",
  });
  tick();
  window.setInterval(tick, INTERVALO);
}

function suscribir(o: () => void) {
  iniciar();
  oyentes.add(o);
  return () => oyentes.delete(o);
}

export function activarSimulacion(v: boolean) {
  window.localStorage.setItem(CLAVE_SIMULACION, v ? "1" : "0");
  fallos = 0;
  set({
    simulacion: v,
    estado: v ? "Conectado" : "Buscando dispositivo",
    muestras: [],
  });
  if (v) empujar(state.bpmSimulado);
}

export function setBpmSimulado(valor: number) {
  window.localStorage.setItem(CLAVE_BPM_SIMULADO, String(valor));
  set({ bpmSimulado: valor });
}

export function useDispositivo() {
  const s = useSyncExternalStore(
    suscribir,
    () => state,
    () => INICIAL,
  );
  return {
    ...s,
    activarSimulacion,
    setBpmSimulado,
    alertaActiva: s.bpm >= UMBRAL_BPM,
    enVivo: s.estado === "Transmitiendo Live",
  };
}

export function IndicadorDispositivo({
  estado,
  ultimaTrama,
  compacto = false,
}: {
  estado: EstadoDispositivo;
  ultimaTrama?: string;
  compacto?: boolean;
}) {
  const tono =
    estado === "Transmitiendo Live"
      ? "bg-ok/10 text-ok ring-ok/25"
      : estado === "Conectado"
        ? "bg-brand/10 text-brand ring-brand/25"
        : estado === "Buscando dispositivo"
          ? "bg-warn/10 text-warn ring-warn/25"
          : "bg-destructive/10 text-destructive ring-destructive/20";
  const punto =
    estado === "Transmitiendo Live"
      ? "bg-ok rv-pulse"
      : estado === "Conectado"
        ? "bg-brand"
        : estado === "Buscando dispositivo"
          ? "bg-warn rv-pulse"
          : "bg-destructive";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ${tono}`}
      title={ultimaTrama ? `Última trama ${ultimaTrama}` : "Sin tramas recibidas"}
    >
      <span className={`size-1.5 rounded-full ${punto}`} />
      {compacto
        ? estado.replace("Transmitiendo ", "")
        : estado === "Conectado"
          ? "Simulación activa"
          : `ESP32 · ${estado}`}
      {!compacto && ultimaTrama && <span className="text-ink/45">· {ultimaTrama}</span>}
    </span>
  );
}
