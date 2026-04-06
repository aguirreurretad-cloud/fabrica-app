import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapearTracking } from "@/lib/correo/scraper";

const STALE_HOURS = 12;

export async function POST() {
  const supabase = await createClient();

  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: stales } = await (supabase as any)
    .from("envios_seguimiento")
    .select("tracking_number")
    .or(`last_checked_at.is.null,last_checked_at.lt.${staleThreshold}`);

  if (!stales?.length) {
    return NextResponse.json({ actualizados: 0 });
  }

  let actualizados = 0;

  for (const envio of stales as { tracking_number: string }[]) {
    try {
      const resultado = await scrapearTracking(envio.tracking_number);
      if (resultado) {
        await (supabase as any).from("envios_seguimiento").update({
          estado: resultado.estado,
          detalle: resultado.detalle,
          last_checked_at: new Date().toISOString(),
        }).eq("tracking_number", envio.tracking_number);
        actualizados++;
      } else {
        // Marcar como chequeado aunque no haya resultado
        await (supabase as any).from("envios_seguimiento").update({
          last_checked_at: new Date().toISOString(),
        }).eq("tracking_number", envio.tracking_number);
      }
    } catch {
      // Continuar con el siguiente si uno falla
    }
  }

  return NextResponse.json({ actualizados, total: stales.length });
}
