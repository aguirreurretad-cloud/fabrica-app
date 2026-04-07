import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge, PageHeader, EmptyState } from "@/components/ui";
import { HoverCard } from "@/components/ui/interactive";
import Image from "next/image";

export const dynamic = "force-dynamic";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default async function ProductosPage() {
  const supabase = await createClient() as any;
  const { data: productos } = await supabase
    .from("productos")
    .select("*, categorias(nombre), producto_variantes(stock), precio_mayorista, precio_mayorista_max, cantidad_mayorista_max")
    .eq("activo", true)
    .order("nombre");

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");

  const lista = (productos as any[]) ?? [];

  // Agrupar por categoría
  const grupos: { id: string | null; nombre: string; productos: any[] }[] = [];

  for (const cat of (categorias ?? [])) {
    const prods = lista.filter((p) => p.categoria_id === cat.id);
    if (prods.length > 0) grupos.push({ id: cat.id, nombre: cat.nombre, productos: prods });
  }
  // Productos sin categoría
  const sinCategoria = lista.filter((p) => !p.categoria_id);
  if (sinCategoria.length > 0) grupos.push({ id: null, nombre: "Sin categoría", productos: sinCategoria });

  return (
    <div className="page-container">
      <PageHeader
        title="Catálogo de productos"
        subtitle={`${lista.length} productos activos`}
        action={
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/productos/categorias" style={{ display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              Categorías
            </Link>
            <Link href="/productos/nuevo" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              + Agregar producto
            </Link>
          </div>
        }
      />

      {lista.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
          <EmptyState icon="◫" title="No hay productos aún" description="Agregá tu primer producto con fotos, tallas y precios." action={<Link href="/productos/nuevo" style={{ color: "var(--brand)", fontSize: "13px" }}>Agregar producto →</Link>} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {grupos.map((grupo) => (
            <div key={grupo.id ?? "sin-categoria"}>
              {/* Header de categoría */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  {grupo.nombre}
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px 10px" }}>
                  {grupo.productos.length}
                </span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>

              {/* Grid de productos */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
                {grupo.productos.map((p) => {
                  const stockTotal = (p.producto_variantes as any[])?.reduce((s: number, v: any) => s + v.stock, 0) ?? 0;
                  const stockBajo = stockTotal <= p.stock_minimo;
                  return (
                    <HoverCard
                      key={p.id}
                      href={`/productos/${p.id}`}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ height: "140px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                        {p.foto_url ? (
                          <Image src={p.foto_url} alt={p.nombre} fill style={{ objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "40px", opacity: 0.3 }}>👕</span>
                        )}
                        {stockBajo && (
                          <div style={{ position: "absolute", top: "8px", right: "8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 500, color: "#991b1b" }}>
                            Stock bajo
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "8px" }}>{p.nombre}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Menor</span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand)" }}>{pesos(p.precio_venta)}</span>
                          </div>
                          {p.precio_mayorista && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mayor</span>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{pesos(p.precio_mayorista)}</span>
                            </div>
                          )}
                          {p.precio_mayorista_max && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>May. máx{p.cantidad_mayorista_max ? ` ≥${p.cantidad_mayorista_max}` : ""}</span>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)" }}>{pesos(p.precio_mayorista_max)}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <Badge variant={stockBajo ? "danger" : "success"}>{stockTotal} u.</Badge>
                        </div>
                      </div>
                    </HoverCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
