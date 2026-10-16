import type { Context, Next } from "hono";
import { verify } from "hono/jwt";

export interface TokenPayload {
  sub: string;
  role: string;
  email?: string;
  name?: string;
  exp: number;
  [key: string]: unknown;
}

declare module "hono" {
  interface ContextVariableMap {
    user: TokenPayload;
  }
}

export function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "dev-secret-change-me-with-openssl-rand-base64-32"
  );
}

/**
 * Middleware de autenticación Bearer Token (JWT HS256).
 * Verifica que la petición contenga un token válido firmado con AUTH_SECRET.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "unauthorized",
        message: "Cabecera Authorization con Bearer token requerida",
      },
      401,
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return c.json(
      {
        error: "unauthorized",
        message: "Token no proporcionado",
      },
      401,
    );
  }

  try {
    const payload = (await verify(
      token,
      getAuthSecret(),
      "HS256",
    )) as unknown as TokenPayload;

    if (!payload.sub || !payload.role) {
      return c.json(
        {
          error: "invalid_token",
          message: "El payload del token carece de 'sub' o 'role'",
        },
        401,
      );
    }

    c.set("user", payload);
    await next();
  } catch {
    return c.json(
      {
        error: "invalid_token",
        message: "Token inválido, expirado o firma incorrecta",
      },
      401,
    );
  }
}

/**
 * Middleware RBAC (Role-Based Access Control).
 * Permite el acceso únicamente a los roles especificados, además de 'admin' y 'system-internal'.
 */
export function requireRoles(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        {
          error: "unauthorized",
          message: "Usuario no autenticado en el contexto",
        },
        401,
      );
    }

    if (
      user.role === "admin" ||
      user.role === "system-internal" ||
      allowedRoles.includes(user.role)
    ) {
      return await next();
    }

    return c.json(
      {
        error: "forbidden",
        message: `El rol '${user.role}' no tiene permisos para esta acción`,
        allowedRoles,
      },
      403,
    );
  };
}

/**
 * Middleware para endpoints internos del sistema (ej. /auth/verify invocado por NextAuth).
 * Valida la cabecera 'x-internal-secret' contra AUTH_SECRET.
 */
export async function internalSecretMiddleware(c: Context, next: Next) {
  const secretHeader = c.req.header("x-internal-secret");
  const expectedSecret = getAuthSecret();

  if (!secretHeader || secretHeader !== expectedSecret) {
    return c.json(
      {
        error: "unauthorized_service",
        message: "Acceso no autorizado a endpoint interno de servicio",
      },
      401,
    );
  }

  await next();
}
