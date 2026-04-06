import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge, Card, PageHeader, EmptyState } from "@/components/ui";
import { HoverRow } from "@/components/ui/interactive";

export const dynamic = "force-dynamic";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const ESTADO_BADGE: Record<string, "gray" | "info" | "success" | "danger"> = {
  borrador: "gray", enviado: "info", aprobado: "success", rechazado: "danger",
};
const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador", enviado: "Enviado", aprobado: "Aprobado", rechazado: "Rechazado",
};

export default async function PresupuestosPage() {
  const supabase = await createClient() as any;
  const { data: presupuestos } = await supabase
    .from("presupuestos").select("*, clientes(nombre)").order("created_at", { ascending: false });

  return (
    <div className="page-container">
      <PageHeader
        title="Presupuestos"
        subtitle={`${presupuestos?.length ?? 0} en total`}
        action={
          <Link href="/presupuestos/nuevo" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
            + Nuevo presupuesto
          </Link>
        }
      />
      <Card padding="0">
        {!presupuestos || presupuestos.length === 0 ? (
          <EmptyState icon="◈" title="No hay presupuestos aún" description="Creá tu primer presupuesto." action={<Link href="/presupuestos/nuevo" style={{ color: "var(--brand)", fontSize: "13px" }}>Crear presupuesto →</Link>} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#", "Cliente", "Fecha", "Total", "Estado", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(presupuestos as any[]).map((p) => (
                <HoverRow key={p.id}>
                  <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-2)" }}>#{p.numero}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{p.clientes?.nombre ?? "Sin cliente"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-2)" }}>{new Date(p.created_at).toLocaleDateString("es-AR")}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{pesos(p.total)}</td>
                  <td style={{ padding: "12px 16px" }}><Badge variant={ESTADO_BADGE[p.estado] ?? "gray"}>{ESTADO_LABEL[p.estado] ?? p.estado}</Badge></td>
                  <td style={{ padding: "12px 16px" }}><Link href={`/presupuestos/${p.id}`} style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none" }}>Ver →</Link></td>
                </HoverRow>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
