"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Select, Textarea, FormRow, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

export default function EditarClientePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "", dni: "", email: "", telefono: "",
    direccion: "", ciudad: "", provincia: "",
    tipo: "minorista", notas: "",
  });

  useEffect(() => {
    (supabase as any).from("clientes").select("*").eq("id", id).single()
      .then(({ data }: { data: any }) => {
        if (data) {
          setForm({
            nombre: data.nombre ?? "",
            dni: data.cuit ?? "",
            email: data.email ?? "",
            telefono: data.telefono ?? "",
            direccion: data.direccion ?? "",
            ciudad: data.ciudad ?? "",
            provincia: data.provincia ?? "",
            tipo: data.tipo ?? "minorista",
            notas: data.notas ?? "",
          });
        }
        setLoadingData(false);
      });
  }, [id]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setLoading(true);
    setError("");

    const { error } = await (supabase as any).from("clientes").update({
      nombre: form.nombre.trim(),
      cuit: form.dni || null,
      email: form.email || null,
      telefono: form.telefono || null,
      direccion: form.direccion || null,
      ciudad: form.ciudad || null,
      provincia: form.provincia || null,
      tipo: form.tipo,
      notas: form.notas || null,
    }).eq("id", id);

    if (error) {
      setError("Error al guardar. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    router.push(`/clientes/${id}`);
    router.refresh();
  }

  if (loadingData) {
    return (
      <div className="page-container" style={{ maxWidth: "680px" }}>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "680px" }}>
      <PageHeader
        title="Editar cliente"
        subtitle={form.nombre}
        action={
          <Link href={`/clientes/${id}`} style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>
            ← Volver
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <FormRow>
            <Input label="Nombre / Empresa *" value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)} placeholder="Ej: Modas Sol" required />
            <Input label="DNI" value={form.dni}
              onChange={(e) => set("dni", e.target.value)} placeholder="12345678" />
          </FormRow>

          <FormRow>
            <Input label="Email" type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)} placeholder="contacto@empresa.com" />
            <Input label="Teléfono" value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)} placeholder="351-555-0000" />
          </FormRow>

          <FormRow>
            <Input label="Ciudad" value={form.ciudad}
              onChange={(e) => set("ciudad", e.target.value)} placeholder="Córdoba" />
            <Input label="Provincia" value={form.provincia}
              onChange={(e) => set("provincia", e.target.value)} placeholder="Córdoba" />
          </FormRow>

          <Select label="Tipo de cliente" value={form.tipo}
            onChange={(e) => set("tipo", e.target.value)}>
            <option value="mayorista">Mayorista</option>
            <option value="minorista">Minorista</option>
            <option value="ocasional">Ocasional</option>
          </Select>

          <Textarea label="Notas internas" value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            placeholder="Condiciones de pago, preferencias, etc." />

          {error && (
            <div style={{
              background: "var(--danger-bg)", border: "1px solid #fecaca",
              borderRadius: "var(--radius)", padding: "10px 12px",
              fontSize: "13px", color: "var(--danger)",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <Link href={`/clientes/${id}`}>
              <Button variant="secondary" type="button">Cancelar</Button>
            </Link>
            <Button variant="primary" type="submit" loading={loading}>
              Guardar cambios
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
