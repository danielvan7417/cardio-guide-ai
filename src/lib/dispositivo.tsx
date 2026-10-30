import { useSyncExternalStore } from "react";
import { UMBRAL_BPM } from "@/lib/ritmo";
import { bluetoothDisponible, leerPulsoBLE, SERVICIO_PULSO, CARACTERISTICA_PULSO, type DispositivoBLE, type CaracteristicaBLE } from "@/lib/bluetooth";

export type EstadoDispositivo =
  | "Buscando dispositivo"
  | "Conectado"
  | "Transmitiendo Live"
  | "Desconectado";

/** Endpoint donde el ESP32 publica sus tramas y desde donde la interfaz las lee. */
export const SENSOR_URL = "http://127.0.0.1:5000/api/sensor";

export type TramaSensor = {
  bpm: number;
  spo2?: number;
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
  /** Última oxigenación (SpO₂ %) enviada por el ESP32, si el sensor la reporta. */
  spo2Esp32: number | null;
  fuente: "wifi" | "ble" | null;
  bleConectado: boolean;
  vinculandoBLE: boolean;
  errorBLE: string;
  sincronizacionBLE: "inactiva" | "enviando" | "sincronizada" | "error";
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
  spo2Esp32: null,
  fuente: null,
  bleConectado: false,
  vinculandoBLE: false,
  errorBLE: "",
  sincronizacionBLE: "inactiva",
};

/* Store global: vive mientras la app está abierta, así el modo simulación
   y la traza no se reinician al cambiar de página. */
let state: EstadoStore = INICIAL;
const oyentes = new Set<() => void>();
let iniciado = false;
let fallos = 0;
let leyendo = false;
let dispositivoBLE: DispositivoBLE | null = null;
let caracteristicaBLE: CaracteristicaBLE | null = null;
let ultimaLecturaBLE = 0;
let enviandoBLE = false;
let generacionBLE = 0;

