"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge, Button, PageHeader } from "@/components/ui";
import Link from "next/link";
import dynamic from "next/dynamic";

// Cargamos el generador de PDF solo en el cliente
const GenerarPDF = dynamic(() => import("@/components/presupuesto/GenerarPDF"), { ssr: false, loading: () => <Button variant="secondary" size="sm">Cargando PDF...</Button> });

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const ESTADO_BADGE: Record<string, "gray" | "info" | "success" | "danger"> = {
  borrador: "gray", enviado: "info", aprobado: "success", rechazado: "danger",
};
const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador", enviado: "Enviado", aprobado: "Aprobado", rechazado: "Rechazado",
};
const ESTADOS_SIGUIENTES: Record<string, string[]> = {
  borrador:  ["enviado"],
  enviado:   ["aprobado", "rechazado"],
  aprobado:  [],
  rechazado: ["borrador"],
};

export default function PresupuestoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient() as any;
  const [presup, setPresup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    supabase
      .from("presupuestos")
      .select("*, clientes(*), presupuesto_items(*, productos(nombre))")
      .eq("id", id)
      .single()
      .then(({ data }) => { setPresup(data); setLoading(false); });
  }, [id]);

  async function cambiarEstado(nuevoEstado: string) {
    setCambiandoEstado(true);
    await (supabase as any).from("presupuestos").update({ estado: nuevoEstado }).eq("id", id);
    setPresup((p: any) => ({ ...p, estado: nuevoEstado }));
    setCambiandoEstado(false);
  }

  async function convertirAPedido() {
    setConvirtiendo(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: pedido, error: pedidoError } = await (supabase as any).from("pedidos").insert({
      cliente_id: presup.cliente_id,
      presupuesto_id: presup.id,
      estado: "recibido",
      total: presup.total,
      created_by: user!.id,
    }).select().single();

    if (pedidoError || !pedido) {
      setConvirtiendo(false);
      return;
    }

    if (presup.presupuesto_items?.length > 0) {
      await (supabase as any).from("pedido_items").insert(
        presup.presupuesto_items.map((it: any) => ({
          pedido_id: pedido.id,
          producto_id: it.producto_id,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          subtotal: it.subtotal,
        }))
      );
    }

    router.push(`/pedidos/${pedido.id}`);
  }

  async function eliminarPresupuesto() {
    setBorrando(true);
    await supabase.from("presupuesto_items").delete().eq("presupuesto_id", id);
    await supabase.from("presupuestos").delete().eq("id", id);
    router.push("/presupuestos");
    router.refresh();
  }

  if (loading) return <div className="page-container" style={{ color: "var(--text-2)", fontSize: "14px" }}>Cargando...</div>;
  if (!presup) return <div className="page-container" style={{ color: "var(--text-2)", fontSize: "14px" }}>No encontrado.</div>;

  const cliente = presup.clientes;
  const items = presup.presupuesto_items ?? [];
  const siguientes = ESTADOS_SIGUIENTES[presup.estado] ?? [];

  return (
    <div className="page-container" style={{ maxWidth: "820px" }}>
      <PageHeader
        title={`Presupuesto #${presup.numero}`}
        subtitle={new Date(presup.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
        action={
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <Badge variant={ESTADO_BADGE[presup.estado]}>{ESTADO_LABEL[presup.estado]}</Badge>
            <GenerarPDF presupuesto={presup} />
            {presup.estado === "aprobado" && (
              <Button variant="primary" size="sm" onClick={convertirAPedido} loading={convirtiendo}>
                Convertir a pedido →
              </Button>
            )}
            {presup.estado !== "aprobado" && (
              confirmDelete ? (
                <div style={{ display: "flex", gap: "6px" }}>
                  <Button variant="danger" size="sm" loading={borrando} onClick={eliminarPresupuesto}>
                    Confirmar borrado
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(true)}>
                  Eliminar
                </Button>
              )
            )}
            <Link href="/presupuestos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* Datos del cliente */}
        <Card>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Cliente</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>{cliente?.nombre}</div>
          {[
            { label: "DNI", value: cliente?.cuit },
            { label: "Email", value: cliente?.email },
            { label: "Ciudad", value: [cliente?.ciudad, cliente?.provincia].filter(Boolean).join(", ") },
            { label: "Dirección", value: cliente?.direccion },
          ].filter((r) => r.value).map((r) => (
            <div key={r.label} style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "4px" }}>
              <span style={{ color: "var(--text-3)", minWidth: "60px" }}>{r.label}</span>
              <span style={{ color: "var(--text)" }}>{r.value}</span>
            </div>
          ))}
        </Card>

        {/* Totales */}
        <Card>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Resumen</div>
          {[
            { label: "Subtotal", value: pesos(presup.subtotal) },
            { label: `Descuento (${presup.descuento}%)`, value: presup.descuento > 0 ? `- ${pesos(presup.subtotal * presup.descuento / 100)}` : "—" },
            { label: `IVA (${presup.iva}%)`, value: pesos((presup.subtotal - presup.subtotal * presup.descuento / 100) * presup.iva / 100) },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-2)", marginBottom: "8px" }}>
              <span>{r.label}</span><span>{r.value}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Total</span>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.02em" }}>{pesos(presup.total)}</span>
          </div>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-3)" }}>
            Validez: {presup.validez_dias} días desde la emisión
          </div>
        </Card>
      </div>

      {/* Items */}
      <Card padding="0" style={{ marginBottom: "16px" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ítems</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Descripción", "Cantidad", "Precio unit.", "Subtotal"].map((h) => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 20px", fontSize: "13px", color: "var(--text)" }}>{item.descripcion}</td>
                <td style={{ padding: "12px 20px", fontSize: "13px", color: "var(--text-2)" }}>{item.cantidad}</td>
                <td style={{ padding: "12px 20px", fontSize: "13px", color: "var(--text-2)" }}>{pesos(item.precio_unitario)}</td>
                <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{pesos(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Notas + cambiar estado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {presup.notas && (
          <Card>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Notas</div>
            <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{presup.notas}</p>
          </Card>
        )}

        {siguientes.length > 0 && (
          <Card>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Cambiar estado</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {siguientes.map((est) => (
                <Button key={est} variant={est === "aprobado" ? "primary" : est === "rechazado" ? "danger" : "secondary"}
                  loading={cambiandoEstado} onClick={() => cambiarEstado(est)}>
                  Marcar como {ESTADO_LABEL[est]}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
