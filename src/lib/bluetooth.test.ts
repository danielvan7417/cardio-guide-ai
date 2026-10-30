import { describe, expect, it } from "vitest";
import { leerPulsoBLE } from "./bluetooth";

const trama = (...bytes: number[]) => new DataView(Uint8Array.from(bytes).buffer);
describe("Lecturas estándar de frecuencia cardíaca BLE", () => {
  it("lee BPM de 8 bits", () => expect(leerPulsoBLE(trama(0, 75))).toBe(75));
  it("lee BPM de 16 bits en little endian", () => expect(leerPulsoBLE(trama(1, 44, 1))).toBe(300));
  it("rechaza paquetes truncados", () => {
    expect(leerPulsoBLE(trama())).toBeNull();
    expect(leerPulsoBLE(trama(0))).toBeNull();
    expect(leerPulsoBLE(trama(1, 80))).toBeNull();
  });
  it("no inventa pulso cuando no hay contacto", () => {
    expect(leerPulsoBLE(trama(4, 75))).toBeNull();
    expect(leerPulsoBLE(trama(6, 75))).toBe(75);
    expect(leerPulsoBLE(trama(0, 0))).toBeNull();
  });
});