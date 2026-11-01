export type Estado = "Normal" | "Elevado";

export const CONTEXTOS = [
  "Reposo",
  "Ejercicio",
  "Estrés",
  "Post-ejercicio",
  "Estimulantes",
  "Antes de dormir",
] as const;

export type Contexto = (typeof CONTEXTOS)[number];

export type Medicion = {
  id: string;
  titulo: string;
  fecha: string;
  bpm: number;
  contexto: Contexto;
  estado: Estado;
  createdAt?: string;
};

export type RegistroSintoma = {
  id: string;
  fecha: string;
  bpm: number;
  contexto: Contexto;
  sintomas: string[];
  nota: string;
  createdAt?: string;
};

export const UMBRAL_BPM_POR_DEFECTO = 120;

export const estadoDe = (bpm: number): Estado => (bpm >= 100 ? "Elevado" : "Normal");

export const mediciones: Medicion[] = [
  {
    id: "m1",
    titulo: "Ejercicio matutino",
    fecha: "Hoy · 07:24",
    bpm: 135,
    contexto: "Ejercicio",
    estado: "Elevado",
  },
  {
    id: "m2",
    titulo: "Reposo en cama",
    fecha: "Hoy · 06:10",
    bpm: 68,
    contexto: "Reposo",
    estado: "Normal",
  },
  {
    id: "m3",
    titulo: "Trabajo administrativo",
    fecha: "Ayer · 14:32",
    bpm: 81,
    contexto: "Estrés",
    estado: "Normal",
  },
  {
    id: "m4",
    titulo: "Subida de escaleras",
    fecha: "Ayer · 09:05",
    bpm: 128,
    contexto: "Ejercicio",
    estado: "Elevado",
  },
  {
    id: "m5",
    titulo: "Caminata ligera",
    fecha: "Lun · 18:40",
    bpm: 92,
    contexto: "Ejercicio",
    estado: "Normal",
  },
  {
    id: "m6",
    titulo: "Reposo nocturno",
    fecha: "Lun · 23:12",
    bpm: 61,
    contexto: "Reposo",
    estado: "Normal",
  },
];

export const tendencia = [
  { dia: "Lun", valor: 60, alto: false },
  { dia: "Mar", valor: 72, alto: false },
  { dia: "Mié", valor: 55, alto: false },
  { dia: "Jue", valor: 80, alto: false },
  { dia: "Vie", valor: 95, alto: true },
  { dia: "Sáb", valor: 58, alto: false },
  { dia: "Dom", valor: 66, alto: false },
];

export type ZonaEntrenamiento = {
  nombre: string;
  desde: number;
  hasta: number;
  porcentaje: string;
  descripcion: string;
};

export function zonasEntrenamiento(edad: number, reposo = 68): ZonaEntrenamiento[] {
  const fcMax = 220 - edad;
  const rango = fcMax - reposo;
  const z = (a: number, b: number) => ({
    desde: Math.round(reposo + rango * a),
    hasta: Math.round(reposo + rango * b),
  });
  return [
    {
      nombre: "Calentamiento",
      ...z(0.5, 0.6),
      porcentaje: "50–60%",
      descripcion: "Activación suave y recuperación",
    },
    {
      nombre: "Quema de grasa",
      ...z(0.6, 0.7),
      porcentaje: "60–70%",
      descripcion: "Uso predominante de grasa",
    },
    {
      nombre: "Cardio",
      ...z(0.7, 0.85),
      porcentaje: "70–85%",
      descripcion: "Mejora de capacidad aeróbica",
    },
    {
      nombre: "Pico",
      ...z(0.85, 1),
      porcentaje: "85–100%",
      descripcion: "Esfuerzo máximo, corta duración",
    },
  ];
}

export type RespuestaAsistente = {
  alerta_activa: boolean;
  bpm_registrado: number;
  respuesta_asistente: string;
};

export const API_URL = "http://127.0.0.1:5000/api/chat";

export async function consultarAsistente(payload: {
  imc: number;
  bpm: number;
  mensaje: string;
}): Promise<RespuestaAsistente> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return (await res.json()) as RespuestaAsistente;
}
