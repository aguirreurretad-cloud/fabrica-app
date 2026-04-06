"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard",     icon: "▦", label: "Inicio" },
  { href: "/presupuestos",  icon: "◈", label: "Presupuestos" },
  { href: "/productos",     icon: "◫", label: "Productos" },
  { href: "/clientes",      icon: "◎", label: "Clientes" },
  { href: "/pedidos",       icon: "◩", label: "Pedidos" },
  { href: "/fabricacion",   icon: "⚙", label: "Fabricación" },
  { href: "/correo",        icon: "✉", label: "Correo Arg." },
  { href: "/finanzas",      icon: "◑", label: "Finanzas" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
            zIndex: 40, display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: "var(--sidebar-w)",
        minWidth: "var(--sidebar-w)",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: 30,
        flexShrink: 0,
      }}>

        {/* Brand */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "32px", height: "32px",
            background: "var(--brand)", borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", flexShrink: 0,
          }}>🧵</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>FabricApp</div>
            <div style={{ fontSize: "11px", color: "var(--text-3)" }}>Gestión textil</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 0", flex: 1 }}>
          <div style={{ padding: "8px 16px 4px", fontSize: "10px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Menú
          </div>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: "9px",
                  padding: "9px 16px",
                  fontSize: "13.5px", fontWeight: active ? 500 : 400,
                  color: active ? "var(--brand)" : "var(--text-2)",
                  background: active ? "var(--brand-light)" : "transparent",
                  borderLeft: `2px solid ${active ? "var(--brand)" : "transparent"}`,
                  textDecoration: "none",
                  transition: "all 0.12s",
                  borderRadius: "0 8px 8px 0",
                  marginRight: "8px",
                }}
              >
                <span style={{ fontSize: "15px", width: "18px", textAlign: "center", flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "8px 12px",
              background: "transparent", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", fontSize: "13px",
              color: "var(--text-2)", cursor: "pointer",
              fontFamily: "var(--font-main)",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--danger-bg)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecaca";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}
          >
            <span>⬡</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          height: "var(--topbar-h)",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 20,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "7px 12px",
              fontSize: "13px", color: "var(--text-3)",
            }}>
              <span style={{ fontSize: "12px" }}>🔍</span>
              <span>Buscar... <kbd style={{
                fontSize: "10px", background: "var(--border)",
                padding: "1px 5px", borderRadius: "4px", color: "var(--text-3)"
              }}>⌘K</kbd></span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px", height: "32px",
              background: "var(--brand-light)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 500, color: "var(--brand)",
              cursor: "pointer",
            }}>
              U
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
