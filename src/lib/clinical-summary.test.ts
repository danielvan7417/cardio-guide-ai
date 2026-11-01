import { describe, expect, it } from "vitest";
import { fragmentoPulsoCSV, resumenClinico, tasaRecepcion } from "./clinical-summary";
import type { Medicion } from "./ritmo";

const lectura = (bpm: number, createdAt: string): Medicion => ({ id: createdAt, titulo: "Toma", fecha: "", bpm, createdAt, contexto: "Reposo", estado: "Normal" });
describe("Resumen del paciente", () => {
  it("calcula el promedio de siete días con lecturas reales, no con ejemplos ni fechas futuras", () => {
    const summary = resumenClinico([
      lectura(60, "2026-10-26T13:00:00Z"), lectura(80, "2026-11-01T14:00:00Z"),
      lectura(200, "2026-10-25T13:00:00Z"), lectura(200, "2026-11-02T13:00:00Z"),
    ], new Date("2026-11-01T17:00:00Z"));
    expect(summary.promedio).toBe(70);
    expect(summary.cantidad).toBe(2);
    expect(summary.dias.map((d) => d.bpm)).toEqual([60, null, null, null, null, null, 80]);
  });
  it("muestra picos recientes usando el umbral existente de 120 BPM", () => {
    const summary = resumenClinico([lectura(119, "2026-11-01T13:00:00Z"), lectura(120, "2026-11-01T14:00:00Z")], new Date("2026-11-01T17:00:00Z"));
    expect(summary.alertas.map((a) => a.bpm)).toEqual([120]);
  });
  it("no inventa promedios sin datos", () => {
    expect(resumenClinico([]).promedio).toBeNull();
  });
});
describe("Diagnóstico de recepción y exportación", () => {
  it("calcula Hz de recepción sin confundirlo con muestreo ECG", () => {
    expect(tasaRecepcion([0, 1200, 2400])).toBeCloseTo(0.833333);
    expect(tasaRecepcion([1200])).toBeNull();
  });
  it("exporta BPM con fuente y tiempo, sin inventar voltajes ECG", () => {
    expect(fragmentoPulsoCSV([72, 90], [0, 1200], "simulacion")).toBe("tipo,fuente,timestamp,bpm\npulso_bpm_no_ecg,simulacion,1970-01-01T00:00:00.000Z,72\npulso_bpm_no_ecg,simulacion,1970-01-01T00:00:01.200Z,90");
  });
});