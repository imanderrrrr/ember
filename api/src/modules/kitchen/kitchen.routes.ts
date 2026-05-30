import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import {
  CreateKitchenOrderSchema,
  UpdateKitchenOrderSchema,
} from "./kitchen.schemas.js";
import * as service from "./kitchen.service.js";

/**
 * Handlers HTTP de Órdenes de cocina. Mismo patrón que reservaciones:
 * validar con Zod, delegar al service, mapear DomainError.
 */

const kitchen = new Hono();

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

// GET /orders?status=nueva,preparacion,lista
kitchen.get("/", async (c) => {
  const statusQ = c.req.query("status");
  const statuses = statusQ
    ? statusQ.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  return c.json(await service.listOrders(statuses));
});

// POST /orders — el mesero envía una comanda a cocina
kitchen.post("/", async (c) => {
  const parsed = CreateKitchenOrderSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.createOrder(parsed.data), 201);
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

// PATCH /orders/:id — cocina avanza el estado de la orden
kitchen.patch("/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  const parsed = UpdateKitchenOrderSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  try {
    return c.json(await service.updateStatus(id.data.id, parsed.data.status));
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

export default kitchen;
