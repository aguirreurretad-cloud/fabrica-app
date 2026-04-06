import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const ESTADO_LABEL: Record<string, string> = {
  en_proceso: "En proceso", pausado: "Pausado",
  completado: "Completado", cancelado: "Cancelado",
};
const ESTADO_BADGE: Record<string, "info" | "warning" | "success" | "gray"> = {
  en_proceso: "info", pausado: "warning", completado: "success", cancelado: "gray",
};

export default async function FabricacionPage() {
  const supabase = await createClient();

  const [{ data: producciones }, { data: recetas }] = await Promise.all([
    supabase.from("producciones")
      .select("*, recetas(nombre)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("recetas")
      .select("*, receta_ingredientes(costo_unitario, cantidad)")
      .order("nombre"),
  ]);

  const activas = (producciones ?? []).filter((p: any) => p.estado === "en_proceso" || p.estado === "pausado");
  const finalizadas = (producciones ?? []).filter((p: any) => p.estado === "completado" || p.estado === "cancelado");

  return (
    <div className="page-container">
      <PageHeader
        title="Fabricación"
        subtitle="Recetas y producciones"
        action={
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/fabricacion/recetas/nueva" style={{ display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              + Nueva receta
            </Link>
            <Link href="/fabricacion/producciones/nueva" style={{ display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "var(--brand)", color: "#fff", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
              + Nueva producción
            </Link>
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Producciones activas */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            Producciones activas
            <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px 10px" }}>
              {activas.length}
            </span>
          </div>

          {activas.length === 0 ? (
            <Card>
              <EmptyState icon="⚙" title="Sin producciones activas" description="Iniciá una nueva producción para verla aquí." action={<Link href="/fabricacion/producciones/nueva" style={{ color: "var(--brand)", fontSize: "13px" }}>Nueva producción →</Link>} />
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
              {activas.map((p: any) => {
                const etapa = p.etapa_actual ?? 0;
                const pct = Math.round((etapa / 5) * 100);
                const ETAPAS = ["Lijado", "Pintado", "Pegado", "Detalles", "Embalado"];
                return (
                  <Link key={p.id} href={`/fabricacion/producciones/${p.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{p.nombre}</div>
                          {p.recetas && <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>Receta: {p.recetas.nombre}</div>}
                        </div>
                        <Badge variant={ESTADO_BADGE[p.estado]}>{ESTADO_LABEL[p.estado]}</Badge>
                      </div>

                      {/* Barra de progreso */}
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-2)", marginBottom: "6px" }}>
                          <span>{etapa < 5 ? `Etapa: ${ETAPAS[etapa] ?? "—"}` : "Todas las etapas completadas"}</span>
                          <span style={{ fontWeight: 600, color: pct === 100 ? "#16a34a" : "var(--brand)" }}>{pct}%</span>
                        </div>
                        <div style={{ height: "8px", background: "var(--surface-2)", borderRadius: "100px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: "100px",
                            width: `${pct}%`,
                            background: pct === 100 ? "#16a34a" : pct >= 60 ? "var(--brand)" : "#f59e0b",
                            transition: "width 0.3s ease",
                          }} />
                        </div>
                      </div>

                      {p.fecha_inicio && (
                        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
                          Inicio: {new Date(p.fecha_inicio).toLocaleDateString("es-AR")}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          {/* Recetas */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              Recetas
              <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px 10px" }}>
                {recetas?.length ?? 0}
              </span>
            </div>
            <Card padding="0">
              {!recetas || recetas.length === 0 ? (
                <div style={{ padding: "28px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>
                  Sin recetas. <Link href="/fabricacion/recetas/nueva" style={{ color: "var(--brand)" }}>Crear una →</Link>
                </div>
              ) : (
                recetas.map((r: any, i: number) => {
                  const costoTotal = (r.receta_ingredientes ?? []).reduce(
                    (s: number, ing: any) => s + ing.cantidad * ing.costo_unitario, 0
                  );
                  return (
                    <Link key={r.id} href={`/fabricacion/recetas/${r.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ padding: "12px 16px", borderBottom: i < recetas.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{r.nombre}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                            {r.receta_ingredientes?.length ?? 0} ingredientes · por {r.unidad_producida}
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand)" }}>{pesos(costoTotal)}</div>
                      </div>
                    </Link>
                  );
                })
              )}
            </Card>
          </div>

          {/* Historial */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>Historial</div>
            <Card padding="0">
              {finalizadas.length === 0 ? (
                <div style={{ padding: "28px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>Sin producciones finalizadas.</div>
              ) : (
                finalizadas.map((p: any, i: number) => {
                  const etapa = p.etapa_actual ?? 0;
                  const pct = Math.round((etapa / 5) * 100);
                  return (
                    <Link key={p.id} href={`/fabricacion/producciones/${p.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ padding: "12px 16px", borderBottom: i < finalizadas.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{p.nombre}</div>
                          <Badge variant={ESTADO_BADGE[p.estado]}>{ESTADO_LABEL[p.estado]}</Badge>
                        </div>
                        <div style={{ height: "4px", background: "var(--surface-2)", borderRadius: "100px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: p.estado === "completado" ? "#16a34a" : "var(--border-2)", borderRadius: "100px" }} />
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "4px" }}>{etapa} de 5 etapas</div>
                      </div>
                    </Link>
                  );
                })
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
