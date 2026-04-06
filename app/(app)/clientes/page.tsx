import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge, Card, PageHeader, EmptyState } from "@/components/ui";
import { HoverRow } from "@/components/ui/interactive";

export const dynamic = "force-dynamic";

const TIPO_BADGE: Record<string, "info" | "success" | "gray"> = {
  mayorista: "success", minorista: "info", ocasional: "gray",
};

export default async function ClientesPage() {
  const supabase = await createClient() as any;
  const { data: clientes } = await supabase
    .from("clientes").select("*").order("nombre");

  return (
    <div className="page-container">
      <PageHeader
        title="Clientes"
        subtitle={`${clientes?.length ?? 0} registrados`}
        action={
          <Link href="/clientes/nuevo" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
            + Nuevo cliente
          </Link>
        }
      />
      <Card padding="0">
        {!clientes || clientes.length === 0 ? (
          <EmptyState icon="◎" title="No hay clientes aún" description="Comenzá cargando tu primer cliente." action={<Link href="/clientes/nuevo" style={{ color: "var(--brand)", fontSize: "13px" }}>Agregar cliente →</Link>} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nombre", "DNI", "Ciudad", "Teléfono", "Tipo", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <HoverRow key={c.id}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{c.nombre}</div>
                    {c.email && <div style={{ fontSize: "11px", color: "var(--text-3)" }}>{c.email}</div>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-2)" }}>{c.cuit ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-2)" }}>{[c.ciudad, c.provincia].filter(Boolean).join(", ") || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-2)" }}>{c.telefono ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge variant={TIPO_BADGE[c.tipo] ?? "gray"}>{c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/clientes/${c.id}`} style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none" }}>Ver →</Link>
                  </td>
                </HoverRow>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
