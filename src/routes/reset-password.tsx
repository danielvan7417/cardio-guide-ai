import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — RitmoVital" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta de RitmoVital." },
      { property: "og:title", content: "Restablecer contraseña — RitmoVital" },
      { property: "og:description", content: "Recuperación segura de acceso a RitmoVital." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clave.length < 6) return setMsg("La contraseña debe tener al menos 6 caracteres.");
    const { error } = await supabase.auth.updateUser({ password: clave });
    if (error) return setMsg(error.message);
    navigate({ to: "/inicio", replace: true });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-surface p-6">
      <form onSubmit={enviar} className="glass flex w-full max-w-md flex-col gap-4 rounded-[20px] p-8 ring-1 ring-ink/5">
        <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="••••••••"
          className="rounded-xl bg-panel/70 px-4 py-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
        />
        {msg && <p className="text-[0.8125rem] text-destructive">{msg}</p>}
        <button className="rounded-xl bg-brand px-4 py-3 text-sm font-medium text-brand-foreground">
          Guardar contraseña
        </button>
      </form>
    </div>
  );
}
