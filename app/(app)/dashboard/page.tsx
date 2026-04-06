import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { QuickAccessCard, UltimoPedidoRow } from "@/components/ui/interactive";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = await createClient() as any;
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalClientes },
    { count: pedidosActivos },
    { count: presupuestosPendientes },
    { data: movimientos },
    { data: ultimosPedidos },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("pedidos").select("*", { count: "exact", head: true }).not("estado", "in", '("entregado")'),
    supabase.from("presupuestos").select("*", { count: "exact", head: true }).eq("estado", "enviado"),
    supabase.from("movimientos").select("tipo, monto").gte("fecha", firstDay),
    supabase.from("pedidos")
      .select("id, numero, estado, total, fecha_entrega, created_at, clientes(nombre)")
      .order("created_at", { ascending: false }).limit(5),
  ]);

  const ingresos = movimientos?.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0) ?? 0;
  const egresos  = movimientos?.filter((m) => m.tipo === "egreso" ).reduce((s, m) => s + m.monto, 0) ?? 0;

  return {
    totalClientes: totalClientes ?? 0,
    pedidosActivos: pedidosActivos ?? 0,
    presupuestosPendientes: presupuestosPendientes ?? 0,
    ingresos, egresos, ganancia: ingresos - egresos,
    ultimosPedidos: ultimosPedidos ?? [],
  };
}

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const metrics = [
    { label: "Ingresos del mes",    value: pesos(data.ingresos),               sub: "Cobrado este mes",                color: "#16a34a" },
    { label: "Ganancia neta",       value: pesos(data.ganancia),               sub: `Egresos: ${pesos(data.egresos)}`, color: data.ganancia >= 0 ? "#16a34a" : "#dc2626" },
    { label: "Pedidos activos",     value: String(data.pedidosActivos),        sub: "Sin entregar aún",                color: "var(--brand)" },
    { label: "Presupuestos",        value: String(data.presupuestosPendientes),sub: "Esperando respuesta",             color: "#d97706" },
    { label: "Clientes",            value: String(data.totalClientes),         sub: "Total registrados",               color: "var(--text-2)" },
  ];

  const quickLinks = [
    { href: "/presupuestos/nuevo", label: "Nuevo presupuesto", icon: "◈", color: "#eff6ff" },
    { href: "/pedidos/nuevo",      label: "Nuevo pedido",      icon: "◩", color: "#f0fdf4" },
    { href: "/clientes/nuevo",     label: "Nuevo cliente",     icon: "◎", color: "#faf5ff" },
    { href: "/productos/nuevo",    label: "Nuevo producto",    icon: "◫", color: "#fff7ed" },
  ];

  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Buen día 👋</h1>
        <p style={{ fontSize: "14px", color: "var(--text-2)" }}>
          {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: m.color, marginBottom: "4px" }}>{m.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-3)" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Últimos pedidos</span>
            <Link href="/pedidos" style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none" }}>Ver todos →</Link>
          </div>
          {data.ultimosPedidos.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
              No hay pedidos aún.{" "}
              <Link href="/pedidos" style={{ color: "var(--brand)", textDecoration: "none" }}>Crear el primero →</Link>
            </div>
          ) : (
            data.ultimosPedidos.map((p: any) => <UltimoPedidoRow key={p.id} pedido={p} />)
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "14px" }}>Accesos rápidos</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {quickLinks.map((a) => <QuickAccessCard key={a.href} {...a} />)}
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "14px" }}>Alertas</div>
            {data.presupuestosPendientes === 0 ? (
              <div style={{ fontSize: "13px", color: "var(--text-3)", textAlign: "center" }}>✓ Todo en orden</div>
            ) : (
              <Link href="/presupuestos" style={{ textDecoration: "none" }}>
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: "13px", color: "#92400e" }}>
                  ⚠️ {data.presupuestosPendientes} presupuesto{data.presupuestosPendientes > 1 ? "s" : ""} esperando respuesta
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
