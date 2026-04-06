"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, PageHeader, Badge, Input, Button } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Movimiento { fecha: string; planta: string; historia: string; }
interface EnvioSeguimiento {
  id: string;
  tracking_number: string;
  estado: string | null;
  detalle: string | null;
  last_checked_at: string | null;
  created_at: string;
}

const ESTADO_BADGE: Record<string, "success" | "info" | "warning" | "danger" | "gray"> = {
  "Entregado":   "success",
  "En camino":   "info",
  "En sucursal": "warning",
  "Devuelto":    "danger",
  "Demorado":    "danger",
};

const STALE_HOURS = 12;

function esDesactualizado(last_checked_at: string | null): boolean {
  if (!last_checked_at) return true;
  return Date.now() - new Date(last_checked_at).getTime() > STALE_HOURS * 60 * 60 * 1000;
}

export default function CorreoPage() {
  const supabase = createClient();
  const [envios, setEnvios] = useState<EnvioSeguimiento[]>([]);
  const [loadingEnvios, setLoadingEnvios] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [trackInput, setTrackInput] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [estado, setEstado] = useState("");
  const [tracking, setTracking] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const cargarEnvios = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("envios_seguimiento")
      .select("*")
      .order("last_checked_at", { ascending: false, nullsFirst: true });
    if (error) {
      setDbError(`Error de base de datos: ${error.message}. ¿Ejecutaste el SQL supabase-envios-seguimiento.sql en Supabase?`);
    } else {
      setDbError(null);
      setEnvios((data as EnvioSeguimiento[]) ?? []);
    }
    setLoadingEnvios(false);
  }, []);

  // Carga inicial + actualización automática de envíos desactualizados
  useEffect(() => {
    cargarEnvios().then(() => {
      // Disparar actualización en background si hay envíos desactualizados
      setActualizando(true);
      fetch("/api/correo/actualizar", { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (data.actualizados > 0) cargarEnvios();
        })
        .catch(() => {})
        .finally(() => setActualizando(false));
    });
  }, [cargarEnvios]);

  function addLog(msg: string) {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString("es-AR")}] ${msg}`]);
  }

  async function handleTrack(numeroOverride?: string) {
    const num = (numeroOverride ?? trackInput).trim().replace(/[\s.\-]/g, "");
    if (!num) return;
    setTracking(true);
    setMovimientos([]);
    setEstado("");
    setLog([]);
    setSugerencia(null);

    addLog(`Iniciando rastreo: ${num}`);

    // Registrar el número inmediatamente, aunque el scraping falle después
    const { error: errReg } = await (supabase as any).from("envios_seguimiento").upsert(
      { tracking_number: num },
      { onConflict: "tracking_number" }
    );
    if (errReg) addLog(`⚠ Error al registrar: ${errReg.message}`);
    else addLog("Número registrado en la lista.");
    await cargarEnvios();

    addLog("Consultando Correo Argentino vía Playwright...");

    try {
      const res = await fetch(`/api/correo?tracking=${encodeURIComponent(num)}`);
      const data = await res.json();

      addLog(`Estado: ${data.estado}`);

      if (data.movimientos?.length > 0) {
        setMovimientos(data.movimientos);
        setEstado(data.estado);
        addLog(`Movimientos encontrados: ${data.movimientos.length}`);
        addLog(`Último: ${data.detalle}`);

        // Guardar desde el cliente con el resultado completo
        const { error: errGuard } = await (supabase as any).from("envios_seguimiento").upsert(
          {
            tracking_number: num,
            estado: data.estado,
            detalle: data.detalle,
            last_checked_at: new Date().toISOString(),
          },
          { onConflict: "tracking_number" }
        );
        if (errGuard) addLog(`⚠ Error al guardar estado: ${errGuard.message}`);
        else addLog("Estado guardado en lista.");
      } else {
        addLog(data.detalle ?? "Sin datos");
        setEstado(data.estado ?? "Sin datos");
        if (data.sugerencia) setSugerencia(data.sugerencia);
      }
    } catch (err: any) {
      addLog(`Error: ${err?.message}`);
      setEstado("Error");
    } finally {
      setTracking(false);
      // Refrescar siempre al terminar para mostrar el estado actualizado
      await cargarEnvios();
    }
  }

  const stalesCount = envios.filter((e) => esDesactualizado(e.last_checked_at)).length;

  return (
    <div className="page-container">
      <PageHeader title="Correo Argentino" subtitle="Seguimiento de envíos" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "14px" }}>Rastrear envío</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <Input
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder="Ej: 00009766284700LCXA61701"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                style={{ flex: 1 }}
              />
              <Button variant="primary" onClick={() => handleTrack()} loading={tracking}>Rastrear</Button>
            </div>

            {log.length > 0 && (
              <div style={{
                background: "#0a0a0a", borderRadius: "var(--radius)",
                padding: "12px", marginBottom: "12px", fontFamily: "var(--font-mono)",
                fontSize: "11px", lineHeight: "1.7", maxHeight: "180px", overflowY: "auto",
              }}>
                {log.map((l, i) => (
                  <div key={i} style={{ color: l.includes("Error") || l.includes("Sin conexión") ? "#f87171" : l.includes("Sin datos") ? "#fbbf24" : "#4ade80" }}>
                    {l}
                  </div>
                ))}
                {tracking && <div style={{ color: "#60a5fa" }}>▋ procesando...</div>}
              </div>
            )}

            {sugerencia && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius)", padding: "12px 14px", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#92400e", marginBottom: "6px" }}>
                  No se pudo obtener el estado automáticamente
                </div>
                <div style={{ fontSize: "12px", color: "#78350f", lineHeight: 1.5 }}>{sugerencia}</div>
              </div>
            )}

            {movimientos.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius)", marginBottom: "10px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{trackInput}</div>
                  <Badge variant={ESTADO_BADGE[estado] ?? "gray"}>{estado}</Badge>
                </div>
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                  <div style={{ padding: "8px 14px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {movimientos.length} movimientos
                  </div>
                  {movimientos.map((m, i) => (
                    <div key={i} style={{
                      padding: "10px 14px",
                      borderBottom: i < movimientos.length - 1 ? "1px solid var(--border)" : "none",
                      background: i === 0 ? "var(--info-bg)" : "transparent",
                      display: "flex", alignItems: "flex-start", gap: "10px",
                    }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === 0 ? "var(--brand)" : "var(--border-2)", marginTop: "4px", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "var(--text)" : "var(--text-2)" }}>{m.historia}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>{m.planta} · {m.fecha}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Envíos registrados */}
        <Card padding="0">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Envíos registrados</span>
            {actualizando && (
              <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Actualizando...</span>
            )}
            {!actualizando && stalesCount > 0 && (
              <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{stalesCount} pendiente{stalesCount > 1 ? "s" : ""} de actualizar</span>
            )}
          </div>
          {loadingEnvios ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>Cargando...</div>
          ) : dbError ? (
            <div style={{ padding: "20px", color: "#dc2626", fontSize: "12px", lineHeight: 1.6 }}>{dbError}</div>
          ) : envios.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
              No hay envíos registrados. Rastreá un número para agregarlo.
            </div>
          ) : (
            envios.map((e) => {
              const stale = esDesactualizado(e.last_checked_at);
              return (
                <div
                  key={e.id}
                  style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", transition: "background 0.12s" }}
                  onClick={() => { setTrackInput(e.tracking_number); handleTrack(e.tracking_number); }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand)", marginBottom: "3px" }}>{e.tracking_number}</div>
                    {e.detalle && (
                      <div style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.detalle}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                      {e.last_checked_at
                        ? `Actualizado ${formatDistanceToNow(new Date(e.last_checked_at), { addSuffix: true, locale: es })}`
                        : "Sin chequear"}
                      {stale && " · desactualizado"}
                    </div>
                  </div>
                  <Badge variant={ESTADO_BADGE[e.estado ?? ""] ?? "gray"}>{e.estado ?? "Sin rastrear"}</Badge>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
