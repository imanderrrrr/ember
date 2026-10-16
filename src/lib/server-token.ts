import "server-only";
import crypto from "node:crypto";
import type { Session } from "next-auth";
import { auth } from "@/auth";

function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString("base64url");
}

export function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "dev-secret-change-me-with-openssl-rand-base64-32"
  );
}

export interface ServerTokenPayload {
  sub: string;
  role: string;
  email?: string;
  name?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Genera un token JWT (HS256) firmado con AUTH_SECRET para comunicar
 * de forma segura el frontend Next.js con la API Hono.
 */
export function signServerToken(
  payload: ServerTokenPayload,
  expiresInSeconds = 120,
): string {
  const secret = getAuthSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Obtiene las cabeceras HTTP necesarias para comunicarse con la API Hono.
 * Incluye Authorization: Bearer <JWT> con la identidad y rol del usuario en sesión,
 * o un token de servicio del sistema si no hay sesión activa en un contexto servidor.
 */
export async function getAuthHeaders(
  sessionOverride?: Session | null,
): Promise<Record<string, string>> {
  const session =
    sessionOverride !== undefined
      ? sessionOverride
      : ((await auth()) as Session | null);
  const secret = getAuthSecret();

  if (session?.user?.id) {
    const token = signServerToken({
      sub: session.user.id,
      role: (session.user as { role?: string }).role || "mesero",
      email: session.user.email || "",
      name: session.user.name || "",
    });

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-internal-secret": secret,
    };
  }

  // Token de servicio del sistema para llamadas internas de servidor sin usuario específico
  const systemToken = signServerToken({
    sub: "system-internal",
    role: "admin",
    name: "System Internal Service",
  });

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${systemToken}`,
    "x-internal-secret": secret,
  };
}
