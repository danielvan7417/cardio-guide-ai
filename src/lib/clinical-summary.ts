import type { Medicion } from "./ritmo";
import { UMBRAL_BPM } from "./ritmo";

const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
}).format(date);

export function resumenClinico(mediciones: Medicion[], now = new Date()) {
  const today = new Date(`${dayKey(now)}T12:00:00-05:00`);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const recent = mediciones.filter((m) => {
    if (!m.createdAt || !Number.isFinite(m.bpm) || m.bpm <= 0) return false;
    const date = new Date(m.createdAt);
    return !Number.isNaN(date.getTime()) && date <= now && dayKey(date) >= dayKey(start);
  });
  const monday = new Date(today);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia, index) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    const readings = recent.filter((m) => m.createdAt && dayKey(new Date(m.createdAt)) === dayKey(date));
    return {
      dia, cantidad: readings.length,
      bpm: readings.length ? Math.round(readings.reduce((sum, m) => sum + m.bpm, 0) / readings.length) : null,
    };
  });
  return {
    promedio: recent.length ? Math.round(recent.reduce((sum, m) => sum + m.bpm, 0) / recent.length) : null,
    cantidad: recent.length,
    alertas: recent.filter((m) => m.bpm >= UMBRAL_BPM).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    dias,
  };
}

export function tasaRecepcion(tiempos: number[]) {
  if (tiempos.length < 2) return null;
  const last = tiempos.at(-1);
  const first = tiempos[0];
  if (last === undefined || first === undefined || last <= first) return null;
  return (tiempos.length - 1) * 1000 / (last - first);
}

export function fragmentoPulsoCSV(bpm: number[], tiempos: number[], fuente: string) {
  return ["tipo,fuente,timestamp,bpm", ...bpm.map((value, index) => {
    const timestamp = tiempos[index];
    return `pulso_bpm_no_ecg,${fuente},${timestamp === undefined ? "" : new Date(timestamp).toISOString()},${value}`;
  })].join("\n");
}