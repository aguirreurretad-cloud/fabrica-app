"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Textarea, FormRow, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

interface Receta { id: string; nombre: string; unidad_producida: string; receta_ingredientes: { cantidad: number; costo_unitario: number }[]; }

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function NuevaProduccionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recetas, setRecetas] = useState<Receta[]>([]);

  const [form, setForm] = useState({
    nombre: "",
    receta_id: searchParams.get("receta") ?? "",
    cantidad_objetivo: "",
    fecha_inicio: new Date().toISOString().split("T")[0],
    notas: "",
  });

  useEffect(() => {
    (supabase as any).from("recetas")
      .select("id, nombre, unidad_producida, receta_ingredientes(cantidad, costo_unitario)")
      .order("nombre")
      .then(({ data }: { data: any }) => setRecetas(data ?? []));
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const recetaSeleccionada = recetas.find((r) => r.id === form.receta_id);
  const costoPorUnidad = recetaSeleccionada
    ? recetaSeleccionada.receta_ingredientes.reduce((s, ing) => s + ing.cantidad * ing.costo_unitario, 0)
    : 0;
  const costoTotal = costoPorUnidad * (parseInt(form.cantidad_objetivo) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.cantidad_objetivo || parseInt(form.cantidad_objetivo) < 1) {
      setError("La cantidad objetivo debe ser mayor a 0."); return;
    }
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { data: prod, error: prodError } = await (supabase as any).from("producciones").insert({
      nombre: form.nombre.trim(),
      receta_id: form.receta_id || null,
      cantidad_objetivo: parseInt(form.cantidad_objetivo),
      cantidad_producida: 0,
      estado: "en_proceso",
      fecha_inicio: form.fecha_inicio || null,
      notas: form.notas || null,
      created_by: user!.id,
    }).select().single();

    if (prodError || !prod) { setError("Error al guardar."); setLoading(false); return; }

    router.push(`/fabricacion/producciones/${prod.id}`);
    router.refresh();
  }

  return (
    <div className="page-container" style={{ maxWidth: "680px" }}>
      <PageHeader
        title="Nueva producción"
        subtitle="Configurá el lote de fabricación"
        action={<Link href="/fabricacion" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>}
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormRow>
            <Input label="Nombre del lote *" value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)} placeholder="Ej: Lote mates marzo 2025" />
            <Input label="Fecha de inicio" type="date" value={form.fecha_inicio}
              onChange={(e) => set("fecha_inicio", e.target.value)} />
          </FormRow>

          <Select label="Receta (opcional)" value={form.receta_id} onChange={(e) => set("receta_id", e.target.value)}>
            <option value="">— Sin receta —</option>
            {recetas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Select>

          <Input
            label={`Cantidad objetivo${recetaSeleccionada ? ` (${recetaSeleccionada.unidad_producida}s)` : ""} *`}
            type="number"
            value={form.cantidad_objetivo}
            onChange={(e) => set("cantidad_objetivo", e.target.value)}
            placeholder="1000"
          />

          {/* Proyección de costo */}
          {recetaSeleccionada && form.cantidad_objetivo && (
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Proyección de costo</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-2)", marginBottom: "6px" }}>
                <span>Costo por {recetaSeleccionada.unidad_producida}</span>
                <span>{pesos(costoPorUnidad)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-2)", marginBottom: "6px" }}>
                <span>Cantidad</span>
                <span>× {parseInt(form.cantidad_objetivo).toLocaleString("es-AR")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Costo total del lote</span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.02em" }}>{pesos(costoTotal)}</span>
              </div>
            </div>
          )}

          <Textarea label="Notas" value={form.notas}
            onChange={(e) => set("notas", e.target.value)} placeholder="Observaciones del lote..." />
        </Card>

        {error && (
          <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: "13px", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Link href="/fabricacion"><Button variant="secondary" type="button">Cancelar</Button></Link>
          <Button variant="primary" type="submit" loading={loading}>Iniciar producción</Button>
        </div>
      </form>
    </div>
  );
}
