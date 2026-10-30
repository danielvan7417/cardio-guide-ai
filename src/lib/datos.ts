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
        createdAt: m.created_at,
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

  const eliminar = async (id: string) => {
    if (!userId) throw new Error("Inicia sesión para borrar una medición.");
    const { data, error } = await supabase
      .from("mediciones")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw error;
    if (!data) throw new Error("No se pudo borrar la medición.");
    setLista((actual) => actual.filter((medicion) => medicion.id !== id));
  };

  return { lista, cargando, agregar, eliminar };
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
        createdAt: s.created_at,
      })),
    );
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agregar = async (r: Omit<RegistroSintoma, "id" | "fecha" | "createdAt">) => {
    if (!userId) return;
    const { error } = await supabase.from("sintomas").insert({ ...r, user_id: userId });
    if (error) throw error;
    await cargar();
  };

  const eliminar = async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from("sintomas").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    setLista((actual) => actual.filter((registro) => registro.id !== id));
  };

  const eliminarTodas = async () => {
    if (!userId) return;
    const { error } = await supabase.from("sintomas").delete().eq("user_id", userId);
    if (error) throw error;
    setLista([]);
  };

  return { lista, agregar, eliminar, eliminarTodas };
}
