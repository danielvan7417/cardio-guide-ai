import { useCallback, useEffect, useRef, useState } from "react";
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

const MAX_MUESTRAS = 48;
const CLAVE_SIMULACION = "ritmovital:simulacion";
const CLAVE_BPM_SIMULADO = "ritmovital:bpm-simulado";

function leerNumero(clave: string, valorInicial: number) {
  if (typeof window === "undefined") return valorInicial;
  const valor = Number(window.localStorage.getItem(clave));
  return Number.isFinite(valor) ? valor : valorInicial;
}

export function useDispositivo() {
  const [estado, setEstado] = useState<EstadoDispositivo>("Buscando dispositivo");
  const [bpm, setBpm] = useState(72);
  const [muestras, setMuestras] = useState<number[]>([]);
  const [ultimaTrama, setUltimaTrama] = useState<string>("");
  const [simulacion, setSimulacion] = useState(false);
  const [bpmSimulado, setBpmSimuladoState] = useState(72);
  const fallos = useRef(0);

  useEffect(() => {
    setSimulacion(window.localStorage.getItem(CLAVE_SIMULACION) === "1");
    setBpmSimuladoState(leerNumero(CLAVE_BPM_SIMULADO, 72));
    const sincronizar = () => {
      setSimulacion(window.localStorage.getItem(CLAVE_SIMULACION) === "1");
      setBpmSimuladoState(leerNumero(CLAVE_BPM_SIMULADO, 72));
    };
    window.addEventListener("ritmovital:simulacion", sincronizar);
    return () => window.removeEventListener("ritmovital:simulacion", sincronizar);
  }, []);

  const empujar = useCallback((valor: number) => {
    setBpm(valor);
    setMuestras((prev) => [...prev, valor].slice(-MAX_MUESTRAS));
  }, []);

  // Modo hardware: lectura periódica de tramas del ESP32.
  useEffect(() => {
    if (simulacion) return;
    let vivo = true;

    const leer = async () => {
      try {
        const res = await fetch(SENSOR_URL, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        const trama = (await res.json()) as TramaSensor;
        if (!vivo || typeof trama.bpm !== "number") return;
        fallos.current = 0;
        empujar(Math.round(trama.bpm));
        setUltimaTrama(new Date().toLocaleTimeString("es-CO"));
        setEstado("Transmitiendo Live");
      } catch {
        if (!vivo) return;
        fallos.current += 1;
        setEstado(fallos.current >= 3 ? "Desconectado" : "Buscando dispositivo");
      }
    };

    void leer();
    const id = setInterval(leer, 1500);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [simulacion, empujar]);

  // Modo simulación avanzada (pruebas sin hardware).
  useEffect(() => {
    if (!simulacion) return;
    setEstado("Conectado");
    const id = setInterval(() => {
      const ruido = Math.round((Math.random() - 0.5) * 4);
      empujar(Math.max(40, bpmSimulado + ruido));
      setUltimaTrama(new Date().toLocaleTimeString("es-CO"));
    }, 1200);
    empujar(bpmSimulado);
    return () => clearInterval(id);
  }, [simulacion, bpmSimulado, empujar]);

  return {
    estado,
    bpm,
    muestras,
    ultimaTrama,
    simulacion,
    activarSimulacion: (v: boolean) => {
      fallos.current = 0;
      window.localStorage.setItem(CLAVE_SIMULACION, v ? "1" : "0");
      setSimulacion(v);
      setEstado(v ? "Conectado" : "Buscando dispositivo");
      window.dispatchEvent(new Event("ritmovital:simulacion"));
    },
    bpmSimulado,
    setBpmSimulado: (valor: number) => {
      window.localStorage.setItem(CLAVE_BPM_SIMULADO, String(valor));
      setBpmSimuladoState(valor);
    },
    alertaActiva: bpm >= UMBRAL_BPM,
    enVivo: estado === "Transmitiendo Live",
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
      {compacto ? estado.replace("Transmitiendo ", "") : `ESP32 · ${estado}`}
      {!compacto && ultimaTrama && (
        <span className="text-ink/45">· {ultimaTrama}</span>
      )}
    </span>
  );
}
