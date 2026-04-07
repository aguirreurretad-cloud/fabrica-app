"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const ESTADOS: { key: string; label: string }[] = [
  { key: "recibido",      label: "Recibido" },
  { key: "en_produccion", label: "En producción" },
  { key: "listo",         label: "Listo" },
  { key: "enviado",       label: "Enviado" },
  { key: "entregado",     label: "Entregado" },
];
const ESTADO_BADGE: Record<string, "gray" | "info" | "warning" | "success"> = {
  recibido: "gray", en_produccion: "info", listo: "warning",
  enviado: "info", entregado: "success",
};

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient() as any;
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cambiando, setCambiando] = useState(false);
  const [telBombillas, setTelBombillas] = useState("");
  const [telMates, setTelMates] = useState("");

  useEffect(() => {
    setTelBombillas(localStorage.getItem("contacto_bombillas") ?? "");
    setTelMates(localStorage.getItem("contacto_mates") ?? "");
  }, []);

  useEffect(() => {
    (supabase as any)
      .from("pedidos")
      .select("*, clientes(nombre, email, telefono, ciudad, provincia), pedido_items(*, productos(nombre))")
      .eq("id", id)
      .single()
      .then(({ data }: { data: any }) => { setPedido(data); setLoading(false); });
  }, [id]);

  async function cambiarEstado(nuevoEstado: string) {
    setCambiando(true);
    await (supabase as any).from("pedidos").update({ estado: nuevoEstado }).eq("id", id);
    setPedido((p: any) => ({ ...p, estado: nuevoEstado }));
    setCambiando(false);
  }

  if (loading) return <div className="page-container" style={{ color: "var(--text-2)", fontSize: "14px" }}>Cargando...</div>;
  if (!pedido) return <div className="page-container" style={{ color: "var(--text-2)", fontSize: "14px" }}>No encontrado.</div>;

  const cliente = pedido.clientes;
  const items = pedido.pedido_items ?? [];
  const estadoActualIdx = ESTADOS.findIndex((e) => e.key === pedido.estado);

  // Separar ítems por categoría
  const itemsBombillas = items.filter((it: any) =>
    it.descripcion?.toLowerCase().includes("bombill") || it.productos?.nombre?.toLowerCase().includes("bombill")
  );
  const itemsMates = items.filter((it: any) =>
    it.descripcion?.toLowerCase().includes("mate") || it.productos?.nombre?.toLowerCase().includes("mate")
  );

  function buildWaMessage(categoria: string, itemsFiltrados: any[]): string {
    const lineas = itemsFiltrados.map((it: any) => `• ${it.descripcion}: *${it.cantidad} u*`).join("\n");
    return encodeURIComponent(
      `Hola! Te paso el pedido #${pedido.numero} de *${cliente?.nombre ?? "cliente"}*:\n\n*${categoria}:*\n${lineas}\n\n_STB Sistema_`
    );
  }
  const siguientes = ESTADOS.slice(estadoActualIdx + 1, estadoActualIdx + 2); // solo el siguiente

  return (
    <div className="page-container" style={{ maxWidth: "820px" }}>
      <PageHeader
        title={`Pedido #${pedido.numero}`}
        subtitle={pedido.fecha_entrega
          ? `Entrega: ${new Date(pedido.fecha_entrega).toLocaleDateString("es-AR")}`
          : "Sin fecha de entrega"}
        action={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Badge variant={ESTADO_BADGE[pedido.estado] ?? "gray"}>
              {ESTADOS.find((e) => e.key === pedido.estado)?.label ?? pedido.estado}
            </Badge>
            <Link href="/pedidos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Cliente */}
          <Card>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Cliente</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>{cliente?.nombre ?? "Sin cliente"}</div>
            {[
              { label: "Email", value: cliente?.email },
              { label: "Teléfono", value: cliente?.telefono },
              { label: "Ciudad", value: [cliente?.ciudad, cliente?.provincia].filter(Boolean).join(", ") },
            ].filter((r) => r.value).map((r) => (
              <div key={r.label} style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-3)" }}>{r.label}: </span>{r.value}
              </div>
            ))}
          </Card>

          {/* Resumen */}
          <Card>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Resumen</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.02em", marginBottom: "12px" }}>{pesos(pedido.total)}</div>
            {pedido.tracking_number && (
              <div style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-3)" }}>Tracking: </span>
                <Link href="/correo" style={{ color: "var(--brand)", textDecoration: "none" }}>{pedido.tracking_number}</Link>
              </div>
            )}
            {pedido.notas && (
              <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5, borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                {pedido.notas}
              </div>
            )}
          </Card>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <Card padding="0">
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ítems</div>
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
        )}

        {/* Enviar por WhatsApp */}
        {(itemsBombillas.length > 0 || itemsMates.length > 0) && (
          <Card>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Enviar pedido por WhatsApp</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {itemsBombillas.length > 0 && (
                telBombillas ? (
                  <a
                    href={`https://wa.me/${telBombillas}?text=${buildWaMessage("Bombillas", itemsBombillas)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 16px", background: "#25d366", color: "#fff", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                  >
                    <span>📩</span> Enviar Bombillas ({itemsBombillas.reduce((s: number, it: any) => s + it.cantidad, 0)} u)
                  </a>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    Configurá el contacto de bombillas en <Link href="/configuracion" style={{ color: "var(--brand)" }}>Configuración</Link>
                  </div>
                )
              )}
              {itemsMates.length > 0 && (
                telMates ? (
                  <a
                    href={`https://wa.me/${telMates}?text=${buildWaMessage("Mates", itemsMates)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 16px", background: "#25d366", color: "#fff", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                  >
                    <span>📩</span> Enviar Mates ({itemsMates.reduce((s: number, it: any) => s + it.cantidad, 0)} u)
                  </a>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    Configurá el contacto de mates en <Link href="/configuracion" style={{ color: "var(--brand)" }}>Configuración</Link>
                  </div>
                )
              )}
            </div>
          </Card>
        )}

        {/* Pipeline de estados */}
        <Card>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Estado del pedido</div>
          <div style={{ display: "flex", gap: "6px", marginBottom: siguientes.length > 0 ? "16px" : "0", flexWrap: "wrap" }}>
            {ESTADOS.map((e, i) => {
              const actual = e.key === pedido.estado;
              const pasado = i < estadoActualIdx;
              return (
                <div key={e.key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{
                    padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: actual ? 600 : 400,
                    background: actual ? "var(--brand)" : pasado ? "var(--surface-2)" : "transparent",
                    color: actual ? "#fff" : pasado ? "var(--text-2)" : "var(--text-3)",
                    border: `1px solid ${actual ? "var(--brand)" : "var(--border)"}`,
                  }}>
                    {e.label}
                  </div>
                  {i < ESTADOS.length - 1 && (
                    <span style={{ fontSize: "12px", color: "var(--border-2)" }}>→</span>
                  )}
                </div>
              );
            })}
          </div>
          {siguientes.length > 0 && (
            <Button
              variant="primary"
              loading={cambiando}
              onClick={() => cambiarEstado(siguientes[0].key)}
            >
              Avanzar a: {siguientes[0].label}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
