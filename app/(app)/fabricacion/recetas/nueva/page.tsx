"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Textarea, FormRow, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

interface Ingrediente { descripcion: string; cantidad: string; unidad: string; costo_unitario: string; }

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function NuevaRecetaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidadProducida, setUnidadProducida] = useState("unidad");
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { descripcion: "", cantidad: "1", unidad: "kg", costo_unitario: "" },
  ]);

  function setIng(i: number, field: keyof Ingrediente, value: string) {
    setIngredientes((prev) => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  }

  function addIngrediente() {
    setIngredientes((prev) => [...prev, { descripcion: "", cantidad: "1", unidad: "kg", costo_unitario: "" }]);
  }

  function removeIngrediente(i: number) {
    setIngredientes((prev) => prev.filter((_, idx) => idx !== i));
  }

  const costoTotal = ingredientes.reduce((s, ing) => {
    const cant = parseFloat(ing.cantidad) || 0;
    const costo = parseFloat(ing.costo_unitario) || 0;
    return s + cant * costo;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    const validos = ingredientes.filter((i) => i.descripcion.trim());
    if (validos.length === 0) { setError("Agregá al menos un ingrediente."); return; }
    setLoading(true); setError("");

    const { data: receta, error: recetaError } = await (supabase as any)
      .from("recetas")
      .insert({ nombre: nombre.trim(), descripcion: descripcion || null, unidad_producida: unidadProducida || "unidad" })
      .select().single();

    if (recetaError || !receta) { setError("Error al guardar."); setLoading(false); return; }

    await (supabase as any).from("receta_ingredientes").insert(
      validos.map((ing) => ({
        receta_id: receta.id,
        descripcion: ing.descripcion.trim(),
        cantidad: parseFloat(ing.cantidad) || 1,
        unidad: ing.unidad || null,
        costo_unitario: parseFloat(ing.costo_unitario) || 0,
      }))
    );

    router.push(`/fabricacion/recetas/${receta.id}`);
    router.refresh();
  }

  return (
    <div className="page-container" style={{ maxWidth: "760px" }}>
      <PageHeader
        title="Nueva receta"
        subtitle="Definí ingredientes y costos"
        action={<Link href="/fabricacion" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>}
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormRow>
            <Input label="Nombre de la receta *" value={nombre}
              onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Mate estampado" />
            <Input label="Unidad producida" value={unidadProducida}
              onChange={(e) => setUnidadProducida(e.target.value)} placeholder="unidad / docena / kg" />
          </FormRow>
          <Textarea label="Descripción (opcional)" value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalles del proceso..." />
        </Card>

        {/* Ingredientes */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ingredientes / insumos</div>
            <Button type="button" variant="secondary" size="sm" onClick={addIngrediente}>+ Agregar</Button>
          </div>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 28px", gap: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--border)", marginBottom: "10px" }}>
            {["Descripción", "Cantidad", "Unidad", "Costo unit. ($)", ""].map((h) => (
              <div key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ingredientes.map((ing, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 28px", gap: "10px", alignItems: "center" }}>
                <Input value={ing.descripcion} placeholder="Ej: Hilo de algodón"
                  onChange={(e) => setIng(i, "descripcion", e.target.value)} />
                <Input type="number" value={ing.cantidad} placeholder="1"
                  onChange={(e) => setIng(i, "cantidad", e.target.value)} />
                <Input value={ing.unidad} placeholder="kg / m / u"
                  onChange={(e) => setIng(i, "unidad", e.target.value)} />
                <Input type="number" value={ing.costo_unitario} placeholder="500"
                  onChange={(e) => setIng(i, "costo_unitario", e.target.value)} />
                <button type="button" onClick={() => removeIngrediente(i)}
                  disabled={ingredientes.length === 1}
                  style={{ width: "28px", height: "28px", border: "1px solid var(--border)", borderRadius: "6px", background: "transparent", cursor: ingredientes.length === 1 ? "not-allowed" : "pointer", color: "var(--text-3)", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", opacity: ingredientes.length === 1 ? 0.3 : 1 }}
                  onMouseEnter={(e) => { if (ingredientes.length > 1) { (e.currentTarget.style.background = "#fef2f2"); (e.currentTarget.style.color = "var(--danger)"); } }}
                  onMouseLeave={(e) => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "var(--text-3)"); }}
                >×</button>
              </div>
            ))}
          </div>

          {/* Costo total en vivo */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-2)" }}>Costo total por {unidadProducida || "unidad"}</span>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.02em" }}>{pesos(costoTotal)}</span>
          </div>
        </Card>

        {error && (
          <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: "13px", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Link href="/fabricacion"><Button variant="secondary" type="button">Cancelar</Button></Link>
          <Button variant="primary" type="submit" loading={loading}>Guardar receta</Button>
        </div>
      </form>
    </div>
  );
}
