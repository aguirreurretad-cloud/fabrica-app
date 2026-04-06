import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NO CARGADO",
    key_start: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) ?? "NO CARGADO",
    node_env: process.env.NODE_ENV,
  });
}
