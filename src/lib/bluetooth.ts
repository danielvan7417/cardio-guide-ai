// Standard GATT Heart Rate service (0x180D), not an ECG or SpO₂ service.
export const SERVICIO_PULSO = "heart_rate";
export const CARACTERISTICA_PULSO = "heart_rate_measurement";

export function leerPulsoBLE(value: DataView): number | null {
  if (value.byteLength < 2) return null;
  const largo = (value.getUint8(0) & 1) === 1;
  if (largo && value.byteLength < 3) return null;
  // Sensor-contact supported but not detected: do not display a stale pulse.
  if ((value.getUint8(0) & 4) !== 0 && (value.getUint8(0) & 2) === 0) return null;
  const bpm = largo ? value.getUint16(1, true) : value.getUint8(1);
  return bpm > 0 ? bpm : null;
}

export interface CaracteristicaBLE extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<CaracteristicaBLE>;
  stopNotifications(): Promise<CaracteristicaBLE>;
}
export interface DispositivoBLE extends EventTarget {
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<{ getPrimaryService(uuid: string): Promise<{ getCharacteristic(uuid: string): Promise<CaracteristicaBLE> }> }>;
    disconnect(): void;
  };
}
export interface BluetoothAPI {
  requestDevice(options: { filters: { services: string[] }[] }): Promise<DispositivoBLE>;
}

export function bluetoothDisponible(): BluetoothAPI | null {
  if (typeof navigator === "undefined" || typeof window === "undefined" || !window.isSecureContext) return null;
  return (navigator as Navigator & { bluetooth?: BluetoothAPI }).bluetooth ?? null;
}