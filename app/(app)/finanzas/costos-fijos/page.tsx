"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

interface CostoFijo { id: string; nombre: string; monto: number; frecuencia: string; activo: boolean; }

const FREQ_LABEL: Record<string, string> = { mensual: "Mensual", trimestral: "Trimestral", anual: "Anual" };

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function mensualizar(monto: number, freq: string) {
  if (freq === "trimestral") return monto / 3;
  if (freq === "anual") return monto / 12;
  return monto;
}

export default function CostosFijosPage() {
  const supabase = createClient() as any;
  const [costos, setCostos] = useState<CostoFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [frecuencia, setFrecuencia] = useState("mensual");
  const [guardando, setGuardando] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editFrecuencia, setEditFrecuencia] = useState("mensual");

  async function cargar() {
    const { data } = await supabase.from("costos_fijos").select("*").eq("activo", true).order("nombre");
    setCostos(data ?? []);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !monto) return;
    setGuardando(true);
    await supabase.from("costos_fijos").insert({ nombre: nombre.trim(), monto: parseFloat(monto), frecuencia });
    setNombre(""); setMonto(""); setFrecuencia("mensual");
    setGuardando(false);
    cargar();
  }

  async function handleGuardarEdicion() {
    await supabase.from("costos_fijos").update({ nombre: editNombre.trim(), monto: parseFloat(editMonto), frecuencia: editFrecuencia }).eq("id", editId);
    setEditId(null);
    cargar();
  }

  async function handleEliminar(id: string) {
    await supabase.from("costos_fijos").update({ activo: false }).eq("id", id);
    cargar();
  }

  const totalMensual = costos.reduce((s, c) => s + mensualizar(c.monto, c.frecuencia), 0);

  return (
    <div className="page-container" style={{ maxWidth: "680px" }}>
      <PageHeader
        title="Costos fijos"
        subtitle="Gastos recurrentes del negocio"
        action={<Link href="/finanzas" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Finanzas</Link>}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Total mensual */}
        {costos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {[
              { label: "Total mensual", value: pesos(totalMensual), color: "#dc2626" },
              { label: "Total trimestral", value: pesos(totalMensual * 3), color: "var(--text-2)" },
              { label: "Total anual", value: pesos(totalMensual * 12), color: "var(--text-2)" },
            ].map((k) => (
              <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{k.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Nuevo costo */}
        <Card>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "14px" }}>Agregar costo fijo</div>
          <form onSubmit={handleCrear} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 2 }}>
              <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Alquiler, luz, internet…" />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="Monto ($)" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
            </div>
            <div style={{ flex: 1 }}>
              <Select label="Frecuencia" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </Select>
            </div>
            <Button variant="primary" type="submit" loading={guardando}>Agregar</Button>
          </form>
        </Card>

        {/* Lista */}
        <Card padding="0">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Costos registrados</span>
            <span style={{ fontSize: "11px", color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px 8px" }}>{costos.length}</span>
          </div>

          {loading ? (
            <div style={{ padding: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>Cargando...</div>
          ) : costos.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>Sin costos fijos registrados.</div>
          ) : (
            costos.map((c, i) => (
              <div key={c.id} style={{ borderBottom: i < costos.length - 1 ? "1px solid var(--border)" : "none", padding: "12px 20px" }}>
                {editId === c.id ? (
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ flex: 2 }}><Input label="Nombre" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} /></div>
                    <div style={{ flex: 1 }}><Input label="Monto ($)" type="number" value={editMonto} onChange={(e) => setEditMonto(e.target.value)} /></div>
                    <div style={{ flex: 1 }}>
                      <Select label="Frecuencia" value={editFrecuencia} onChange={(e) => setEditFrecuencia(e.target.value)}>
                        <option value="mensual">Mensual</option>
                        <option value="trimestral">Trimestral</option>
                        <option value="anual">Anual</option>
                      </Select>
                    </div>
                    <Button variant="primary" size="sm" onClick={handleGuardarEdicion}>Guardar</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{c.nombre}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                        {FREQ_LABEL[c.frecuencia]} · equiv. {pesos(mensualizar(c.monto, c.frecuencia))}/mes
                      </div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#dc2626" }}>{pesos(c.monto)}</span>
                    <button onClick={() => { setEditId(c.id); setEditNombre(c.nombre); setEditMonto(String(c.monto)); setEditFrecuencia(c.frecuencia); }}
                      style={{ padding: "4px 10px", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
                      Editar
                    </button>
                    <button onClick={() => handleEliminar(c.id)}
                      style={{ padding: "4px 10px", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "transparent", color: "var(--text-3)", cursor: "pointer" }}>
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
