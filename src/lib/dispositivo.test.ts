import { afterEach, describe, expect, it, vi } from "vitest";
import type { CaracteristicaBLE } from "./bluetooth";

vi.mock("react", () => ({ useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get() }));

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });

async function preparar() {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", { isSecureContext: true, localStorage: { setItem: (k: string, v: string) => storage.set(k, v) } });
  const characteristic = new EventTarget() as CaracteristicaBLE;
  characteristic.startNotifications = vi.fn().mockResolvedValue(characteristic);
  characteristic.stopNotifications = vi.fn().mockResolvedValue(characteristic);
  const getCharacteristic = vi.fn().mockResolvedValue(characteristic);
  const getPrimaryService = vi.fn().mockResolvedValue({ getCharacteristic });
  const device = Object.assign(new EventTarget(), { gatt: { connected: true, connect: vi.fn().mockResolvedValue({ getPrimaryService }), disconnect: vi.fn() } });
  const requestDevice = vi.fn().mockResolvedValue(device);
  vi.stubGlobal("navigator", { bluetooth: { requestDevice } });
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  const store = await import("./dispositivo");
  const emitir = (bpm: number) => {
    characteristic.value = new DataView(Uint8Array.from([0, bpm]).buffer);
    characteristic.dispatchEvent(new Event("characteristicvaluechanged"));
  };
  return { store, emitir, fetchMock, requestDevice, getPrimaryService, getCharacteristic, device };
}

describe("Conexión y sincronización ESP32 BLE", () => {
  it("vincula el servicio estándar y envía la lectura real a Flask", async () => {
    const t = await preparar();
    await t.store.conectarBLE();
    expect(t.requestDevice).toHaveBeenCalledWith({ filters: [{ services: ["heart_rate"] }] });
    expect(t.getPrimaryService).toHaveBeenCalledWith("heart_rate");
    expect(t.getCharacteristic).toHaveBeenCalledWith("heart_rate_measurement");
    t.emitir(135);
    expect(t.store.useDispositivo()).toMatchObject({ bpm: 135, bpmEsp32: 135, alertaActiva: true, fuente: "ble", enVivo: true });
    expect(t.fetchMock).toHaveBeenCalledWith("http://127.0.0.1:5000/api/sensor", expect.objectContaining({ method: "POST", body: expect.any(String) }));
    expect(JSON.parse(t.fetchMock.mock.calls[0][1].body)).toMatchObject({ bpm: 135, dispositivo: "ESP32-BLE", alerta_activa: true });
  });
  it("mantiene el pulso en vivo aunque Flask no responda", async () => {
    const t = await preparar();
    t.fetchMock.mockRejectedValue(new Error("offline"));
    await t.store.conectarBLE();
    t.emitir(80);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(t.store.useDispositivo()).toMatchObject({ bpm: 80, enVivo: true, sincronizacionBLE: "error" });
  });
  it("preserva simulación y no envía sus valores como datos reales", async () => {
    const t = await preparar();
    t.store.setBpmSimulado(95);
    t.store.activarSimulacion(true);
    await t.store.conectarBLE();
    t.emitir(70);
    expect(t.store.useDispositivo()).toMatchObject({ bpm: 95, bpmEsp32: 70, simulacion: true });
    expect(JSON.parse(t.fetchMock.mock.calls[0][1].body).bpm).toBe(70);
    t.store.activarSimulacion(false);
    expect(t.store.useDispositivo()).toMatchObject({ bpm: 70, enVivo: true });
  });
  it("limpia la señal y los listeners al perder el dispositivo", async () => {
    const t = await preparar();
    await t.store.conectarBLE();
    t.emitir(80);
    t.device.dispatchEvent(new Event("gattserverdisconnected"));
    expect(t.store.useDispositivo()).toMatchObject({ bleConectado: false, bpmEsp32: null, enVivo: false, sincronizacionBLE: "inactiva" });
    t.emitir(140);
    expect(t.store.useDispositivo().bpm).toBe(80);
  });
});