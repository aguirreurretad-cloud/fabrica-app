"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export function DeleteProductoButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createClient() as any;
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await (supabase as any).from("productos").update({ activo: false }).eq("id", id);
    router.push("/productos");
    router.refresh();
  }

  if (confirmando) {
    return (
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: "var(--text-2)" }}>¿Confirmar?</span>
        <Button variant="danger" size="sm" loading={loading} onClick={handleDelete}>Sí, eliminar</Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirmando(false)}>No</Button>
      </div>
    );
  }

  return (
    <Button variant="danger" onClick={() => setConfirmando(true)}>Eliminar</Button>
  );
}
