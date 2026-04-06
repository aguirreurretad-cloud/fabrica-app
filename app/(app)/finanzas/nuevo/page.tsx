"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Textarea, FormRow, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

const CATEGORIAS_INGRESO = ["Venta", "Cobro de presupuesto", "Anticipo", "Otro ingreso"];
const CATEGORIAS_EGRESO  = ["Telas / materiales", "Sueldos", "Alquiler", "Servicios", "Logística", "Impuestos", "Otro egreso"];

export default function NuevoMovimientoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    tipo: "ingreso", descripcion: "", monto: "",
    categoria: "", fecha: new Date().toISOString().split("T")[0], notas: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const categorias = form.tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descripcion.trim()) { setError("La descripción es obligatoria."); return; }
    if (!form.monto || parseFloat(form.monto) <= 0) { setError("El monto debe ser mayor a 0."); return; }

    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("movimientos").insert({
      tipo: form.tipo as "ingreso" | "egreso",
      descripcion: form.descripcion.trim(),
      monto: parseFloat(form.monto),
      categoria: form.categoria || null,
      fecha: form.fecha,
      created_by: user!.id,
    });

    if (error) {
      setError("Error al guardar. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/finanzas");
    router.refresh();
  }

  return (
    <div className="page-container" style={{ maxWidth: "560px" }}>
      <PageHeader
        title="Registrar movimiento"
        subtitle="Ingreso o egreso de caja"
        action={
          <Link href="/finanzas" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>
            ← Volver
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Tipo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {(["ingreso", "egreso"] as const).map((t) => (
              <div
                key={t}
                onClick={() => set("tipo", t)}
                style={{
                  padding: "14px", borderRadius: "var(--radius)",
                  border: `2px solid ${form.tipo === t ? (t === "ingreso" ? "#16a34a" : "#dc2626") : "var(--border)"}`,
                  background: form.tipo === t ? (t === "ingreso" ? "#f0fdf4" : "#fef2f2") : "var(--surface)",
                  cursor: "pointer", textAlign: "center", transition: "all 0.12s",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                  {t === "ingreso" ? "↑" : "↓"}
                </div>
                <div style={{
                  fontSize: "13px", fontWeight: 600,
                  color: form.tipo === t ? (t === "ingreso" ? "#16a34a" : "#dc2626") : "var(--text-2)",
                }}>
                  {t === "ingreso" ? "Ingreso" : "Egreso"}
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Descripción *"
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder={form.tipo === "ingreso" ? "Ej: Pago de Modas Sol" : "Ej: Compra de telas"}
          />

          <FormRow>
            <Input
              label="Monto ($) *"
              type="number"
              value={form.monto}
              onChange={(e) => set("monto", e.target.value)}
              placeholder="15000"
            />
            <Input
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => set("fecha", e.target.value)}
            />
          </FormRow>

          <Select
            label="Categoría"
            value={form.categoria}
            onChange={(e) => set("categoria", e.target.value)}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>

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
            <Link href="/finanzas"><Button variant="secondary" type="button">Cancelar</Button></Link>
            <Button variant="primary" type="submit" loading={loading}>Guardar movimiento</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
