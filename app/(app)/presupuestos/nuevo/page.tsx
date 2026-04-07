"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Textarea, FormRow, Button, PageHeader, Divider } from "@/components/ui";
import Link from "next/link";

interface Cliente { id: string; nombre: string; cuit?: string; email?: string; direccion?: string; ciudad?: string; provincia?: string; }
interface Opcion { id: string; nombre: string; precio_extra: number; }
interface Producto {
  id: string; nombre: string;
  precio_venta: number;
  precio_mayorista?: number;
  precio_mayorista_max?: number;
  cantidad_mayorista_max?: number;
  opciones?: Opcion[];
}
interface Item {
  producto_id: string;
  descripcion: string;
  cantidad: number;
  precio_base: number;
  precio_unitario: number;
  tipo_precio: "menor" | "mayor" | "mayor_max";
  opciones_ids: string[];
}

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const supabase = createClient() as any;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [iva, setIva] = useState(21);
  const [validez, setValidez] = useState(15);
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<Item[]>([
    { producto_id: "", descripcion: "", cantidad: 1, precio_base: 0, precio_unitario: 0, tipo_precio: "menor", opciones_ids: [] },
  ]);

  useEffect(() => {
    supabase.from("clientes").select("id, nombre, cuit, email, direccion, ciudad, provincia").order("nombre")
      .then(({ data }) => setClientes(data ?? []));
    supabase.from("productos").select("id, nombre, precio_venta, precio_mayorista, precio_mayorista_max, cantidad_mayorista_max, producto_opciones(id, nombre, precio_extra)").eq("activo", true).order("nombre")
      .then(({ data }) => setProductos((data ?? []).map((p: any) => ({ ...p, opciones: p.producto_opciones ?? [] }))));
  }, []);

  function addItem() {
    setItems((prev) => [...prev, { producto_id: "", descripcion: "", cantidad: 1, precio_base: 0, precio_unitario: 0, tipo_precio: "menor", opciones_ids: [] }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function precioSegunTipo(prod: Producto, tipo: Item["tipo_precio"]): number {
    if (tipo === "mayor_max" && prod.precio_mayorista_max) return prod.precio_mayorista_max;
    if (tipo === "mayor" && prod.precio_mayorista) return prod.precio_mayorista;
    return prod.precio_venta;
  }

  function autoTipo(prod: Producto, cantidad: number): Item["tipo_precio"] {
    if (prod.cantidad_mayorista_max && cantidad >= prod.cantidad_mayorista_max && prod.precio_mayorista_max)
      return "mayor_max";
    return "menor";
  }

  function opcionesExtra(prod: Producto | undefined, opciones_ids: string[]): number {
    if (!prod?.opciones) return 0;
    return prod.opciones.filter((o) => opciones_ids.includes(o.id)).reduce((s, o) => s + o.precio_extra, 0);
  }

  function toggleOpcion(i: number, opcionId: string) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const prod = productos.find((p) => p.id === item.producto_id);
      const nuevosIds = item.opciones_ids.includes(opcionId)
        ? item.opciones_ids.filter((id) => id !== opcionId)
        : [...item.opciones_ids, opcionId];
      return { ...item, opciones_ids: nuevosIds, precio_unitario: item.precio_base + opcionesExtra(prod, nuevosIds) };
    }));
  }

  function setItem(i: number, field: keyof Item | "producto_id", value: string | number) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;

      if (field === "producto_id" && typeof value === "string") {
        const prod = productos.find((p) => p.id === value);
        if (!prod) return { ...item, producto_id: value, descripcion: "", precio_base: 0, precio_unitario: 0, tipo_precio: "menor" as const, opciones_ids: [] };
        const tipo = autoTipo(prod, item.cantidad);
        const base = precioSegunTipo(prod, tipo);
        return { ...item, producto_id: value, descripcion: prod.nombre, tipo_precio: tipo, precio_base: base, precio_unitario: base, opciones_ids: [] };
      }

      if (field === "cantidad" && typeof value === "number") {
        const prod = productos.find((p) => p.id === item.producto_id);
        const newItem = { ...item, cantidad: value };
        if (prod) {
          const tipo = autoTipo(prod, value);
          const base = precioSegunTipo(prod, tipo);
          newItem.tipo_precio = tipo;
          newItem.precio_base = base;
          newItem.precio_unitario = base + opcionesExtra(prod, item.opciones_ids);
        }
        return newItem;
      }

      if (field === "tipo_precio" && typeof value === "string") {
        const prod = productos.find((p) => p.id === item.producto_id);
        const tipo = value as Item["tipo_precio"];
        const base = prod ? precioSegunTipo(prod, tipo) : item.precio_base;
        return { ...item, tipo_precio: tipo, precio_base: base, precio_unitario: base + opcionesExtra(prod, item.opciones_ids) };
      }

      return { ...item, [field]: value };
    }));
  }

  const subtotal = items.reduce((s, it) => s + it.cantidad * it.precio_unitario, 0);
  const descuentoMonto = subtotal * (descuento / 100);
  const baseIva = subtotal - descuentoMonto;
  const ivaMonto = baseIva * (iva / 100);
  const total = baseIva + ivaMonto;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) { setError("Seleccioná un cliente."); return; }
    if (items.every((it) => !it.descripcion)) { setError("Agregá al menos un ítem."); return; }
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { data: presup, error: presupError } = await supabase
      .from("presupuestos")
      .insert({ cliente_id: clienteId, estado: "borrador", subtotal, descuento, iva, total, notas: notas || null, validez_dias: validez, created_by: user!.id })
      .select().single();

    if (presupError || !presup) { setError("Error al guardar."); setLoading(false); return; }

    const itemsToInsert = items
      .filter((it) => it.descripcion.trim())
      .map((it) => ({
        presupuesto_id: presup.id,
        producto_id: it.producto_id || null,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        subtotal: it.cantidad * it.precio_unitario,
      }));

    if (itemsToInsert.length > 0) {
      await (supabase as any).from("presupuesto_items").insert(itemsToInsert);
    }

    router.push(`/presupuestos/${presup.id}`);
    router.refresh();
  }

  return (
    <div className="page-container" style={{ maxWidth: "820px" }}>
      <PageHeader
        title="Nuevo presupuesto"
        action={<Link href="/presupuestos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>}
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Cliente */}
        <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Cliente</div>
          <FormRow>
            <Select label="Seleccioná el cliente *" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">— Elegí un cliente —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
            <div style={{ display: "flex", gap: "10px" }}>
              <Input label="Validez (días)" type="number" value={String(validez)} onChange={(e) => setValidez(Number(e.target.value))} />
              <Link href="/clientes/nuevo" style={{ alignSelf: "flex-end", fontSize: "12px", color: "var(--brand)", textDecoration: "none", whiteSpace: "nowrap", paddingBottom: "10px" }}>
                + Nuevo cliente
              </Link>
            </div>
          </FormRow>
          {clienteId && (() => {
            const c = clientes.find((cl) => cl.id === clienteId);
            if (!c) return null;
            return (
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: "12px", color: "var(--text-2)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {c.cuit && <span>DNI: <strong>{c.cuit}</strong></span>}
                {c.email && <span>Email: <strong>{c.email}</strong></span>}
                {c.ciudad && <span>Ciudad: <strong>{[c.ciudad, c.provincia].filter(Boolean).join(", ")}</strong></span>}
              </div>
            );
          })()}
        </Card>

        {/* Items */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Productos / servicios</div>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Agregar ítem</Button>
          </div>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 130px 1fr 80px 28px", gap: "10px", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
            {["Descripción", "Cant.", "Tipo precio", "Precio unit.", "Subtotal", ""].map((h) => (
              <div key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>

          {items.map((item, i) => {
            const prod = productos.find((p) => p.id === item.producto_id);
            return (
              <div key={i} style={{ marginBottom: "14px", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none", paddingBottom: i < items.length - 1 ? "14px" : "0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 130px 1fr 80px 28px", gap: "10px", alignItems: "start" }}>
                {/* Descripción con selector de producto */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <select
                    value={item.producto_id}
                    onChange={(e) => setItem(i, "producto_id", e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "11px", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--surface)", color: "var(--text-2)", fontFamily: "var(--font-main)" }}
                  >
                    <option value="">Seleccioná producto (opcional)</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <input
                    value={item.descripcion}
                    onChange={(e) => setItem(i, "descripcion", e.target.value)}
                    placeholder="Descripción del ítem"
                    style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-main)", outline: "none" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--brand)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                  />
                </div>

                {/* Cantidad */}
                <input type="number" min="1" value={item.cantidad}
                  onChange={(e) => setItem(i, "cantidad", Number(e.target.value))}
                  style={{ padding: "9px 10px", fontSize: "13px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-main)", outline: "none", width: "100%" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--brand)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />

                {/* Tipo de precio */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <select
                    value={item.tipo_precio}
                    onChange={(e) => setItem(i, "tipo_precio", e.target.value)}
                    style={{ padding: "9px 8px", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-main)", cursor: "pointer" }}
                  >
                    <option value="menor">Minorista</option>
                    {prod?.precio_mayorista && <option value="mayor">Mayorista</option>}
                    {prod?.precio_mayorista_max && <option value="mayor_max">May. máx{prod.cantidad_mayorista_max ? ` (≥${prod.cantidad_mayorista_max}u)` : ""}</option>}
                  </select>
                  {prod && item.tipo_precio === "mayor_max" && prod.cantidad_mayorista_max && item.cantidad >= prod.cantidad_mayorista_max && (
                    <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: 500 }}>✓ Precio auto-aplicado</div>
                  )}
                  {prod && prod.cantidad_mayorista_max && item.cantidad < prod.cantidad_mayorista_max && item.tipo_precio !== "mayor_max" && prod.precio_mayorista_max && (
                    <div style={{ fontSize: "10px", color: "var(--text-3)" }}>May. máx desde {prod.cantidad_mayorista_max}u</div>
                  )}
                </div>

                {/* Precio unitario */}
                <input type="number" min="0" value={item.precio_unitario}
                  onChange={(e) => setItem(i, "precio_unitario", Number(e.target.value))}
                  style={{ padding: "9px 10px", fontSize: "13px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-main)", outline: "none", width: "100%" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--brand)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />

                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", textAlign: "right", paddingTop: "10px" }}>
                  {pesos(item.cantidad * item.precio_unitario)}
                </div>
                <button type="button" onClick={() => removeItem(i)}
                  style={{ width: "28px", height: "28px", border: "1px solid var(--border)", borderRadius: "6px", background: "transparent", cursor: items.length === 1 ? "not-allowed" : "pointer", color: "var(--text-3)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", opacity: items.length === 1 ? 0.3 : 1, marginTop: "2px" }}
                  disabled={items.length === 1}
                >×</button>
              </div>
              {/* Opciones del producto */}
              {prod?.opciones && prod.opciones.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px", paddingLeft: "4px" }}>
                  {prod.opciones.map((op) => (
                    <label key={op.id} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-2)", cursor: "pointer", background: item.opciones_ids.includes(op.id) ? "var(--brand-subtle, #eff6ff)" : "var(--surface-2)", border: `1px solid ${item.opciones_ids.includes(op.id) ? "var(--brand)" : "var(--border)"}`, borderRadius: "6px", padding: "4px 10px" }}>
                      <input type="checkbox" checked={item.opciones_ids.includes(op.id)} onChange={() => toggleOpcion(i, op.id)} style={{ margin: 0 }} />
                      {op.nombre}
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>+{pesos(op.precio_extra)}</span>
                    </label>
                  ))}
                </div>
              )}
              </div>
            );
          })}
        </Card>

        {/* Totales + config */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Configuración</div>
            <FormRow>
              <Input label="Descuento (%)" type="number" min="0" max="100" value={String(descuento)} onChange={(e) => setDescuento(Number(e.target.value))} />
              <Input label="IVA (%)" type="number" min="0" value={String(iva)} onChange={(e) => setIva(Number(e.target.value))} />
            </FormRow>
            <Textarea label="Notas / condiciones" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Condiciones de pago, entrega, etc." />
          </Card>

          <Card>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>Resumen</div>
            {[
              { label: "Subtotal", value: pesos(subtotal) },
              { label: `Descuento (${descuento}%)`, value: descuento > 0 ? `- ${pesos(descuentoMonto)}` : "—" },
              { label: `IVA (${iva}%)`, value: pesos(ivaMonto) },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-2)", marginBottom: "10px" }}>
                <span>{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
            <Divider />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Total</span>
              <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.02em" }}>{pesos(total)}</span>
            </div>
          </Card>
        </div>

        {error && (
          <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: "13px", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Link href="/presupuestos"><Button variant="secondary" type="button">Cancelar</Button></Link>
          <Button variant="primary" type="submit" loading={loading}>Guardar presupuesto</Button>
        </div>
      </form>
    </div>
  );
}
