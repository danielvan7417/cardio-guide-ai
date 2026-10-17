import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { estadoDe, type Medicion, type RegistroSintoma } from "@/lib/ritmo";

type Contexto = Medicion["contexto"];

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

export function useMediciones(userId?: string) {
  const [lista, setLista] = useState<Medicion[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("mediciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLista(
      (data ?? []).map((m) => ({
        id: m.id,
        titulo: m.titulo,
        fecha: fecha(m.created_at),
        bpm: m.bpm,
        contexto: m.contexto as Contexto,
        estado: estadoDe(m.bpm),
      })),
    );
    setCargando(false);
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agregar = async (m: { titulo: string; bpm: number; contexto: Contexto; origen?: string }) => {
    if (!userId) return;
    const { error } = await supabase.from("mediciones").insert({ ...m, user_id: userId });
    if (error) throw error;
    await cargar();
  };

  return { lista, cargando, agregar };
}

export function useSintomas(userId?: string) {
  const [lista, setLista] = useState<RegistroSintoma[]>([]);

  const cargar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("sintomas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLista(
      (data ?? []).map((s) => ({
        id: s.id,
        fecha: fecha(s.created_at),
        bpm: s.bpm,
        contexto: s.contexto as Contexto,
        sintomas: s.sintomas,
        nota: s.nota || "Sin notas adicionales.",
      })),
    );
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agregar = async (r: Omit<RegistroSintoma, "id" | "fecha">) => {
    if (!userId) return;
    const { error } = await supabase.from("sintomas").insert({ ...r, user_id: userId });
    if (error) throw error;
    await cargar();
  };

  return { lista, agregar };
}
