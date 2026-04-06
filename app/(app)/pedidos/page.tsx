import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { PedidoCard } from "@/components/ui/interactive";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  { key: "recibido",      label: "Recibido",      color: "#185FA5", bg: "#E6F1FB" },
  { key: "en_produccion", label: "En producción",  color: "#854F0B", bg: "#FAEEDA" },
  { key: "listo",         label: "Listo",          color: "#3B6D11", bg: "#EAF3DE" },
  { key: "enviado",       label: "Enviado",        color: "#0F6E56", bg: "#E1F5EE" },
  { key: "entregado",     label: "Entregado",      color: "#27500A", bg: "#EAF3DE" },
];

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: pedidos } = await supabase
    .from("pedidos").select("*, clientes(nombre)").order("created_at", { ascending: false });

  const today = new Date();

  const byEstado = COLUMNAS.reduce((acc, col) => {
    acc[col.key] = (pedidos ?? []).filter((p) => p.estado === col.key);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="page-container">
      <PageHeader
        title="Pedidos"
        subtitle={`${pedidos?.length ?? 0} en total`}
        action={
          <Link href="/pedidos/nuevo" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
            + Nuevo pedido
          </Link>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(200px, 1fr))", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
        {COLUMNAS.map((col) => {
          const items = byEstado[col.key] ?? [];
          return (
            <div key={col.key}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: col.bg, borderRadius: "var(--radius)", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: col.color }}>{col.label}</span>
                <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 700, background: col.color, color: "#fff", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {items.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {items.map((p: any) => {
                  const vence = p.fecha_entrega ? new Date(p.fecha_entrega) : null;
                  const demorado = !!(vence && vence < today && col.key !== "entregado");
                  return (
                    <PedidoCard
                      key={p.id}
                      id={p.id}
                      numero={p.numero}
                      clienteNombre={p.clientes?.nombre ?? "Sin cliente"}
                      total={p.total}
                      fechaEntrega={p.fecha_entrega ?? null}
                      demorado={demorado}
                    />
                  );
                })}
                {items.length === 0 && (
                  <div style={{ border: "1.5px dashed var(--border)", borderRadius: "var(--radius)", padding: "20px 12px", textAlign: "center", fontSize: "12px", color: "var(--text-3)" }}>
                    Sin pedidos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
