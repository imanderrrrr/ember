import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import {
  CreateShapeSchema,
  CreateTableSchema,
  CreateZoneSchema,
  UpdateShapeSchema,
  UpdateTableSchema,
  UpdateZoneSchema,
} from "./salon.schemas.js";
import * as service from "./salon.service.js";

/**
 * Handlers HTTP del módulo Salón.
 *
 * Patrón:
 *   1. Validar params/body con Zod.
 *   2. Delegar al service dentro de un try/catch.
 *   3. Si el service tira `DomainError`, mapeamos su `status` y `code`.
 *   4. Cualquier otro error sube al handler global de Hono.
 */

const salon = new Hono();

const idParam = z.object({ id: z.string().uuid() });

function domainErrorResponse(c: Context, err: unknown) {
  if (err instanceof service.DomainError) {
    return c.json(
      { error: err.code, message: err.message },
      err.status as ContentfulStatusCode,
    );
  }
  throw err;
}

/* ─── Aggregate ─── */

salon.get("/floor-plan", async (c) => c.json(await service.getFloorPlan()));

/* ─── Zones ─── */

salon.get("/zones", async (c) => c.json(await service.listZones()));

salon.post("/zones", async (c) => {
  const parsed = CreateZoneSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.createZone(parsed.data), 201);
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

salon.patch("/zones/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  const parsed = UpdateZoneSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.updateZone(id.data.id, parsed.data));
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

salon.delete("/zones/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  try {
    await service.deleteZone(id.data.id);
    return c.json({ ok: true });
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

/* ─── Tables ─── */

salon.post("/tables", async (c) => {
  const parsed = CreateTableSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.createTable(parsed.data), 201);
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

salon.patch("/tables/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  const parsed = UpdateTableSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.updateTable(id.data.id, parsed.data));
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

salon.delete("/tables/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  try {
    await service.deleteTable(id.data.id);
    return c.json({ ok: true });
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

/* ─── Shapes ─── */

salon.post("/shapes", async (c) => {
  const parsed = CreateShapeSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.createShape(parsed.data), 201);
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

salon.patch("/shapes/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  const parsed = UpdateShapeSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.updateShape(id.data.id, parsed.data));
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

salon.delete("/shapes/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  try {
    await service.deleteShape(id.data.id);
    return c.json({ ok: true });
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

export default salon;
