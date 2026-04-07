"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, PageHeader, Badge } from "@/components/ui";
import Link from "next/link";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function mensualizar(monto: number, freq: string) {
  if (freq === "trimestral") return monto / 3;
  if (freq === "anual") return monto / 12;
  return monto;
}

export default function FinanzasPage() {
  const supabase = createClient() as any;
  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const firstDay = `${mes}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [pedidosPorCobrar, setPedidosPorCobrar] = useState<any[]>([]);
  const [costosFijos, setCostosFijos] = useState<any[]>([]);
  const [pagosDelMes, setPagosDelMes] = useState<Set<string>>(new Set());
  const [recargosDelMes, setRecargosDelMes] = useState(0);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    const [
      { data: movs },
      { data: pedidos },
      { data: costos },
      { data: pagos },
      { data: facturas },
    ] = await Promise.all([
      supabase.from("movimientos").select("*").gte("fecha", firstDay).lte("fecha", lastDay).order("fecha", { ascending: false }),
      supabase.from("pedidos").select("id, numero, total, estado, clientes(nombre)").not("estado", "eq", "entregado").order("created_at", { ascending: false }).limit(20),
      supabase.from("costos_fijos").select("*").eq("activo", true).order("nombre"),
      supabase.from("costos_fijos_pagos").select("costo_fijo_id").eq("mes", mes),
      supabase.from("facturas_calculo").select("monto_base, porcentaje").gte("fecha", firstDay).lte("fecha", lastDay),
    ]);

    setMovimientos(movs ?? []);
    setPedidosPorCobrar(pedidos ?? []);
    setCostosFijos(costos ?? []);
    setPagosDelMes(new Set((pagos ?? []).map((p: any) => p.costo_fijo_id)));

    // Ingresos brutos = suma de (base × pct/100) de facturas del mes
    const totalRecargosMes = (facturas ?? []).reduce((s: number, f: any) => s + f.monto_base * (f.porcentaje / 100), 0);
    setRecargosDelMes(totalRecargosMes);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  async function togglePago(costoId: string) {
    if (pagosDelMes.has(costoId)) {
      await supabase.from("costos_fijos_pagos").delete().eq("costo_fijo_id", costoId).eq("mes", mes);
      setPagosDelMes((prev) => { const s = new Set(prev); s.delete(costoId); return s; });
    } else {
      await supabase.from("costos_fijos_pagos").insert({ costo_fijo_id: costoId, mes });
      setPagosDelMes((prev) => new Set(prev).add(costoId));
    }
  }

  const ingresos = movimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const egresos  = movimientos.filter((m) => m.tipo === "egreso" ).reduce((s, m) => s + m.monto, 0);
  const ganancia = ingresos - egresos;
  const totalPorCobrar = pedidosPorCobrar.reduce((s, p) => s + (p.total ?? 0), 0);

  const costosFijosMensuales = costosFijos.reduce((s, c) => s + mensualizar(c.monto, c.frecuencia), 0);
  const costosPagados = costosFijos.filter((c) => pagosDelMes.has(c.id)).reduce((s, c) => s + mensualizar(c.monto, c.frecuencia), 0);
  const costosPendientes = costosFijosMensuales - costosPagados;

  const ESTADO_BADGE: Record<string, "gray" | "info" | "warning" | "success"> = {
    recibido: "gray", en_produccion: "info", listo: "warning", enviado: "info", entregado: "success",
  };
  const ESTADO_LABEL: Record<string, string> = {
    recibido: "Recibido", en_produccion: "En producción", listo: "Listo", enviado: "Enviado", entregado: "Entregado",
  };

  if (loading) return <div className="page-container" style={{ color: "var(--text-2)", fontSize: "14px" }}>Cargando...</div>;

  return (
    <div className="page-container">
      <PageHeader
        title="Finanzas"
        subtitle={`${now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}`}
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/finanzas/costos-fijos" style={{ display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              Costos fijos
            </Link>
            <Link href="/finanzas/facturas" style={{ display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              Facturas
            </Link>
            <Link href="/finanzas/nuevo" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              + Movimiento
            </Link>
          </div>
        }
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Ingresos del mes",  value: pesos(ingresos),        color: "#16a34a" },
          { label: "Egresos del mes",   value: pesos(egresos),         color: "#dc2626" },
          { label: "Ganancia neta",     value: pesos(ganancia),        color: ganancia >= 0 ? "#16a34a" : "#dc2626" },
          { label: "Por cobrar",        value: pesos(totalPorCobrar),  color: "#d97706" },
        ].map((m) => (
          <div key={m.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* Movimientos del mes */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Movimientos del mes</span>
            <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{movimientos.length} registros</span>
          </div>
          {movimientos.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>No hay movimientos este mes.</div>
          ) : (
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {movimientos.map((m: any) => (
                <div key={m.id} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, background: m.tipo === "ingreso" ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                    {m.tipo === "ingreso" ? "↑" : "↓"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{m.descripcion}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)" }}>{new Date(m.fecha).toLocaleDateString("es-AR")}{m.categoria && ` · ${m.categoria}`}</div>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: m.tipo === "ingreso" ? "#16a34a" : "#dc2626" }}>
                    {m.tipo === "ingreso" ? "+" : "-"}{pesos(m.monto)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pedidos por cobrar */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Pedidos por cobrar</span>
            <span style={{ fontSize: "12px", color: "#d97706", fontWeight: 500 }}>{pesos(totalPorCobrar)}</span>
          </div>
          {pedidosPorCobrar.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>No hay pedidos pendientes.</div>
          ) : (
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {pedidosPorCobrar.map((p: any) => (
                <Link key={p.id} href={`/pedidos/${p.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                        {p.clientes?.nombre ?? "Sin cliente"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-3)" }}>Pedido #{p.numero}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{pesos(p.total)}</span>
                      <Badge variant={ESTADO_BADGE[p.estado] ?? "gray"}>{ESTADO_LABEL[p.estado] ?? p.estado}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Costos fijos del mes */}
      <Card padding="0">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Costos fijos del mes</span>
            <span style={{ fontSize: "12px", color: "var(--text-3)", marginLeft: "10px" }}>Hacé clic para marcar como pagado</span>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
            <span style={{ color: "#16a34a", fontWeight: 500 }}>Pagado: {pesos(costosPagados)}</span>
            <span style={{ color: "#dc2626", fontWeight: 500 }}>Pendiente: {pesos(costosPendientes)}</span>
            {recargosDelMes > 0 && (
              <span style={{ color: "#d97706", fontWeight: 500 }}>IIBB est.: {pesos(recargosDelMes)}</span>
            )}
          </div>
        </div>

        {costosFijos.length === 0 && recargosDelMes === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
            Sin costos fijos. <Link href="/finanzas/costos-fijos" style={{ color: "var(--brand)" }}>Cargar costos →</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1px", background: "var(--border)" }}>
            {costosFijos.map((c: any) => {
              const pagado = pagosDelMes.has(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => togglePago(c.id)}
                  style={{
                    padding: "16px 20px",
                    background: pagado ? "#f0fdf4" : "var(--surface)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    borderLeft: `3px solid ${pagado ? "#16a34a" : "#dc2626"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", flex: 1 }}>{c.nombre}</div>
                    <span style={{ fontSize: "11px", marginLeft: "8px", color: pagado ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      {pagado ? "✓ Pagado" : "Pendiente"}
                    </span>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: pagado ? "#16a34a" : "#dc2626", marginTop: "6px" }}>
                    {pesos(mensualizar(c.monto, c.frecuencia))}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-3)", marginTop: "2px", textTransform: "uppercase" }}>{c.frecuencia}</div>
                </div>
              );
            })}

            {/* Ingresos brutos automáticos */}
            {recargosDelMes > 0 && (
              <div style={{ padding: "16px 20px", background: "#fffbeb", borderLeft: "3px solid #d97706" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Ingresos Brutos (IIBB)</div>
                  <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 600 }}>Auto</span>
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#d97706", marginTop: "6px" }}>
                  {pesos(recargosDelMes)}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-3)", marginTop: "2px" }}>
                  4% de facturas del mes · <Link href="/finanzas/facturas" style={{ color: "var(--brand)" }}>Ver facturas</Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Total costos fijos */}
        {(costosFijos.length > 0 || recargosDelMes > 0) && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-2)" }}>Total costos fijos del mes</span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626" }}>{pesos(costosFijosMensuales + recargosDelMes)}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
