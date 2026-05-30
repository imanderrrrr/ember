import { NextResponse } from "next/server";
import { getStatus } from "@/app/status/_lib/status";

/**
 * Endpoint PÚBLICO de estatus (sin sesión, a diferencia de los demás proxies
 * en `/api/*`). Lo consume el poller de la página `/status` cada ~60s. Hace el
 * chequeo en vivo de los tres componentes y registra el sondeo vía la API.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const status = await getStatus();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
