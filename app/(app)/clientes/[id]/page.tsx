import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

const TIPO_BADGE: Record<string, "info" | "success" | "gray"> = {
  mayorista: "success", minorista: "info", ocasional: "gray",
};

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!cliente) notFound();

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, numero, estado, total, fecha_entrega, created_at")
    .eq("cliente_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const ESTADO_PEDIDO: Record<string, string> = {
    recibido: "Recibido", en_produccion: "En producción", listo: "Listo",
    enviado: "Enviado", entregado: "Entregado",
  };
  const ESTADO_BADGE: Record<string, "gray" | "info" | "warning" | "success"> = {
    recibido: "gray", en_produccion: "info", listo: "warning",
    enviado: "info", entregado: "success",
  };

  return (
    <div className="page-container" style={{ maxWidth: "760px" }}>
      <PageHeader
        title={cliente.nombre}
        subtitle={`Cliente · ${cliente.tipo.charAt(0).toUpperCase() + cliente.tipo.slice(1)}`}
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/clientes" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>
              ← Volver
            </Link>
            <Link href={`/clientes/${cliente.id}/editar`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              Editar
            </Link>
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Datos del cliente */}
        <Card>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            Información
            <Badge variant={TIPO_BADGE[cliente.tipo] ?? "gray"}>{cliente.tipo.charAt(0).toUpperCase() + cliente.tipo.slice(1)}</Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { label: "Nombre", value: cliente.nombre },
              { label: "DNI", value: cliente.cuit ?? "—" },
              { label: "Email", value: cliente.email ?? "—" },
              { label: "Teléfono", value: cliente.telefono ?? "—" },
              { label: "Ciudad", value: [cliente.ciudad, cliente.provincia].filter(Boolean).join(", ") || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{label}</div>
                <div style={{ fontSize: "13px", color: "var(--text)" }}>{value}</div>
              </div>
            ))}
          </div>
          {cliente.notas && (
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Notas</div>
              <div style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{cliente.notas}</div>
            </div>
          )}
        </Card>

        {/* Pedidos del cliente */}
        <Card padding="0">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
            Pedidos
          </div>
          {!pedidos || pedidos.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
              Sin pedidos aún.
            </div>
          ) : (
            pedidos.map((p) => (
              <Link key={p.id} href={`/pedidos/${p.id}`} style={{ textDecoration: "none" }}>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Pedido #{p.numero}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                      {p.fecha_entrega ? `Entrega: ${new Date(p.fecha_entrega).toLocaleDateString("es-AR")}` : "Sin fecha de entrega"}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-2)" }}>
                    ${p.total.toLocaleString("es-AR")}
                  </div>
                  <Badge variant={ESTADO_BADGE[p.estado] ?? "gray"}>{ESTADO_PEDIDO[p.estado] ?? p.estado}</Badge>
                </div>
              </Link>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
