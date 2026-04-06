"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Textarea, FormRow, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

interface Cliente { id: string; nombre: string; }

export default function NuevoPedidoPage() {
  const router = useRouter();
  const supabase = createClient() as any;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [form, setForm] = useState({
    cliente_id: "", total: "", fecha_entrega: "", notas: "",
  });

  useEffect(() => {
    (supabase as any).from("clientes").select("id, nombre").order("nombre")
      .then(({ data }: { data: any }) => setClientes(data ?? []));
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) { setError("Seleccioná un cliente."); return; }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { data: pedido, error: pedidoError } = await (supabase as any).from("pedidos").insert({
      cliente_id: form.cliente_id,
      estado: "recibido",
      total: parseFloat(form.total) || 0,
      fecha_entrega: form.fecha_entrega || null,
      notas: form.notas || null,
      created_by: user!.id,
    }).select().single();

    if (pedidoError || !pedido) {
      setError("Error al guardar. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    router.push(`/pedidos/${pedido.id}`);
    router.refresh();
  }

  return (
    <div className="page-container" style={{ maxWidth: "600px" }}>
      <PageHeader
        title="Nuevo pedido"
        subtitle="Creá un pedido de producción"
        action={
          <Link href="/pedidos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>
            ← Volver
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <Select label="Cliente *" value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}>
            <option value="">— Elegí un cliente —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>

          <FormRow>
            <Input
              label="Total ($)"
              type="number"
              value={form.total}
              onChange={(e) => set("total", e.target.value)}
              placeholder="0"
            />
            <Input
              label="Fecha de entrega"
              type="date"
              value={form.fecha_entrega}
              onChange={(e) => set("fecha_entrega", e.target.value)}
            />
          </FormRow>

          <Textarea
            label="Notas"
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            placeholder="Descripción del pedido, detalles, etc."
          />

          {error && (
            <div style={{
              background: "var(--danger-bg)", border: "1px solid #fecaca",
              borderRadius: "var(--radius)", padding: "10px 12px",
              fontSize: "13px", color: "var(--danger)",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <Link href="/pedidos"><Button variant="secondary" type="button">Cancelar</Button></Link>
            <Button variant="primary" type="submit" loading={loading}>Crear pedido</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
