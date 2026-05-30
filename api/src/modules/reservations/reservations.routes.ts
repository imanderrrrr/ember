import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { CreateReservationSchema } from "./reservations.schemas.js";
import * as service from "./reservations.service.js";
import {
  parseReservationListFilters,
  ReservationFilterError,
} from "./reservations.policy.js";

/**
 * Handlers HTTP del módulo Reservaciones.
 *
 * Patrón espejo de `salon.routes.ts`:
 *   1. Validar params/body con Zod.
 *   2. Delegar al service dentro de un try/catch.
 *   3. Si el service tira `DomainError`, mapeamos su `status` y `code`.
 */

const reservations = new Hono();

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

reservations.get("/", async (c) => {
  try {
    const filters = parseReservationListFilters({
      date: c.req.query("date"),
      timeSlot: c.req.query("timeSlot"),
      tableId: c.req.query("tableId"),
      zoneName: c.req.query("zoneName"),
      tableLabel: c.req.query("tableLabel"),
    });
    return c.json(await service.listReservations(filters));
  } catch (err) {
    if (err instanceof ReservationFilterError) {
      return c.json({ error: err.code }, 400);
    }
    throw err;
  }
});

reservations.get("/:id", async (c) => {
  const id = idParam.safeParse({ id: c.req.param("id") });
  if (!id.success) return c.json({ error: "invalid_id" }, 400);
  try {
    return c.json(await service.getReservation(id.data.id));
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

reservations.post("/", async (c) => {
  const parsed = CreateReservationSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json(
      { error: "invalid_body", issues: parsed.error.issues },
      400,
    );
  }
  try {
    return c.json(await service.createReservation(parsed.data), 201);
  } catch (err) {
    return domainErrorResponse(c, err);
  }
});

export default reservations;
