"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";

// ─── HoverRow: table row with hover effect ────────────────────────────────────
export function HoverRow({ children, href }: { children: React.ReactNode; href?: string }) {
  if (href) {
    return (
      <tr
        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {children}
      </tr>
    );
  }
  return (
    <tr
      style={{ borderBottom: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </tr>
  );
}

// ─── HoverCard: div with hover lift effect ────────────────────────────────────
export function HoverCard({
  children, style, href,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  href?: string;
}) {
  const base: React.CSSProperties = {
    transition: "box-shadow 0.15s, transform 0.15s",
    cursor: "pointer",
    ...style,
  };

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <div
          style={base}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            (e.currentTarget as HTMLDivElement).style.transform = "none";
          }}
        >
          {children}
        </div>
      </Link>
    );
  }

  return (
    <div
      style={base}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
      }}
    >
      {children}
    </div>
  );
}

// ─── PedidoCard: kanban card with hover ───────────────────────────────────────
export function PedidoCard({
  id, numero, clienteNombre, total, fechaEntrega, demorado,
}: {
  id: string; numero: number; clienteNombre: string;
  total: number; fechaEntrega: string | null; demorado: boolean;
}) {
  function pesos(n: number) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  }

  return (
    <Link href={`/pedidos/${id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--surface)",
          border: `1px solid ${demorado ? "#fecaca" : "var(--border)"}`,
          borderRadius: "var(--radius)", padding: "12px", cursor: "pointer",
          transition: "box-shadow 0.12s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)" }}>#{numero}</span>
          {demorado && (
            <span style={{ fontSize: "10px", color: "#991b1b", background: "#fef2f2", padding: "1px 6px", borderRadius: "20px" }}>
              ⚠ Demorado
            </span>
          )}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
          {clienteNombre}
        </div>
        <div style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 600 }}>
          {pesos(total)}
        </div>
        {fechaEntrega && (
          <div style={{ fontSize: "11px", color: demorado ? "#991b1b" : "var(--text-3)", marginTop: "6px" }}>
            📅 {new Date(fechaEntrega).toLocaleDateString("es-AR")}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── QuickAccessCard: dashboard shortcut tile ─────────────────────────────────
export function QuickAccessCard({
  href, label, icon, color,
}: {
  href: string; label: string; icon: string; color: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: color, borderRadius: "var(--radius)",
          padding: "12px 14px", cursor: "pointer",
          transition: "transform 0.12s, box-shadow 0.12s",
          border: "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "none";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        <div style={{ fontSize: "18px", marginBottom: "4px" }}>{icon}</div>
        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>{label}</div>
      </div>
    </Link>
  );
}

// ─── UltimoPedidoRow: dashboard last orders row ───────────────────────────────
const ESTADO_PEDIDO: Record<string, { label: string; color: string; bg: string }> = {
  recibido:      { label: "Recibido",      color: "#185FA5", bg: "#E6F1FB" },
  en_produccion: { label: "En producción", color: "#854F0B", bg: "#FAEEDA" },
  listo:         { label: "Listo",         color: "#3B6D11", bg: "#EAF3DE" },
  enviado:       { label: "Enviado",       color: "#0F6E56", bg: "#E1F5EE" },
  entregado:     { label: "Entregado",     color: "#27500A", bg: "#EAF3DE" },
};

export function UltimoPedidoRow({ pedido }: { pedido: any }) {
  function pesos(n: number) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  }
  const est = ESTADO_PEDIDO[pedido.estado] ?? ESTADO_PEDIDO.recibido;

  return (
    <Link href={`/pedidos/${pedido.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px", transition: "background 0.12s" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--bg)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
      >
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--text-2)", flexShrink: 0 }}>
          #{pedido.numero}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
            {pedido.clientes?.nombre ?? "Sin cliente"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
            {pesos(pedido.total)}
            {pedido.fecha_entrega && ` · Entrega: ${new Date(pedido.fecha_entrega).toLocaleDateString("es-AR")}`}
          </div>
        </div>
        <span style={{ padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: est.bg, color: est.color, flexShrink: 0 }}>
          {est.label}
        </span>
      </div>
    </Link>
  );
}
