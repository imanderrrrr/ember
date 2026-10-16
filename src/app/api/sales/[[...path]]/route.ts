import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthHeaders } from "@/lib/server-token";

/**
 * Proxy autenticado para `/api/sales/*` → api Hono `/sales/*`.
 * Reenvía Bearer JWT con identidad y rol para validación y RBAC.
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
  const target = `${API_URL}/sales${segments ? "/" + segments : ""}${url.search}`;

  const headers = await getAuthHeaders(session);
  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }

  const res = await fetch(target, init).catch((err) => {
    console.error("[sales proxy] fetch failed:", err);
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
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
