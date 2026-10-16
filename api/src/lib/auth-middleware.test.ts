import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import crypto from "node:crypto";
import {
  authMiddleware,
  requireRoles,
  internalSecretMiddleware,
  getAuthSecret,
} from "./auth-middleware.js";

function base64UrlEncode(str: string) {
  return Buffer.from(str).toString("base64url");
}

function createTestJwt(
  payload: Record<string, unknown>,
  secret = getAuthSecret(),
) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedHeader + "." + encodedPayload)
    .digest("base64url");
  return encodedHeader + "." + encodedPayload + "." + signature;
}

test("authMiddleware rejects requests without Authorization header", async () => {
  const app = new Hono();
  app.use("/protected", authMiddleware);
  app.get("/protected", (c) => c.json({ ok: true }));

  const res = await app.request("/protected");
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, "unauthorized");
});

test("authMiddleware rejects invalid or tampered tokens", async () => {
  const app = new Hono();
  app.use("/protected", authMiddleware);
  app.get("/protected", (c) => c.json({ ok: true }));

  const forgedToken = createTestJwt(
    { sub: "attacker", role: "admin", exp: Math.floor(Date.now() / 1000) + 3600 },
    "wrong-secret",
  );

  const res = await app.request("/protected", {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, "invalid_token");
});

test("authMiddleware accepts valid JWT and sets user in context", async () => {
  const app = new Hono();
  app.use("/protected", authMiddleware);
  app.get("/protected", (c) => c.json({ user: c.get("user") }));

  const validToken = createTestJwt({
    sub: "user-123",
    role: "mesero",
    email: "mesero@ember.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const res = await app.request("/protected", {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.user.sub, "user-123");
  assert.equal(data.user.role, "mesero");
});

test("requireRoles blocks users with insufficient roles with 403 Forbidden", async () => {
  const app = new Hono();
  app.use("/manager-only", authMiddleware);
  app.use("/manager-only", requireRoles("gerente_operativo"));
  app.get("/manager-only", (c) => c.json({ ok: true }));

  const waiterToken = createTestJwt({
    sub: "waiter-1",
    role: "mesero",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const res = await app.request("/manager-only", {
    headers: { Authorization: `Bearer ${waiterToken}` },
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.error, "forbidden");
});

test("requireRoles permits authorized roles and admin", async () => {
  const app = new Hono();
  app.use("/manager-only", authMiddleware);
  app.use("/manager-only", requireRoles("gerente_operativo"));
  app.get("/manager-only", (c) => c.json({ ok: true }));

  const managerToken = createTestJwt({
    sub: "mgr-1",
    role: "gerente_operativo",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const res1 = await app.request("/manager-only", {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert.equal(res1.status, 200);

  const adminToken = createTestJwt({
    sub: "admin-1",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const res2 = await app.request("/manager-only", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res2.status, 200);
});

test("internalSecretMiddleware validates x-internal-secret header", async () => {
  const app = new Hono();
  app.use("/internal", internalSecretMiddleware);
  app.post("/internal", (c) => c.json({ ok: true }));

  // Without header
  const res1 = await app.request("/internal", { method: "POST" });
  assert.equal(res1.status, 401);

  // With wrong header
  const res2 = await app.request("/internal", {
    method: "POST",
    headers: { "x-internal-secret": "wrong" },
  });
  assert.equal(res2.status, 401);

  // With correct header
  const res3 = await app.request("/internal", {
    method: "POST",
    headers: { "x-internal-secret": getAuthSecret() },
  });
  assert.equal(res3.status, 200);
});
