import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Movimiento { fecha: string; planta: string; historia: string; }

function inferirEstado(historia: string): string {
  const h = historia.toUpperCase();
  if (h.includes("ENTREGADO") || h.includes("ENTREGA"))    return "Entregado";
  if (h.includes("SUCURSAL")  || h.includes("DISPONIBLE")) return "En sucursal";
  if (h.includes("DEVOLUCI"))                              return "Devuelto";
  if (h.includes("REZAGO"))                                return "Demorado";
  return "En camino";
}

export async function scrapearTracking(
  numero: string
): Promise<{ movimientos: Movimiento[]; estado: string; detalle: string; fecha?: string } | null> {
  const chromium = await import("@sparticuz/chromium");
  const { chromium: playwrightChromium } = await import("playwright-core");

  const browser = await playwrightChromium.launch({
    args: chromium.default.args,
    executablePath: await chromium.default.executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();

    await page.goto("https://www.correoargentino.com.ar/formularios/e-commerce", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    await page.fill('input[name="id"]', numero);

    await Promise.all([
      page.waitForLoadState("networkidle", { timeout: 20000 }),
      page.click('button[type="submit"], input[type="submit"]').catch(() =>
        page.keyboard.press("Enter")
      ),
    ]);

    await page.waitForSelector("tbody tr", { timeout: 15000 });

    const movimientos: Movimiento[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("tbody tr")).map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        return {
          fecha:    cells[0]?.textContent?.trim() ?? "",
          planta:   cells[1]?.textContent?.trim() ?? "",
          historia: cells[2]?.textContent?.trim() ?? "",
        };
      }).filter((m) => m.historia.length > 0);
    });

    if (movimientos.length === 0) return null;

    const ultimo = movimientos[0];
    return {
      movimientos,
      estado: inferirEstado(ultimo.historia),
      detalle: `${ultimo.historia} — ${ultimo.planta}`,
      fecha: ultimo.fecha,
    };
  } finally {
    await browser.close();
  }
}

export async function GET(request: NextRequest) {
  const tracking = request.nextUrl.searchParams.get("tracking");
  if (!tracking) {
    return NextResponse.json({ estado: "Error", detalle: "Número requerido.", movimientos: [] }, { status: 400 });
  }

  const numero = tracking.trim().replace(/[\s.\-]/g, "");

  try {
    const resultado = await scrapearTracking(numero);

    if (!resultado) {
      return NextResponse.json({
        estado: "Sin datos",
        detalle: "Sin movimientos registrados aún. El paquete puede estar siendo procesado.",
        movimientos: [],
      });
    }

    // Guardar/actualizar en envios_seguimiento
    const supabase = await createClient();
    await (supabase as any).from("envios_seguimiento").upsert(
      {
        tracking_number: numero,
        estado: resultado.estado,
        detalle: resultado.detalle,
        last_checked_at: new Date().toISOString(),
      },
      { onConflict: "tracking_number" }
    );

    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({
      estado: "Sin conexión",
      detalle: "No se pudo consultar Correo Argentino.",
      movimientos: [],
      sugerencia: `Consultá manualmente: https://www.correoargentino.com.ar/formularios/e-commerce — número: ${numero}`,
    });
  }
}
