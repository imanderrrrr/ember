import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Proxy autenticado para todo `/api/salon/*`.
 *
 * Reglas:
 *  - Verifica que haya sesión Auth.js. Sin ella, 401 sin tocar el api.
 *  - Reenvía method/body al api Hono via `API_URL`.
 *  - Devuelve el body crudo del api con su status — no transforma errores.
 *
 * Nota: para Fase 2 cualquier usuario autenticado puede editar el salón.
 * Cuando agreguemos RBAC vamos a chequear `session.user.role` aquí.
 */

const API_URL = process.env.API_URL ?? "http://api:3001";

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const url = new URL(req.url);
  const target = `${API_URL}/salon/${path.join("/")}${url.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: { "Content-Type": "application/json" },
  };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }

  const res = await fetch(target, init).catch((err) => {
    console.error("[salon proxy] fetch failed:", err);
    return null;
  });
  if (!res) {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
