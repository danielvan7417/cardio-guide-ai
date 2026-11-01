import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UMBRAL_BPM_POR_DEFECTO } from "@/lib/ritmo";

export type Sesion = {
  id: string;
  nombre: string;
  correo: string;
  edad: number;
  tipoSangre: string;
  peso: number;
  estatura: number;
  consentimiento: boolean;
  fcReposo: number;
  umbralAlertaBpm: number;
};

const EVENTO = "ritmovital:sesion";

export async function leerSesion(): Promise<Sesion | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
  return {
    id: u.user.id,
    nombre: data?.nombre || u.user.email?.split("@")[0] || "Usuario",
    correo: data?.correo || u.user.email || "",
    edad: data?.edad ?? 0,
    tipoSangre: data?.tipo_sangre ?? "",
    peso: Number(data?.peso ?? 0),
    estatura: Number(data?.estatura ?? 0),
    consentimiento: data?.consentimiento ?? false,
    fcReposo: data?.fc_reposo ?? 0,
    umbralAlertaBpm: data?.umbral_alerta_bpm ?? UMBRAL_BPM_POR_DEFECTO,
  };
}

export async function guardarSesion(s: Sesion) {
  const { error } = await supabase.from("profiles").upsert({
    id: s.id,
    nombre: s.nombre,
    correo: s.correo,
    edad: s.edad,
    tipo_sangre: s.tipoSangre,
    peso: s.peso,
    estatura: s.estatura,
    consentimiento: s.consentimiento,
    fc_reposo: s.fcReposo,
    umbral_alerta_bpm: s.umbralAlertaBpm,
  });
  if (error) throw error;
  window.dispatchEvent(new Event(EVENTO));
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

export function imcDe(s: Pick<Sesion, "peso" | "estatura">) {
  if (!s.estatura) return 0;
  return Number((s.peso / (s.estatura * s.estatura)).toFixed(1));
}

/** Sesión real (Lovable Cloud) con protección de ruta en cliente. */
export function useSesion(protegida = true) {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [listo, setListo] = useState(false);

  const refrescar = useCallback(async () => {
    setSesion(await leerSesion());
    setListo(true);
  }, []);

  useEffect(() => {
    refrescar();
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_IN" || evento === "SIGNED_OUT" || evento === "USER_UPDATED")
        refrescar();
    });
    const h = () => refrescar();
    window.addEventListener(EVENTO, h);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener(EVENTO, h);
    };
  }, [refrescar]);

  useEffect(() => {
    if (listo && protegida && !sesion) navigate({ to: "/", replace: true });
  }, [listo, protegida, sesion, navigate]);

  return { sesion, listo };
}
