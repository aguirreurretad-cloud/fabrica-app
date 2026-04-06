import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapearTracking } from "@/lib/correo/scraper";

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
