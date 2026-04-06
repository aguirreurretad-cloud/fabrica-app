"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Textarea, FormRow, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

export default function NuevoProductoPage() {
  const router = useRouter();
  const supabase = createClient() as any;
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    (supabase as any).from("categorias").select("id, nombre").order("nombre")
      .then(({ data }: { data: any }) => setCategorias(data ?? []));
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    nombre: "", descripcion: "", categoria_id: "",
    precio_venta: "", precio_mayorista: "", precio_mayorista_max: "",
    cantidad_mayorista_max: "", precio_costo: "", stock_minimo: "10",
  });
  const [cantidadAutoDetectada, setCantidadAutoDetectada] = useState(false);

  function detectarCantidad(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes("mate")) return "100";
    if (n.includes("bombilla")) return "600";
    return "";
  }

  const [variantes, setVariantes] = useState<{ talla: string; color: string; stock: string }[]>([]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function addVariante() {
    setVariantes((v) => [...v, { talla: "", color: "", stock: "0" }]);
  }

  function removeVariante(i: number) {
    setVariantes((v) => v.filter((_, idx) => idx !== i));
  }

  function setVariante(i: number, field: string, value: string) {
    setVariantes((v) => v.map((va, idx) => idx === i ? { ...va, [field]: value } : va));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setLoading(true);
    setError("");

    let foto_url: string | null = null;

    // Upload foto si hay
    if (fotoFile) {
      const ext = fotoFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("productos")
        .upload(path, fotoFile, { upsert: true });
      if (uploadError) {
        setError("Error al subir la foto.");
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("productos").getPublicUrl(uploadData.path);
      foto_url = publicUrl;
    }

    // Insertar producto
    const { data: prod, error: prodError } = await (supabase as any)
      .from("productos")
      .insert({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion || null,
        categoria_id: form.categoria_id || null,
        precio_venta: parseFloat(form.precio_venta) || 0,
        precio_mayorista: parseFloat(form.precio_mayorista) || null,
        precio_mayorista_max: parseFloat(form.precio_mayorista_max) || null,
        cantidad_mayorista_max: parseInt(form.cantidad_mayorista_max) || null,
        precio_costo: parseFloat(form.precio_costo) || null,
        stock_minimo: parseInt(form.stock_minimo) || 10,
        foto_url,
        activo: true,
      })
      .select()
      .single();

    if (prodError || !prod) {
      setError("Error al guardar el producto.");
      setLoading(false);
      return;
    }

    // Insertar variantes
    if (variantes.length > 0) {
      await (supabase as any).from("producto_variantes").insert(
        variantes.map((v) => ({
          producto_id: prod.id,
          talla: v.talla || null,
          color: v.color || null,
          stock: parseInt(v.stock) || 0,
        }))
      );
    }

    router.push("/productos");
    router.refresh();
  }

  return (
    <div className="page-container" style={{ maxWidth: "720px" }}>
      <PageHeader
        title="Nuevo producto"
        subtitle="Completá la ficha del producto"
        action={
          <Link href="/productos" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>
            ← Volver
          </Link>
        }
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Foto */}
        <Card>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
            Foto del producto
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100px", height: "100px",
                background: previewUrl ? "transparent" : "var(--surface-2)",
                border: "2px dashed var(--border)",
                borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden", flexShrink: 0,
                transition: "border-color 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "28px", opacity: 0.4 }}>📷</span>
              )}
            </div>
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                {previewUrl ? "Cambiar foto" : "Subir foto"}
              </Button>
              <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "6px" }}>
                JPG, PNG o WEBP. Máx 5MB.<br />Se puede agregar desde el celular.
              </p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
        </Card>

        {/* Datos */}
        <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
            Información del producto
          </div>

          <FormRow>
            <Input label="Nombre *" value={form.nombre}
              onChange={(e) => {
                const nombre = e.target.value;
                set("nombre", nombre);
                if (!cantidadAutoDetectada) {
                  const det = detectarCantidad(nombre);
                  if (det) set("cantidad_mayorista_max", det);
                }
              }} placeholder="Ej: Mate con bombilla" />
            <Select label="Categoría" value={form.categoria_id} onChange={(e) => set("categoria_id", e.target.value)}>
              <option value="">— Sin categoría —</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </FormRow>

          <Textarea label="Descripción" value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Material, características..." />

          <FormRow>
            <Input label="Precio al por menor ($)" type="number" value={form.precio_venta}
              onChange={(e) => set("precio_venta", e.target.value)} placeholder="3500" />
            <Input label="Precio al por mayor ($)" type="number" value={form.precio_mayorista}
              onChange={(e) => set("precio_mayorista", e.target.value)} placeholder="2800" />
          </FormRow>

          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-2)" }}>Precio mayorista máx</div>
            <FormRow>
              <Input label="Precio ($)" type="number" value={form.precio_mayorista_max}
                onChange={(e) => set("precio_mayorista_max", e.target.value)} placeholder="2200" />
              <div>
                <Input
                  label="Cantidad mínima"
                  type="number"
                  value={form.cantidad_mayorista_max}
                  onChange={(e) => { set("cantidad_mayorista_max", e.target.value); setCantidadAutoDetectada(true); }}
                  placeholder="100"
                />
                {form.cantidad_mayorista_max && !cantidadAutoDetectada && (
                  <div style={{ fontSize: "11px", color: "var(--brand)", marginTop: "4px" }}>
                    ✓ Auto-detectado por nombre
                  </div>
                )}
              </div>
            </FormRow>
            <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
              Aplica cuando el pedido supera la cantidad mínima (ej: Mate ≥ 100 u · Bombilla ≥ 600 u)
            </div>
          </div>

          <FormRow>
            <Input label="Precio de costo ($)" type="number" value={form.precio_costo}
              onChange={(e) => set("precio_costo", e.target.value)} placeholder="1800" />
            <Input label="Stock mínimo (alerta)" type="number" value={form.stock_minimo}
              onChange={(e) => set("stock_minimo", e.target.value)} placeholder="10" />
          </FormRow>
        </Card>

        {/* Variantes */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Variantes</div>
              <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>Talle, color, modelo, etc.</div>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addVariante}>+ Agregar</Button>
          </div>

          {variantes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontSize: "13px", color: "var(--text-3)" }}>
              Sin variantes. Hacé clic en "+ Agregar" para sumar una.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 32px", gap: "10px", paddingBottom: "6px", borderBottom: "1px solid var(--border)" }}>
                {["Talle", "Color / modelo", "Stock", ""].map((h) => (
                  <div key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                ))}
              </div>
              {variantes.map((v, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 32px", gap: "10px", alignItems: "center" }}>
                  <Input value={v.talla} placeholder="M, XL, Único…"
                    onChange={(e) => setVariante(i, "talla", e.target.value)} />
                  <Input value={v.color} placeholder="Negro, Azul…"
                    onChange={(e) => setVariante(i, "color", e.target.value)} />
                  <Input type="number" value={v.stock} placeholder="0"
                    onChange={(e) => setVariante(i, "stock", e.target.value)} />
                  <button type="button" onClick={() => removeVariante(i)}
                    style={{ width: "28px", height: "28px", border: "1px solid var(--border)", borderRadius: "6px", background: "transparent", cursor: "pointer", color: "var(--text-3)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {error && (
          <div style={{
            background: "var(--danger-bg)", border: "1px solid #fecaca",
            borderRadius: "var(--radius)", padding: "10px 12px",
            fontSize: "13px", color: "var(--danger)",
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Link href="/productos"><Button variant="secondary" type="button">Cancelar</Button></Link>
          <Button variant="primary" type="submit" loading={loading}>Guardar producto</Button>
        </div>
      </form>
    </div>
  );
}
