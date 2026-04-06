"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verificar que las variables de entorno estén cargadas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes("TU_PROYECTO")) {
      setError("❌ Falta configurar el archivo .env.local con las credenciales de Supabase. Revisá el README.");
      setLoading(false);
      return;
    }

    let data, error;
    try {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      }));
    } catch (fetchErr: any) {
      setError("❌ Error de conexión: " + (fetchErr?.message ?? "No se pudo conectar a Supabase. Verificá tu .env.local y reiniciá el servidor con npm run dev."));
      setLoading(false);
      return;
    }

    if (error) {
      if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed")) {
        setError("❌ Error de red. Verificá que NEXT_PUBLIC_SUPABASE_URL en .env.local sea correcto y reiniciá npm run dev.");
      } else if (error.message.includes("Invalid login")) {
        setError("Email o contraseña incorrectos.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email no confirmado. En Supabase → Authentication → Providers → Email → desactivá 'Confirm email'.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    if (!data?.session) {
      setError("No se pudo iniciar sesión. Verificá que el email esté confirmado en Supabase.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 24px",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Fondo sutil con textura */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.02) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      {/* Líneas decorativas */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "1px", height: "80px", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.15))",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "1px", height: "80px", background: "linear-gradient(to top, transparent, rgba(255,255,255,0.15))",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        width: "100%", maxWidth: "360px",
      }}>

        {/* Logo */}
        <div style={{
          marginBottom: "40px",
          animation: "fadeUp 0.6s ease-out both",
        }}>
          <Image
            src="/logo-stb.png"
            alt="STB Logo"
            width={160}
            height={160}
            style={{ objectFit: "contain", filter: "invert(1)" }}
            priority
          />
        </div>

        {/* Texto principal */}
        {!showForm ? (
          <div style={{
            textAlign: "center",
            animation: "fadeUp 0.6s ease-out 0.1s both",
          }}>
            <h1 style={{
              fontSize: "28px", fontWeight: 700,
              color: "#ffffff", marginBottom: "10px",
              letterSpacing: "-0.02em", lineHeight: 1.2,
            }}>
              Panel STB
            </h1>
            <p style={{
              fontSize: "15px", color: "rgba(255,255,255,0.45)",
              marginBottom: "48px", lineHeight: 1.5,
            }}>
              Gestión de tu fábrica textil
            </p>

            <button
              onClick={() => setShowForm(true)}
              style={{
                width: "100%", padding: "15px 24px",
                background: "#ffffff", color: "#0a0a0a",
                border: "none", borderRadius: "12px",
                fontSize: "15px", fontWeight: 600,
                cursor: "pointer", letterSpacing: "-0.01em",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                transition: "transform 0.15s, opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Entrar al panel →
            </button>

            <p style={{ marginTop: "20px", fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>
              Solo para el equipo STB
            </p>
          </div>
        ) : (
          <div style={{
            width: "100%",
            animation: "fadeUp 0.25s ease-out both",
          }}>
            <button
              onClick={() => { setShowForm(false); setError(""); }}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                fontSize: "13px", cursor: "pointer", marginBottom: "24px",
                padding: 0, fontFamily: "'DM Sans', system-ui, sans-serif",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              ← Volver
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#fff", marginBottom: "6px" }}>
              Ingresá
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "28px" }}>
              Usá tu email y contraseña
            </p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                autoFocus
                autoComplete="email"
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", fontSize: "14px",
                  color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif",
                  outline: "none", transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                className="login-input" onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.35)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", fontSize: "14px",
                  color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif",
                  outline: "none", transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                className="login-input" onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.35)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />

              {error && (
                <div style={{
                  background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)",
                  borderRadius: "8px", padding: "10px 12px",
                  fontSize: "12px", color: "#fca5a5", lineHeight: 1.5,
                }}>
                  {error.includes("Invalid login") ? "Email o contraseña incorrectos." : error}
                  {error.includes("Email not confirmed") && (
                    <span> Desactivá "Confirm email" en Supabase → Authentication → Providers → Email.</span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: loading ? "rgba(255,255,255,0.3)" : "#ffffff",
                  color: "#0a0a0a", border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  marginTop: "4px", transition: "opacity 0.15s",
                }}
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>
        )}
      </div>


    </div>
  );
}
