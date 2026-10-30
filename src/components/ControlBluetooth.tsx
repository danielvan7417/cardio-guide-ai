import { Bluetooth, BluetoothOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispositivo } from "@/lib/dispositivo";

export function ControlBluetooth() {
  const d = useDispositivo();
  return (
    <div className="flex max-w-full flex-col items-start gap-1">
      <Button type="button" variant="outline" disabled={d.vinculandoBLE}
        onClick={d.bleConectado ? d.desconectarBLE : d.conectarBLE}
        className="max-w-full whitespace-normal text-brand">
        {d.vinculandoBLE ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : d.bleConectado ? <BluetoothOff /> : <Bluetooth />}
        {d.vinculandoBLE ? "Vinculando…" : d.bleConectado ? "Desconectar Bluetooth" : "Vincular ESP32 (BLE)"}
      </Button>
      {d.errorBLE && <p role="alert" className="max-w-sm text-xs text-destructive">{d.errorBLE}</p>}
      {d.bleConectado && <p role="status" className="max-w-sm text-xs text-ink/60">
        {d.sincronizacionBLE === "error" ? "Pulso por Bluetooth activo; servidor local sin sincronizar." : d.sincronizacionBLE === "sincronizada" ? "Bluetooth · lectura enviada al servidor local" : d.sincronizacionBLE === "enviando" ? "Bluetooth · enviando lectura al servidor local…" : "Bluetooth · esperando lectura"}
      </p>}
    </div>
  );
}