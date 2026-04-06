import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default async function RecetaDetallePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: receta } = await (supabase as any)
    .from("recetas")
    .select("*, receta_ingredientes(*)")
    .eq("id", params.id)
    .single();

  if (!receta) notFound();

  const ingredientes = receta.receta_ingredientes ?? [];
  const costoTotal = ingredientes.reduce(
    (s: number, ing: any) => s + (ing.cantidad * ing.costo_unitario), 0
  );

  return (
    <div className="page-container" style={{ maxWidth: "680px" }}>
      <PageHeader
        title={receta.nombre}
        subtitle={`Receta · por ${receta.unidad_producida}`}
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/fabricacion" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>
            <Link href={`/fabricacion/producciones/nueva?receta=${params.id}`}
              style={{ display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "var(--brand)", color: "#fff", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              Iniciar producción
            </Link>
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {receta.descripcion && (
          <Card>
            <div style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{receta.descripcion}</div>
          </Card>
        )}

        <Card padding="0">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
            Ingredientes / insumos
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Descripción", "Cantidad", "Unidad", "Costo unit.", "Subtotal"].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((ing: any) => (
                <tr key={ing.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "11px 20px", fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{ing.descripcion}</td>
                  <td style={{ padding: "11px 20px", fontSize: "13px", color: "var(--text-2)" }}>{ing.cantidad}</td>
                  <td style={{ padding: "11px 20px", fontSize: "13px", color: "var(--text-2)" }}>{ing.unidad ?? "—"}</td>
                  <td style={{ padding: "11px 20px", fontSize: "13px", color: "var(--text-2)" }}>{pesos(ing.costo_unitario)}</td>
                  <td style={{ padding: "11px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{pesos(ing.cantidad * ing.costo_unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-2)" }}>Costo total por {receta.unidad_producida}</span>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.02em" }}>{pesos(costoTotal)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
