import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default async function FinanzasPage() {
  const supabase = await createClient();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: movimientos } = await supabase
    .from("movimientos")
    .select("*, clientes(nombre)")
    .gte("fecha", firstDay)
    .lte("fecha", lastDay)
    .order("fecha", { ascending: false });

  const { data: cuentasPorCobrar } = await supabase
    .from("presupuestos")
    .select("id, numero, total, created_at, clientes(nombre)")
    .eq("estado", "aprobado")
    .order("created_at", { ascending: false })
    .limit(10);

  const ingresos = (movimientos ?? []).filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const egresos  = (movimientos ?? []).filter((m) => m.tipo === "egreso" ).reduce((s, m) => s + m.monto, 0);
  const ganancia = ingresos - egresos;
  const totalPorCobrar = (cuentasPorCobrar ?? []).reduce((s, p) => s + p.total, 0);

  return (
    <div className="page-container">
      <PageHeader
        title="Finanzas"
        subtitle={`Mes de ${now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}`}
        action={
          <Link href="/finanzas/nuevo" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", background: "var(--brand)", color: "#fff",
            border: "none", borderRadius: "var(--radius)", fontSize: "13px",
            fontWeight: 500, textDecoration: "none",
          }}>
            + Registrar movimiento
          </Link>
        }
      />

      {/* KPIs */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))",
        gap: "12px", marginBottom: "24px",
      }}>
        {[
          { label: "Ingresos del mes",  value: pesos(ingresos),       color: "#16a34a" },
          { label: "Egresos del mes",   value: pesos(egresos),        color: "#dc2626" },
          { label: "Ganancia neta",     value: pesos(ganancia),       color: ganancia >= 0 ? "#16a34a" : "#dc2626" },
          { label: "Por cobrar",        value: pesos(totalPorCobrar), color: "#d97706" },
        ].map((m) => (
          <div key={m.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "18px 20px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", fontWeight: 500 }}>
              {m.label}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: m.color, letterSpacing: "-0.02em" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Movimientos del mes */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Movimientos del mes</span>
            <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{movimientos?.length ?? 0} registros</span>
          </div>

          {!movimientos || movimientos.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
              No hay movimientos este mes.
            </div>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {movimientos.map((m: any) => (
                <div key={m.id} style={{
                  padding: "12px 20px", borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                    background: m.tipo === "ingreso" ? "#f0fdf4" : "#fef2f2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px",
                  }}>
                    {m.tipo === "ingreso" ? "↑" : "↓"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                      {m.descripcion}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                      {new Date(m.fecha).toLocaleDateString("es-AR")}
                      {m.categoria && ` · ${m.categoria}`}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "14px", fontWeight: 600,
                    color: m.tipo === "ingreso" ? "#16a34a" : "#dc2626",
                  }}>
                    {m.tipo === "ingreso" ? "+" : "-"}{pesos(m.monto)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Cuentas por cobrar */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Presupuestos aprobados sin cobrar</span>
          </div>

          {!cuentasPorCobrar || cuentasPorCobrar.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
              No hay cuentas pendientes.
            </div>
          ) : (
            <>
              {cuentasPorCobrar.map((p: any) => (
                <div key={p.id} style={{
                  padding: "12px 20px", borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                      {p.clientes?.nombre ?? "Sin cliente"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                      Presupuesto #{p.numero} · {new Date(p.created_at).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                      {pesos(p.total)}
                    </span>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                </div>
              ))}
              <div style={{
                padding: "12px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "12px", color: "var(--text-2)" }}>Total por cobrar</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#d97706" }}>
                  {pesos(totalPorCobrar)}
                </span>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
