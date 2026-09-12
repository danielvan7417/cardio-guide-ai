import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

const KEY = "ritmovital:sesion";

export type Sesion = {
  nombre: string;
  correo: string;
  edad: number;
  tipoSangre: string;
  peso: number;
  estatura: number;
  consentimiento: boolean;
};

export const sesionInicial: Sesion = {
  nombre: "Andrés M. R.",
  correo: "andres@ritmovital.co",
  edad: 34,
  tipoSangre: "O+",
  peso: 78,
  estatura: 1.72,
  consentimiento: true,
};

export function leerSesion(): Sesion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(s: Sesion) {
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("ritmovital:sesion"));
}

export function cerrarSesion() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("ritmovital:sesion"));
}

export function imcDe(s: Sesion) {
  return Number((s.peso / (s.estatura * s.estatura)).toFixed(1));
}

/** Sesión con protección de ruta en cliente. */
export function useSesion(protegida = true) {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [listo, setListo] = useState(false);

  const refrescar = useCallback(() => setSesion(leerSesion()), []);

  useEffect(() => {
    refrescar();
    setListo(true);
    window.addEventListener("ritmovital:sesion", refrescar);
    return () => window.removeEventListener("ritmovital:sesion", refrescar);
  }, [refrescar]);

  useEffect(() => {
    if (listo && protegida && !sesion) navigate({ to: "/", replace: true });
  }, [listo, protegida, sesion, navigate]);

  return { sesion, listo };
}
