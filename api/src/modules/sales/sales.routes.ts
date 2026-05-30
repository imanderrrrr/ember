import { Hono } from "hono";
import {
  CloseShiftSchema,
  CreateSaleSchema,
  SetGoalSchema,
} from "./sales.schemas.js";
import * as service from "./sales.service.js";

/**
 * Handlers HTTP de Ventas.
 *   GET  /sales/summary?date=yyyy-mm-dd  → { totalCents, count, goalCents }
 *   POST /sales                          → registra un cobro
 *   PUT  /sales/goal                     → fija/actualiza la meta del turno
 */
const sales = new Hono();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /sales/summary?date=yyyy-mm-dd
sales.get("/summary", async (c) => {
  const date = c.req.query("date");
  if (!date || !DATE_RE.test(date)) {
    return c.json({ error: "invalid_date" }, 400);
  }
  return c.json(await service.getSummary(date));
});

// POST /sales — el cobro completado registra la venta
sales.post("/", async (c) => {
  const parsed = CreateSaleSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  return c.json(await service.recordSale(parsed.data), 201);
});

// PUT /sales/goal — meta de ventas del turno
sales.put("/goal", async (c) => {
  const parsed = SetGoalSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  return c.json(
    await service.setGoal(parsed.data.serviceDate, parsed.data.goalCents),
  );
});

// GET /sales/cierre?date=yyyy-mm-dd — datos del cierre de caja del turno
sales.get("/cierre", async (c) => {
  const date = c.req.query("date");
  if (!date || !DATE_RE.test(date)) {
    return c.json({ error: "invalid_date" }, 400);
  }
  return c.json(await service.getCierre(date));
});

// POST /sales/close — registra el cierre de caja del turno
sales.post("/close", async (c) => {
  const parsed = CloseShiftSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  return c.json(await service.closeShift(parsed.data), 201);
});

export default sales;
