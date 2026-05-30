import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { verifySecret } from "../lib/auth.js";

const auth = new Hono();

const verifyBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /auth/verify
 *
 * Llamado por el Credentials provider de Auth.js (en el container `web`)
 * dentro de su callback `authorize()`. Devuelve el user (sin secretos) si
 * las credenciales son válidas, o 401 si no.
 *
 * No emite cookies ni JWT — eso lo hace Auth.js en el lado de `web`.
 */
auth.post("/verify", async (c) => {
  const parsed = verifyBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }

  const { email, password } = parsed.data;
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const ok = await verifySecret(user.passwordHash, password);
  if (!ok) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  // Actualizar last_login en background (no bloquear la respuesta).
  db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id))
    .catch((err) => console.error("[auth] last_login update failed:", err));

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarInitials: user.avatarInitials,
  });
});

const verifyPinBody = z.object({
  userId: z.string().uuid(),
  pin: z.string().regex(/^\d{4,8}$/),
});

/**
 * POST /auth/verify-pin
 *
 * Llamado por la pantalla `/lock` (vía un proxy en Next route) cuando el
 * usuario tipea su PIN. Es un check de "step-up" — el usuario ya está
 * autenticado, solo confirmamos identidad antes de desbloquear.
 */
auth.post("/verify-pin", async (c) => {
  const parsed = verifyPinBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }

  const { userId, pin } = parsed.data;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.pinHash) {
    return c.json({ error: "no_pin_set" }, 404);
  }

  const ok = await verifySecret(user.pinHash, pin);
  return ok ? c.json({ ok: true }) : c.json({ error: "invalid_pin" }, 401);
});

export default auth;
