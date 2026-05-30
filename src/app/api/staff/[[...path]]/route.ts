import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Proxy autenticado para `/api/staff/*` → api Hono `/staff/*`.
 * Usado por el wizard de reservas para listar meseros.
 */

const API_URL = process.env.API_URL ?? "http://api:3001";

async function proxy(
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const url = new URL(req.url);
  const segments = path && path.length > 0 ? path.join("/") : "";
  const target = `${API_URL}/staff${segments ? "/" + segments : ""}${url.search}`;

  const res = await fetch(target, { cache: "no-store" }).catch((err) => {
    console.error("[staff proxy] fetch failed:", err);
    return null;
  });
  if (!res) {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export const GET = proxy;
