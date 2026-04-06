"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function GenerarPDF({ presupuesto }: { presupuesto: any }) {
  const [loading, setLoading] = useState(false);

  async function handleDescargar() {
    setLoading(true);
    try {
      // Importar dinámicamente solo cuando el usuario hace clic
      const { pdf, Document, Page, Text, View, StyleSheet, Image } = await import("@react-pdf/renderer");

      const cliente = presupuesto.clientes;
      const items = presupuesto.presupuesto_items ?? [];
      const descuentoMonto = presupuesto.subtotal * (presupuesto.descuento / 100);
      const baseIva = presupuesto.subtotal - descuentoMonto;
      const ivaMonto = baseIva * (presupuesto.iva / 100);
      const fecha = new Date(presupuesto.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
      const vencimiento = new Date(new Date(presupuesto.created_at).getTime() + presupuesto.validez_dias * 86400000)
        .toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });

      const ESTADO_LABEL: Record<string, string> = {
        borrador: "BORRADOR", enviado: "ENVIADO", aprobado: "APROBADO", rechazado: "RECHAZADO",
      };
      const ESTADO_COLORES: Record<string, { bg: string; text: string }> = {
        borrador: { bg: "#f1f0e8", text: "#5f5e5a" },
        enviado:  { bg: "#e6f1fb", text: "#185fa5" },
        aprobado: { bg: "#eaf3de", text: "#3b6d11" },
        rechazado:{ bg: "#fcebeb", text: "#a32d2d" },
      };
      const estadoColor = ESTADO_COLORES[presupuesto.estado] ?? ESTADO_COLORES.borrador;

      const styles = StyleSheet.create({
        page: { fontFamily: "Helvetica", fontSize: 10, color: "#1a1a2e", padding: "40 50", backgroundColor: "#ffffff" },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
        logo: { width: 65, height: 65, objectFit: "contain" },
        headerRight: { alignItems: "flex-end" },
        presupTitulo: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#1a1a2e", marginBottom: 3 },
        presupNum: { fontSize: 13, color: "#2563eb", fontFamily: "Helvetica-Bold", marginBottom: 5 },
        presupFecha: { fontSize: 9, color: "#94a3b8" },
        estadoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 5 },
        estadoText: { fontSize: 8, fontFamily: "Helvetica-Bold" },
        infoGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
        infoCard: { flex: 1, backgroundColor: "#f8f9fc", borderRadius: 6, padding: "12 14" },
        infoLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontFamily: "Helvetica-Bold" },
        infoTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1a1a2e", marginBottom: 5 },
        infoRow: { flexDirection: "row", marginBottom: 3 },
        infoKey: { fontSize: 9, color: "#94a3b8", width: 55 },
        infoVal: { fontSize: 9, color: "#475569", flex: 1 },
        tableHeader: { flexDirection: "row", backgroundColor: "#0a0a0a", padding: "8 12", borderRadius: 4 },
        tableRow: { flexDirection: "row", padding: "9 12", borderBottomWidth: 1, borderBottomColor: "#f1f3f9" },
        tableRowAlt: { backgroundColor: "#f8f9fc" },
        thDesc: { flex: 3, color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
        thCant: { width: 45, color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center" },
        thPrice: { width: 80, color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },
        thSub: { width: 80, color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },
        tdDesc: { flex: 3, fontSize: 10, color: "#1a1a2e" },
        tdCant: { width: 45, fontSize: 10, color: "#475569", textAlign: "center" },
        tdPrice: { width: 80, fontSize: 10, color: "#475569", textAlign: "right" },
        tdSub: { width: 80, fontSize: 10, color: "#1a1a2e", fontFamily: "Helvetica-Bold", textAlign: "right" },
        totalesSection: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
        totalesBox: { width: 210 },
        totalesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
        totalesLabel: { fontSize: 9, color: "#94a3b8" },
        totalesVal: { fontSize: 9, color: "#475569" },
        totalFinalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: "#2563eb", paddingTop: 7, marginTop: 5 },
        totalFinalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
        totalFinalVal: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#2563eb" },
        notasBox: { backgroundColor: "#eff6ff", borderLeftWidth: 3, borderLeftColor: "#2563eb", padding: "9 12", borderRadius: 4, marginTop: 18 },
        notasLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#2563eb", marginBottom: 3, textTransform: "uppercase" },
        notasText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },
        validezBox: { backgroundColor: "#f8f9fc", borderRadius: 5, padding: "7 10", marginTop: 7 },
        validezText: { fontSize: 9, color: "#94a3b8" },
        footer: { position: "absolute", bottom: 28, left: 50, right: 50 },
        footerLine: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
        footerText: { fontSize: 8, color: "#94a3b8" },
      });

      const doc = (
        <Document title={`Presupuesto STB #${presupuesto.numero}`}>
          <Page size="A4" style={styles.page}>
            <View style={styles.header}>
              <Image style={styles.logo} src={window.location.origin + "/logo-stb.png"} />
              <View style={styles.headerRight}>
                <Text style={styles.presupTitulo}>Presupuesto</Text>
                <Text style={styles.presupNum}>#{String(presupuesto.numero).padStart(4, "0")}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: estadoColor.bg }]}>
                  <Text style={[styles.estadoText, { color: estadoColor.text }]}>{ESTADO_LABEL[presupuesto.estado]}</Text>
                </View>
                <Text style={styles.presupFecha}>Emitido: {fecha}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Cliente</Text>
                <Text style={styles.infoTitle}>{cliente?.nombre ?? "—"}</Text>
                {cliente?.cuit ? <View style={styles.infoRow}><Text style={styles.infoKey}>CUIT</Text><Text style={styles.infoVal}>{cliente.cuit}</Text></View> : null}
                {cliente?.email ? <View style={styles.infoRow}><Text style={styles.infoKey}>Email</Text><Text style={styles.infoVal}>{cliente.email}</Text></View> : null}
                {cliente?.ciudad ? <View style={styles.infoRow}><Text style={styles.infoKey}>Ciudad</Text><Text style={styles.infoVal}>{[cliente.ciudad, cliente.provincia].filter(Boolean).join(", ")}</Text></View> : null}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Datos del presupuesto</Text>
                <View style={styles.infoRow}><Text style={styles.infoKey}>Número</Text><Text style={styles.infoVal}>#{String(presupuesto.numero).padStart(4, "0")}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoKey}>Emisión</Text><Text style={styles.infoVal}>{fecha}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoKey}>Vence</Text><Text style={styles.infoVal}>{vencimiento}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoKey}>IVA</Text><Text style={styles.infoVal}>{presupuesto.iva}%</Text></View>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={styles.thDesc}>Descripción</Text>
              <Text style={styles.thCant}>Cant.</Text>
              <Text style={styles.thPrice}>Precio unit.</Text>
              <Text style={styles.thSub}>Subtotal</Text>
            </View>

            {items.map((item: any, i: number) => (
              <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={styles.tdDesc}>{item.descripcion}</Text>
                <Text style={styles.tdCant}>{item.cantidad}</Text>
                <Text style={styles.tdPrice}>{pesos(item.precio_unitario)}</Text>
                <Text style={styles.tdSub}>{pesos(item.subtotal)}</Text>
              </View>
            ))}

            <View style={styles.totalesSection}>
              <View style={styles.totalesBox}>
                <View style={styles.totalesRow}>
                  <Text style={styles.totalesLabel}>Subtotal</Text>
                  <Text style={styles.totalesVal}>{pesos(presupuesto.subtotal)}</Text>
                </View>
                {presupuesto.descuento > 0 ? (
                  <View style={styles.totalesRow}>
                    <Text style={styles.totalesLabel}>Descuento ({presupuesto.descuento}%)</Text>
                    <Text style={styles.totalesVal}>- {pesos(descuentoMonto)}</Text>
                  </View>
                ) : null}
                <View style={styles.totalesRow}>
                  <Text style={styles.totalesLabel}>IVA ({presupuesto.iva}%)</Text>
                  <Text style={styles.totalesVal}>{pesos(ivaMonto)}</Text>
                </View>
                <View style={styles.totalFinalRow}>
                  <Text style={styles.totalFinalLabel}>TOTAL</Text>
                  <Text style={styles.totalFinalVal}>{pesos(presupuesto.total)}</Text>
                </View>
              </View>
            </View>

            {presupuesto.notas ? (
              <View style={styles.notasBox}>
                <Text style={styles.notasLabel}>Notas y condiciones</Text>
                <Text style={styles.notasText}>{presupuesto.notas}</Text>
              </View>
            ) : null}

            <View style={styles.validezBox}>
              <Text style={styles.validezText}>
                Este presupuesto tiene validez hasta el {vencimiento}. Precios en pesos argentinos (ARS).
              </Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerLine}>
                <Text style={styles.footerText}>STB — Fábrica Textil</Text>
                <Text style={styles.footerText}>Presupuesto #{String(presupuesto.numero).padStart(4, "0")} · {fecha}</Text>
              </View>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Presupuesto-STB-${String(presupuesto.numero).padStart(4, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el PDF. Verificá que esté instalado @react-pdf/renderer con npm install.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDescargar} loading={loading}>
      {loading ? "Generando PDF..." : "⬇ Descargar PDF"}
    </Button>
  );
}
