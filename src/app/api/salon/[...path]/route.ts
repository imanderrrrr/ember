import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthHeaders } from "@/lib/server-token";

/**
 * Proxy autenticado para `/api/salon/*` con control de acceso basado en roles (RBAC).
 *
 * Reglas de autorización (RBAC):
 *  - GET: Cualquier usuario autenticado puede consultar el salón y plano.
 *  - POST / DELETE / PATCH en zonas y figuras: Exclusivo para 'gerente_operativo' y 'admin'.
 *  - POST / DELETE en mesas: Exclusivo para 'gerente_operativo' y 'admin'.
 *  - PATCH en mesas:
 *      * Gerencia/Admin: control total (geometría, rotación, capacidad, zona, estado).
 *      * Meseros/Cajeros/Hosts: únicamente ficha operativa (status, customerName, partySize, notes).
 *        Cualquier intento de alterar coordenadas o layout es bloqueado con 403.
 */

const API_URL = process.env.API_URL ?? "http://api:3001";

const LAYOUT_PROPERTIES = new Set([
  "zoneId",
  "label",
  "shape",
  "x",
  "y",
  "width",
  "height",
  "seats",
  "rotation",
]);

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role || "mesero";
  const isManager = role === "gerente_operativo" || role === "admin";
  const { path } = await ctx.params;
  const rootResource = path[0] ?? "";

  // Control RBAC en Proxy
  if (req.method !== "GET") {
    if (rootResource === "zones" || rootResource === "shapes") {
      if (!isManager) {
        return NextResponse.json(
          {
            error: "forbidden",
            message: `El rol '${role}' no tiene permisos para modificar la arquitectura del salón`,
          },
          { status: 403 },
        );
      }
    } else if (rootResource === "tables") {
      if (req.method === "POST" || req.method === "DELETE") {
        if (!isManager) {
          return NextResponse.json(
            {
              error: "forbidden",
              message: `El rol '${role}' no tiene permisos para crear o eliminar mesas del salón`,
            },
            { status: 403 },
          );
        }
      }
    }
  }

  let bodyText: string | undefined;
  if (req.method !== "GET" && req.method !== "DELETE") {
    bodyText = await req.text();

    // Verificación de campos de layout en PATCH a mesas para roles no administrativos
    if (req.method === "PATCH" && rootResource === "tables" && !isManager && bodyText) {
      try {
        const parsed = JSON.parse(bodyText);
        const attemptedLayoutKeys = Object.keys(parsed).filter((k) =>
          LAYOUT_PROPERTIES.has(k),
        );
        if (attemptedLayoutKeys.length > 0) {
          return NextResponse.json(
            {
              error: "forbidden",
              message: `El rol '${role}' no tiene permisos para modificar la distribución o estructura física de la mesa (${attemptedLayoutKeys.join(", ")})`,
            },
            { status: 403 },
          );
        }
      } catch {
        // En caso de body malformado, dejamos que el backend retorne 400
      }
    }
  }

  const url = new URL(req.url);
  const target = `${API_URL}/salon/${path.join("/")}${url.search}`;

  const headers = await getAuthHeaders(session);
  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (bodyText !== undefined) {
    init.body = bodyText;
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
