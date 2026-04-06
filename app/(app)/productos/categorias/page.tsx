"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Textarea, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

interface Categoria { id: string; nombre: string; descripcion: string | null; count?: number; }

export default function CategoriasPage() {
  const supabase = createClient();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nueva categoría
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Edición inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editGuardando, setEditGuardando] = useState(false);

  // Borrado
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function cargar() {
    const { data: cats } = await (supabase as any)
      .from("categorias")
      .select("id, nombre, descripcion")
      .order("nombre");

    const { data: prods } = await (supabase as any)
      .from("productos")
      .select("categoria_id")
      .eq("activo", true);

    const counts: Record<string, number> = {};
    for (const p of prods ?? []) {
      if (p.categoria_id) counts[p.categoria_id] = (counts[p.categoria_id] ?? 0) + 1;
    }

    setCategorias((cats ?? []).map((c: Categoria) => ({ ...c, count: counts[c.id] ?? 0 })));
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setGuardando(true); setError("");
    const { error: err } = await (supabase as any)
      .from("categorias")
      .insert({ nombre: nombre.trim(), descripcion: descripcion.trim() || null });
    if (err) { setError("Error al guardar."); setGuardando(false); return; }
    setNombre(""); setDescripcion("");
    setGuardando(false);
    cargar();
  }

  function iniciarEdicion(cat: Categoria) {
    setEditId(cat.id);
    setEditNombre(cat.nombre);
    setEditDescripcion(cat.descripcion ?? "");
    setDeleteId(null);
  }

  async function handleGuardarEdicion() {
    if (!editNombre.trim()) return;
    setEditGuardando(true);
    await (supabase as any)
      .from("categorias")
      .update({ nombre: editNombre.trim(), descripcion: editDescripcion.trim() || null })
      .eq("id", editId);
    setEditId(null);
    setEditGuardando(false);
    cargar();
  }

  async function handleEliminar(cat: Categoria) {
    if (cat.count && cat.count > 0) return; // no borrar si tiene productos
    await (supabase as any).from("categorias").delete().eq("id", cat.id);
    setDeleteId(null);
    cargar();
  }

  return (
    <div className="page-container" style={{ maxWidth: "680px" }}>
      <PageHeader
        title="Categorías"
        subtitle="Organizá el catálogo de productos"
        action={
          <Link href="/productos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>
            ← Volver al catálogo
          </Link>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Formulario nueva categoría */}
        <Card>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "14px" }}>
            Nueva categoría
          </div>
          <form onSubmit={handleCrear} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input
              label="Nombre *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Mates, Bombillas, Accesorios"
            />
            <Textarea
              label="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve..."
            />
            {error && (
              <div style={{ fontSize: "13px", color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: "8px 12px" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" type="submit" loading={guardando}>Crear categoría</Button>
            </div>
          </form>
        </Card>

        {/* Lista de categorías */}
        <Card padding="0">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
            Categorías existentes
            <span style={{ marginLeft: "10px", fontSize: "11px", fontWeight: 400, color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px 8px" }}>
              {categorias.length}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>Cargando...</div>
          ) : categorias.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
              No hay categorías todavía. Creá una arriba.
            </div>
          ) : (
            categorias.map((cat, i) => (
              <div
                key={cat.id}
                style={{
                  borderBottom: i < categorias.length - 1 ? "1px solid var(--border)" : "none",
                  padding: "14px 20px",
                }}
              >
                {editId === cat.id ? (
                  /* Edición inline */
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Input
                      label="Nombre"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                    />
                    <Textarea
                      label="Descripción"
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                    />
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>Cancelar</Button>
                      <Button variant="primary" size="sm" loading={editGuardando} onClick={handleGuardarEdicion}>Guardar</Button>
                    </div>
                  </div>
                ) : (
                  /* Vista normal */
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{cat.nombre}</div>
                      {cat.descripcion && (
                        <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "2px" }}>{cat.descripcion}</div>
                      )}
                    </div>

                    <span style={{ fontSize: "11px", color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px 10px", whiteSpace: "nowrap" }}>
                      {cat.count} producto{cat.count !== 1 ? "s" : ""}
                    </span>

                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => iniciarEdicion(cat)}
                        style={{ padding: "5px 10px", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}
                      >
                        Editar
                      </button>

                      {deleteId === cat.id ? (
                        <>
                          <button
                            onClick={() => handleEliminar(cat)}
                            disabled={(cat.count ?? 0) > 0}
                            style={{
                              padding: "5px 10px", fontSize: "12px", border: "1px solid #fecaca",
                              borderRadius: "var(--radius)", background: "#fef2f2", color: "var(--danger)",
                              cursor: (cat.count ?? 0) > 0 ? "not-allowed" : "pointer", opacity: (cat.count ?? 0) > 0 ? 0.5 : 1,
                            }}
                          >
                            {(cat.count ?? 0) > 0 ? "Tiene productos" : "Confirmar"}
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            style={{ padding: "5px 10px", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setDeleteId(cat.id); setEditId(null); }}
                          style={{ padding: "5px 10px", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "transparent", color: "var(--text-3)", cursor: "pointer" }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
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
