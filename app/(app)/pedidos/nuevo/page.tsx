"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Textarea, FormRow, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

interface Cliente { id: string; nombre: string; }
interface Presupuesto { id: string; numero: number; total: number; clientes: { nombre: string } | null; }

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function NuevoPedidoPage() {
  const router = useRouter();
  const supabase = createClient() as any;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);

  const [presupuestoId, setPresupuestoId] = useState("");
  const [form, setForm] = useState({
    cliente_id: "", total: "", costo_total: "", fecha_entrega: "", notas: "",
  });
  const [facturado, setFacturado] = useState(false);

  useEffect(() => {
    supabase.from("clientes").select("id, nombre").order("nombre")
      .then(({ data }: any) => setClientes(data ?? []));
    supabase.from("presupuestos")
      .select("id, numero, total, clientes(nombre)")
      .eq("estado", "aprobado")
      .order("numero", { ascending: false })
      .then(({ data }: any) => setPresupuestos(data ?? []));
  }, []);

  // Al seleccionar presupuesto, auto-rellenar cliente y total
  async function handlePresupuesto(pid: string) {
    setPresupuestoId(pid);
    if (!pid) return;

    const presup = presupuestos.find((p) => p.id === pid);
    if (!presup) return;

    // Cargar items con precio_costo de cada producto
    const { data: items } = await supabase
      .from("presupuesto_items")
      .select("cantidad, precio_unitario, productos(precio_costo)")
      .eq("presupuesto_id", pid);

    const costoCalculado = (items ?? []).reduce((s: number, it: any) => {
      const costo = it.productos?.precio_costo ?? 0;
      return s + it.cantidad * costo;
    }, 0);

    // Buscar cliente_id desde el presupuesto
    const { data: presupData } = await supabase
      .from("presupuestos")
      .select("cliente_id")
      .eq("id", pid)
      .single();

    setForm((f) => ({
      ...f,
      total: String(presup.total),
      costo_total: costoCalculado > 0 ? String(Math.round(costoCalculado)) : f.costo_total,
      cliente_id: presupData?.cliente_id ?? f.cliente_id,
    }));
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Calcular ganancia en tiempo real
  const venta = parseFloat(form.total) || 0;
  const costoBase = parseFloat(form.costo_total) || 0;
  const costoFactura = facturado ? costoBase * 0.04 : 0;
  const costoTotal = costoBase + costoFactura;
  const ganancia = venta - costoTotal;
  const margen = venta > 0 ? (ganancia / venta) * 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) { setError("Seleccioná un cliente."); return; }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { data: pedido, error: pedidoError } = await supabase.from("pedidos").insert({
      cliente_id: form.cliente_id,
      presupuesto_id: presupuestoId || null,
      estado: "recibido",
      total: venta,
      costo_total: costoBase,
      facturado,
      fecha_entrega: form.fecha_entrega || null,
      notas: form.notas || null,
      created_by: user!.id,
    }).select().single();

    if (pedidoError || !pedido) {
      setError("Error al guardar. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    // Si hay presupuesto, copiar items al pedido
    if (presupuestoId) {
      const { data: presupItems } = await supabase
        .from("presupuesto_items")
        .select("*")
        .eq("presupuesto_id", presupuestoId);

      if (presupItems?.length > 0) {
        await supabase.from("pedido_items").insert(
          presupItems.map((it: any) => ({
            pedido_id: pedido.id,
            producto_id: it.producto_id,
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
            subtotal: it.subtotal,
          }))
        );
      }
    }

    router.push(`/pedidos/${pedido.id}`);
    router.refresh();
  }

  return (
    <div className="page-container" style={{ maxWidth: "640px" }}>
      <PageHeader
        title="Nuevo pedido"
        action={<Link href="/pedidos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>}
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Presupuesto opcional */}
          <div>
            <Select
              label="Basar en presupuesto aprobado (opcional)"
              value={presupuestoId}
              onChange={(e) => handlePresupuesto(e.target.value)}
            >
              <option value="">— Sin presupuesto —</option>
              {presupuestos.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.numero} · {(p.clientes as any)?.nombre ?? "Sin cliente"} · {pesos(p.total)}
                </option>
              ))}
            </Select>
            {presupuestoId && (
              <div style={{ fontSize: "11px", color: "var(--brand)", marginTop: "4px" }}>
                ✓ Cliente, total y costo calculados desde el presupuesto
              </div>
            )}
          </div>

          <Select label="Cliente *" value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}>
            <option value="">— Elegí un cliente —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>

          <FormRow>
            <Input label="Total de venta ($)" type="number" value={form.total}
              onChange={(e) => set("total", e.target.value)} placeholder="0" />
            <Input label="Fecha de entrega" type="date" value={form.fecha_entrega}
              onChange={(e) => set("fecha_entrega", e.target.value)} />
          </FormRow>

          <FormRow>
            <Input label="Costo total ($)" type="number" value={form.costo_total}
              onChange={(e) => set("costo_total", e.target.value)} placeholder="0" />
            <div />
          </FormRow>

          {/* Facturado */}
          <div
            onClick={() => setFacturado((f) => !f)}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: facturado ? "var(--brand-light)" : "var(--surface-2)", border: `1px solid ${facturado ? "var(--brand)" : "var(--border)"}`, borderRadius: "var(--radius)", cursor: "pointer", userSelect: "none" }}
          >
            <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: `2px solid ${facturado ? "var(--brand)" : "var(--border)"}`, background: facturado ? "var(--brand)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: "11px" }}>
              {facturado ? "✓" : ""}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Facturado</div>
              <div style={{ fontSize: "11px", color: "var(--text-3)" }}>Suma 4% al costo por facturación</div>
            </div>
            {facturado && costoBase > 0 && (
              <div style={{ marginLeft: "auto", fontSize: "12px", color: "var(--brand)", fontWeight: 500 }}>
                +{pesos(costoFactura)}
              </div>
            )}
          </div>

          {/* Resumen ganancia */}
          {(venta > 0 || costoBase > 0) && (
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Proyección</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Venta", value: pesos(venta), color: "var(--text)" },
                  { label: `Costo${facturado ? " (+4%)" : ""}`, value: pesos(costoTotal), color: "var(--text)" },
                  { label: "Ganancia", value: pesos(ganancia), color: ganancia >= 0 ? "#16a34a" : "var(--danger)" },
                ].map((r) => (
                  <div key={r.label}>
                    <div style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "3px" }}>{r.label}</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: r.color }}>{r.value}</div>
                  </div>
                ))}
              </div>
              {venta > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: ganancia >= 0 ? "#16a34a" : "var(--danger)", fontWeight: 500 }}>
                  Margen: {margen.toFixed(1)}%
                </div>
              )}
            </div>
          )}

          <Textarea label="Notas" value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Descripción, detalles, etc." />

          {error && (
            <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: "13px", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Link href="/pedidos"><Button variant="secondary" type="button">Cancelar</Button></Link>
            <Button variant="primary" type="submit" loading={loading}>Crear pedido</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
