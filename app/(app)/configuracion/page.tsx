"use client";

import { useState, useEffect } from "react";
import { Card, Input, Button, PageHeader } from "@/components/ui";
import Link from "next/link";

export default function ConfiguracionPage() {
  const [telBombillas, setTelBombillas] = useState("");
  const [telMates, setTelMates] = useState("");
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    setTelBombillas(localStorage.getItem("contacto_bombillas") ?? "");
    setTelMates(localStorage.getItem("contacto_mates") ?? "");
  }, []);

  function guardar() {
    localStorage.setItem("contacto_bombillas", telBombillas.trim());
    localStorage.setItem("contacto_mates", telMates.trim());
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  return (
    <div className="page-container" style={{ maxWidth: "560px" }}>
      <PageHeader
        title="Configuración"
        subtitle="Ajustes del sistema"
        action={<Link href="/dashboard" style={{ fontSize: "13px", color: "var(--text-2)", textDecoration: "none" }}>← Volver</Link>}
      />

      <Card style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Contactos para envío de pedidos por WhatsApp</div>
          <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
            Ingresá el número con código de país, sin espacios ni guiones. Ej: <strong>5491123456789</strong>
          </div>
        </div>

        <Input
          label="Proveedor / contacto de Bombillas"
          value={telBombillas}
          onChange={(e) => setTelBombillas(e.target.value)}
          placeholder="5491123456789"
        />
        <Input
          label="Proveedor / contacto de Mates"
          value={telMates}
          onChange={(e) => setTelMates(e.target.value)}
          placeholder="5491187654321"
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" onClick={guardar}>
            {guardado ? "✓ Guardado" : "Guardar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
