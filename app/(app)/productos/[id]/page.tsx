import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, PageHeader, Badge } from "@/components/ui";
import { DeleteProductoButton } from "./DeleteProductoButton";

export const dynamic = "force-dynamic";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default async function ProductoDetallePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: producto } = await supabase
    .from("productos")
    .select("*, categorias(nombre), producto_variantes(*)")
    .eq("id", params.id)
    .single();

  if (!producto) notFound();

  const variantes = (producto.producto_variantes as any[]) ?? [];
  const stockTotal = variantes.reduce((s, v) => s + v.stock, 0);
  const stockBajo = stockTotal <= producto.stock_minimo;

  return (
    <div className="page-container" style={{ maxWidth: "760px" }}>
      <PageHeader
        title={producto.nombre}
        subtitle={(producto.categorias as any)?.nombre ?? "Sin categoría"}
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/productos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>
              ← Volver
            </Link>
            <Link
              href={`/productos/${params.id}/editar`}
              style={{ display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
            >
              Editar
            </Link>
            <DeleteProductoButton id={params.id} />
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px" }}>
          {/* Foto */}
          <div style={{ height: "200px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {producto.foto_url ? (
              <Image src={producto.foto_url} alt={producto.nombre} fill style={{ objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "48px", opacity: 0.25 }}>👕</span>
            )}
          </div>

          {/* Info */}
          <Card style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Precio al por menor", value: pesos(producto.precio_venta), bold: true },
                { label: "Precio al por mayor", value: (producto as any).precio_mayorista ? pesos((producto as any).precio_mayorista) : "—", bold: true },
                {
                  label: `Mayorista máx${(producto as any).cantidad_mayorista_max ? ` (≥ ${(producto as any).cantidad_mayorista_max} u)` : ""}`,
                  value: (producto as any).precio_mayorista_max ? pesos((producto as any).precio_mayorista_max) : "—",
                  bold: true,
                },
                { label: "Precio de costo", value: producto.precio_costo ? pesos(producto.precio_costo) : "—", bold: false },
                { label: "Stock total", value: `${stockTotal} unidades`, bold: false },
                { label: "Stock mínimo", value: `${producto.stock_minimo} unidades`, bold: false },
              ].map(({ label, value, bold }) => (
                <div key={label}>
                  <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "13px", color: bold ? "var(--brand)" : "var(--text)", fontWeight: bold ? 600 : 400 }}>{value}</div>
                </div>
              ))}
            </div>
            {stockBajo && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: "12px", color: "#991b1b" }}>
                Stock bajo el mínimo configurado
              </div>
            )}
            {producto.descripcion && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Descripción</div>
                <div style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{producto.descripcion}</div>
              </div>
            )}
          </Card>
        </div>

        {/* Variantes */}
        {variantes.length > 0 && (
          <Card padding="0">
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
              Variantes · {variantes.length}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Talla", "Color", "Stock"].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variantes.map((v: any) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 20px", fontSize: "13px", color: "var(--text)" }}>{v.talla ?? "—"}</td>
                    <td style={{ padding: "11px 20px", fontSize: "13px", color: "var(--text-2)" }}>{v.color ?? "—"}</td>
                    <td style={{ padding: "11px 20px" }}>
                      <Badge variant={v.stock <= 0 ? "danger" : v.stock <= 5 ? "warning" : "success"}>{v.stock} u.</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
