import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthHeaders } from "@/lib/server-token";

/**
 * POST /api/lock/verify
 *
 * Proxy autenticado: lee la sesión Auth.js para obtener el userId, luego
 * delega al api (`/auth/verify-pin`) la validación del PIN contra argon2
 * con token firmado de autenticación.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { pin?: string };
  const pin = body.pin;
  if (!pin || !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "invalid_pin_format" }, { status: 400 });
  }

  const apiUrl = process.env.API_URL ?? "http://api:3001";
  const headers = await getAuthHeaders(session);
  const res = await fetch(`${apiUrl}/auth/verify-pin`, {
    method: "POST",
    headers,
    body: JSON.stringify({ userId: session.user.id, pin }),
  }).catch((err) => {
    console.error("[lock/verify] api fetch failed:", err);
    return null;
  });

  if (!res || !res.ok) {
    return NextResponse.json({ error: "invalid_pin" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
