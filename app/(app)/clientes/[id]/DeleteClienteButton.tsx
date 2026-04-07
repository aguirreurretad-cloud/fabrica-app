"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function DeleteClienteButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createClient() as any;
  const [confirm, setConfirm] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function handleEliminar() {
    setBorrando(true);
    // Desligar pedidos y presupuestos que referencian este cliente
    await supabase.from("pedidos").update({ cliente_id: null }).eq("cliente_id", id);
    await supabase.from("presupuestos").update({ cliente_id: null }).eq("cliente_id", id);
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) {
      alert("No se pudo eliminar el cliente.");
      setBorrando(false);
      setConfirm(false);
      return;
    }
    router.push("/clientes");
    router.refresh();
  }

  if (confirm) {
    return (
      <div style={{ display: "flex", gap: "6px" }}>
        <Button variant="danger" size="sm" loading={borrando} onClick={handleEliminar}>Confirmar</Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancelar</Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => setConfirm(true)}>Eliminar</Button>
  );
}
