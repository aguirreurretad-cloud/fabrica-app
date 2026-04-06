"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const ESTADO_LABEL: Record<string, string> = {
  en_proceso: "En proceso", pausado: "Pausado", completado: "Completado", cancelado: "Cancelado",
};
const ESTADO_BADGE: Record<string, "info" | "warning" | "success" | "gray"> = {
  en_proceso: "info", pausado: "warning", completado: "success", cancelado: "gray",
};

const ETAPAS = [
  { key: "lijado",    label: "Lijado",   icon: "🪵" },
  { key: "pintado",   label: "Pintado",  icon: "🎨" },
  { key: "pegado",    label: "Pegado",   icon: "🔧" },
  { key: "detalles",  label: "Detalles", icon: "✨" },
  { key: "embalado",  label: "Embalado", icon: "📦" },
];

export default function ProduccionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [prod, setProd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (supabase as any)
      .from("producciones")
      .select("*, recetas(nombre, unidad_producida, receta_ingredientes(descripcion, cantidad, unidad, costo_unitario))")
      .eq("id", id)
      .single()
      .then(({ data }: { data: any }) => { setProd(data); setLoading(false); });
  }, [id]);

  async function marcarEtapa(nuevaEtapa: number) {
    if (guardando) return;
    setGuardando(true);
    const completado = nuevaEtapa >= ETAPAS.length;
    const updates: any = {
      etapa_actual: nuevaEtapa,
      estado: completado ? "completado" : prod.estado === "pausado" ? "pausado" : "en_proceso",
    };
    if (completado) updates.fecha_fin = new Date().toISOString().split("T")[0];
    await (supabase as any).from("producciones").update(updates).eq("id", id);
    setProd((p: any) => ({ ...p, ...updates }));
    setGuardando(false);
  }

  async function cambiarEstado(nuevoEstado: string) {
    setGuardando(true);
    await (supabase as any).from("producciones").update({ estado: nuevoEstado }).eq("id", id);
    setProd((p: any) => ({ ...p, estado: nuevoEstado }));
    setGuardando(false);
  }

  if (loading) return <div className="page-container" style={{ color: "var(--text-2)", fontSize: "14px" }}>Cargando...</div>;
  if (!prod) return <div className="page-container" style={{ color: "var(--text-2)", fontSize: "14px" }}>No encontrado.</div>;

  const etapaActual: number = prod.etapa_actual ?? 0;
  const pct = Math.round((etapaActual / ETAPAS.length) * 100);
  const receta = prod.recetas;
  const ingredientes = receta?.receta_ingredientes ?? [];
  const costoPorUnidad = ingredientes.reduce((s: number, ing: any) => s + ing.cantidad * ing.costo_unitario, 0);
  const costoTotal = costoPorUnidad * (prod.cantidad_objetivo ?? 1);
  const barColor = pct === 100 ? "#16a34a" : pct >= 60 ? "var(--brand)" : "#f59e0b";
  const activa = prod.estado !== "completado" && prod.estado !== "cancelado";

  return (
    <div className="page-container" style={{ maxWidth: "820px" }}>
      <PageHeader
        title={prod.nombre}
        subtitle={prod.fecha_inicio ? `Inicio: ${new Date(prod.fecha_inicio).toLocaleDateString("es-AR")}` : "Sin fecha de inicio"}
        action={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Badge variant={ESTADO_BADGE[prod.estado]}>{ESTADO_LABEL[prod.estado]}</Badge>
            <Link href="/fabricacion" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Barra de progreso */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Progreso general</div>
              <div style={{ fontSize: "36px", fontWeight: 700, color: barColor, letterSpacing: "-0.03em", lineHeight: 1 }}>{pct}%</div>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-3)" }}>
              {etapaActual} de {ETAPAS.length} etapas completadas
            </div>
          </div>
          <div style={{ height: "12px", background: "var(--surface-2)", borderRadius: "100px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "100px", width: `${pct}%`,
              background: barColor, transition: "width 0.5s ease",
            }} />
          </div>
        </Card>

        {/* Las 5 etapas */}
        <Card>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>Etapas de producción</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
            {ETAPAS.map((etapa, i) => {
              const completada = i < etapaActual;
              const esSiguiente = i === etapaActual && activa;
              const bloqueada = i > etapaActual;

              return (
                <div
                  key={etapa.key}
                  onClick={() => {
                    if (!activa) return;
                    if (esSiguiente) marcarEtapa(etapaActual + 1);
                    // Permite desmarcar la última etapa completada
                    else if (completada && i === etapaActual - 1) marcarEtapa(etapaActual - 1);
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: "10px", padding: "16px 10px", borderRadius: "var(--radius-lg)",
                    border: `2px solid ${completada ? "#16a34a" : esSiguiente ? "var(--brand)" : "var(--border)"}`,
                    background: completada ? "#f0fdf4" : esSiguiente ? "var(--brand-light)" : "var(--surface)",
                    cursor: activa && (esSiguiente || (completada && i === etapaActual - 1)) ? "pointer" : "default",
                    opacity: bloqueada ? 0.45 : 1,
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  {/* Círculo de estado */}
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: completada ? "20px" : "18px",
                    background: completada ? "#16a34a" : esSiguiente ? "var(--brand)" : "var(--surface-2)",
                    color: completada || esSiguiente ? "#fff" : "var(--text-3)",
                    transition: "all 0.15s",
                  }}>
                    {completada ? "✓" : etapa.icon}
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: completada ? "#15803d" : esSiguiente ? "var(--brand)" : "var(--text-2)" }}>
                      {etapa.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                      {(i + 1) * 20}%
                    </div>
                  </div>

                  {esSiguiente && (
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--brand)", background: "var(--brand-light)", borderRadius: "20px", padding: "2px 8px" }}>
                      Marcar
                    </div>
                  )}
                  {completada && i === etapaActual - 1 && activa && (
                    <div style={{ fontSize: "10px", color: "var(--text-3)" }}>↩ deshacer</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Indicador de siguiente acción */}
          {activa && etapaActual < ETAPAS.length && (
            <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--brand-light)", borderRadius: "var(--radius)", fontSize: "13px", color: "var(--brand)", fontWeight: 500 }}>
              Siguiente: hacé clic en <strong>{ETAPAS[etapaActual].label}</strong> para marcarla como completada
            </div>
          )}
          {pct === 100 && (
            <div style={{ marginTop: "16px", padding: "12px 16px", background: "#f0fdf4", borderRadius: "var(--radius)", fontSize: "13px", color: "#15803d", fontWeight: 500 }}>
              ✓ Todas las etapas completadas
            </div>
          )}
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Controles de estado */}
          <Card style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Gestión del lote</div>
            {receta && (
              <div style={{ fontSize: "13px", color: "var(--text-2)" }}>
                Receta: <Link href={`/fabricacion/recetas/${prod.receta_id}`} style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>{receta.nombre}</Link>
              </div>
            )}
            {prod.notas && (
              <div style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5, background: "var(--surface-2)", borderRadius: "var(--radius)", padding: "8px 12px" }}>
                {prod.notas}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px", borderTop: "1px solid var(--border)", marginTop: "4px" }}>
              {prod.estado === "en_proceso" && (
                <Button variant="secondary" loading={guardando} onClick={() => cambiarEstado("pausado")}>⏸ Pausar</Button>
              )}
              {prod.estado === "pausado" && (
                <Button variant="primary" loading={guardando} onClick={() => cambiarEstado("en_proceso")}>▶ Reanudar</Button>
              )}
              {activa && (
                <Button variant="danger" loading={guardando} onClick={() => cambiarEstado("cancelado")}>Cancelar producción</Button>
              )}
            </div>
          </Card>

          {/* Costos */}
          {receta && costoPorUnidad > 0 && (
            <Card>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "14px" }}>Costos del lote</div>
              {[
                { label: `Costo por ${receta.unidad_producida}`, value: pesos(costoPorUnidad) },
                { label: `Cantidad (${prod.cantidad_objetivo?.toLocaleString("es-AR")} u)`, value: `× ${prod.cantidad_objetivo?.toLocaleString("es-AR")}` },
                { label: "Costo total", value: pesos(costoTotal), bold: true },
              ].map(({ label, value, bold }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "10px" }}>
                  <span style={{ color: "var(--text-2)" }}>{label}</span>
                  <span style={{ fontWeight: bold ? 700 : 500, color: bold ? "var(--brand)" : "var(--text)", fontSize: bold ? "16px" : "13px" }}>{value}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