async function enviarLecturaBLE(bpm: number) {
  if (enviandoBLE) return;
  enviandoBLE = true;
  const generacion = generacionBLE;
  set({ sincronizacionBLE: "enviando" });
  try {
    const res = await fetch(SENSOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bpm, dispositivo: "ESP32-BLE", alerta_activa: bpm >= UMBRAL_BPM, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error("No se pudo sincronizar");
    if (generacion === generacionBLE) set({ sincronizacionBLE: "sincronizada" });
  } catch {
    if (generacion === generacionBLE) set({ sincronizacionBLE: "error" });
  } finally {
    enviandoBLE = false;
  }
}

function recibirBLE() {
  const value = caracteristicaBLE?.value;
  if (!value) return;
  const bpm = leerPulsoBLE(value);
  if (bpm === null) {
    set({ bpmEsp32: null, ...(state.simulacion ? {} : { estado: "Conectado" as const }) });
    return;
  }
  ultimaLecturaBLE = Date.now();
  if (state.simulacion) set({ bpmEsp32: bpm });
  else empujar(bpm, { estado: "Transmitiendo Live", bpmEsp32: bpm });
  void enviarLecturaBLE(bpm);
}

function limpiarBLE() {
  generacionBLE += 1;
  const device = dispositivoBLE;
  const characteristic = caracteristicaBLE;
  dispositivoBLE = null;
  caracteristicaBLE = null;
  characteristic?.removeEventListener("characteristicvaluechanged", recibirBLE);
  if (device?.gatt?.connected) void characteristic?.stopNotifications().catch(() => {});
  device?.removeEventListener("gattserverdisconnected", desconectarBLE);
  device?.gatt?.disconnect();
  ultimaLecturaBLE = 0;
}

export function desconectarBLE() {
  limpiarBLE();
  fallos = 0;
  set({ bleConectado: false, vinculandoBLE: false, fuente: null, bpmEsp32: null, spo2Esp32: null,
    sincronizacionBLE: "inactiva", ...(state.simulacion ? {} : { estado: "Desconectado" }) });
}

export async function conectarBLE() {
  if (state.vinculandoBLE || state.bleConectado) return;
  const api = bluetoothDisponible();
  if (!api) {
    set({ errorBLE: "Bluetooth requiere Chrome o Edge compatible y una conexión HTTPS (o localhost). No está disponible en este navegador." });
    return;
  }
  set({ vinculandoBLE: true, errorBLE: "" });
  try {
    const device = await api.requestDevice({ filters: [{ services: [SERVICIO_PULSO] }] });
    dispositivoBLE = device;
    device.addEventListener("gattserverdisconnected", desconectarBLE);
    const server = await device.gatt?.connect();
    if (!server) throw new Error("Sin servicio GATT");
    const service = await server.getPrimaryService(SERVICIO_PULSO);
    caracteristicaBLE = await service.getCharacteristic(CARACTERISTICA_PULSO);
    caracteristicaBLE.addEventListener("characteristicvaluechanged", recibirBLE);
    // Own the source before enabling notifications, including notifications emitted immediately.
    set({ bleConectado: true, fuente: "ble", bpmEsp32: null, spo2Esp32: null,
      sincronizacionBLE: "inactiva", ...(state.simulacion ? {} : { estado: "Conectado", muestras: [] }) });
    ultimaLecturaBLE = Date.now();
    await caracteristicaBLE.startNotifications();
  } catch (error) {
    const cancelado = error instanceof Error && error.name === "NotFoundError";
    desconectarBLE();
    set({ errorBLE: cancelado ? "" : "No se pudo vincular el ESP32. Comprueba que anuncie el servicio de frecuencia cardíaca y no esté conectado a otro dispositivo." });
  } finally {
    set({ vinculandoBLE: false });
  }
}

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
  if (leyendo || state.bleConectado) return;
  leyendo = true;
  try {
    const res = await fetch(SENSOR_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    const trama = (await res.json()) as TramaSensor;
    if (state.bleConectado) return;
    if (typeof trama.bpm !== "number" || !Number.isFinite(trama.bpm) || trama.bpm <= 0) throw new Error("trama inválida");
    fallos = 0;
    const v = Math.round(trama.bpm);
    set({ fuente: "wifi", spo2Esp32: typeof trama.spo2 === "number" && Number.isFinite(trama.spo2) ? Math.round(trama.spo2) : null });
    if (state.simulacion) set({ bpmEsp32: v });
    else empujar(v, { estado: "Transmitiendo Live", bpmEsp32: v });
  } catch {
    if (state.bleConectado) return;
    fallos += 1;
    const perdido = fallos >= 3;
    set({
      bpmEsp32: perdido ? null : state.bpmEsp32,
      spo2Esp32: perdido ? null : state.spo2Esp32,
      fuente: perdido ? null : state.fuente,
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
  if (state.bleConectado && Date.now() - ultimaLecturaBLE > 6000) {
    set({ bpmEsp32: null, ...(state.simulacion ? {} : { estado: "Conectado" as const }) });
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
    estado: v ? "Conectado" : state.bpmEsp32 !== null ? "Transmitiendo Live" : state.bleConectado ? "Conectado" : "Buscando dispositivo",
    muestras: [],
  });
  if (v) empujar(state.bpmSimulado);
  else if (state.bpmEsp32 !== null) empujar(state.bpmEsp32);
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
    conectarBLE,
    desconectarBLE,
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
  const { simulacion } = useDispositivo();
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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.75rem] font-medium ring-1 ${tono}`}
      title={ultimaTrama ? `Última trama ${ultimaTrama}` : "Sin tramas recibidas"}
    >
      <span className={`size-1.5 rounded-full ${punto}`} />
      {compacto
        ? estado.replace("Transmitiendo ", "")
        : estado === "Conectado"
          ? simulacion ? "Simulación activa" : "ESP32 · Conectado · esperando pulso"
          : `ESP32 · ${estado}`}
      {!compacto && ultimaTrama && <span className="text-ink/45">· {ultimaTrama}</span>}
    </span>
  );
}
