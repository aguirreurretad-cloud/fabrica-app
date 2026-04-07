"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

interface Factura { id: string; descripcion: string; monto_base: number; porcentaje: number; monto_final: number; fecha: string; }

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function FacturasPage() {
  const supabase = createClient() as any;
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  const [descripcion, setDescripcion] = useState("");
  const [montoBase, setMontoBase] = useState("");
  const [porcentaje, setPorcentaje] = useState("4");
  const [guardando, setGuardando] = useState(false);

  const base = parseFloat(montoBase) || 0;
  const pct = parseFloat(porcentaje) || 0;
  const recargo = base * (pct / 100);
  const total = base + recargo;

  async function cargar() {
    const { data } = await supabase.from("facturas_calculo").select("*").order("fecha", { ascending: false }).limit(50);
    setFacturas(data ?? []);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim() || !montoBase) return;
    setGuardando(true);
    await supabase.from("facturas_calculo").insert({
      descripcion: descripcion.trim(),
      monto_base: base,
      porcentaje: pct,
      monto_final: total,
      fecha: new Date().toISOString().split("T")[0],
    });
    setDescripcion(""); setMontoBase(""); setPorcentaje("4");
    setGuardando(false);
    cargar();
  }

  async function handleEliminar(id: string) {
    await supabase.from("facturas_calculo").delete().eq("id", id);
    cargar();
  }

  const totalRecargos = facturas.reduce((s, f) => s + (f.monto_final - f.monto_base), 0);

  return (
    <div className="page-container" style={{ maxWidth: "680px" }}>
      <PageHeader
        title="Calculadora de facturas"
        subtitle="Calculá el recargo por facturación"
        action={<Link href="/finanzas" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Finanzas</Link>}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Calculadora */}
        <Card>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "14px" }}>Nueva factura</div>
          <form onSubmit={handleGuardar} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Factura cliente García" />
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 2 }}>
                <Input label="Monto base ($)" type="number" value={montoBase} onChange={(e) => setMontoBase(e.target.value)} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <Input label="% recargo" type="number" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} placeholder="4" />
              </div>
            </div>

            {/* Preview cálculo */}
            {base > 0 && (
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "3px" }}>Base</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{pesos(base)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "3px" }}>Recargo ({pct}%)</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626" }}>+{pesos(recargo)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "3px" }}>Total a cobrar</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand)" }}>{pesos(total)}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" type="submit" loading={guardando}>Guardar factura</Button>
            </div>
          </form>
        </Card>

        {/* Historial */}
        <Card padding="0">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Historial</span>
            {facturas.length > 0 && (
              <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 500 }}>
                Total recargos: {pesos(totalRecargos)}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>Cargando...</div>
          ) : facturas.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>Sin facturas registradas.</div>
          ) : (
            facturas.map((f, i) => (
              <div key={f.id} style={{ padding: "12px 20px", borderBottom: i < facturas.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{f.descripcion}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                    {new Date(f.fecha).toLocaleDateString("es-AR")} · base {pesos(f.monto_base)} · +{f.porcentaje}%
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand)" }}>{pesos(f.monto_final)}</div>
                  <div style={{ fontSize: "11px", color: "#dc2626" }}>recargo: {pesos(f.monto_final - f.monto_base)}</div>
                </div>
                <button onClick={() => handleEliminar(f.id)}
                  style={{ width: "26px", height: "26px", border: "1px solid var(--border)", borderRadius: "6px", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}>
                  ×
                </button>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
