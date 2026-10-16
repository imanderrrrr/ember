import { Hono } from "hono";
import {
  CloseShiftSchema,
  CreateSaleSchema,
  SetGoalSchema,
} from "./sales.schemas.js";
import * as service from "./sales.service.js";
import { authMiddleware, requireRoles } from "../../lib/auth-middleware.js";

/**
 * Handlers HTTP de Ventas.
 *   GET  /sales/summary?date=yyyy-mm-dd  → { totalCents, count, goalCents }
 *   POST /sales                          → registra un cobro
 *   PUT  /sales/goal                     → fija/actualiza la meta del turno
 *   GET  /sales/cierre?date=yyyy-mm-dd   → datos del cierre
 *   POST /sales/close                    → ejecuta el cierre de caja
 */
const sales = new Hono();

sales.use("*", authMiddleware);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /sales/summary?date=yyyy-mm-dd
sales.get("/summary", requireRoles("cajero", "gerente_operativo", "admin"), async (c) => {
  const date = c.req.query("date");
  if (!date || !DATE_RE.test(date)) {
    return c.json({ error: "invalid_date" }, 400);
  }
  return c.json(await service.getSummary(date));
});

// GET /sales/analytics/hourly?date=yyyy-mm-dd
sales.get(
  "/analytics/hourly",
  requireRoles("cajero", "gerente_operativo", "admin", "mesero", "cocina"),
  async (c) => {
    const date = c.req.query("date");
    if (!date || !DATE_RE.test(date)) {
      return c.json({ error: "invalid_date" }, 400);
    }
    return c.json(await service.getHourlySales(date));
  },
);

// GET /sales/analytics/performance?date=yyyy-mm-dd
sales.get(
  "/analytics/performance",
  requireRoles("cajero", "gerente_operativo", "admin", "mesero", "cocina"),
  async (c) => {
    const date = c.req.query("date");
    if (!date || !DATE_RE.test(date)) {
      return c.json({ error: "invalid_date" }, 400);
    }
    return c.json(await service.getOperationalMetrics(date));
  },
);


function domainErrorResponse(c: any, err: unknown) {
  if (err instanceof service.DomainError) {
    return c.json(
      { error: err.code, message: err.message },
      err.status as any,
    );
  }
  throw err;
}

// POST /sales — el cobro completado registra la venta
sales.post(
  "/",
  requireRoles("cajero", "gerente_operativo", "admin", "mesero"),
  async (c) => {
    const parsed = CreateSaleSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!parsed.success) {
      return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
    }
    try {
      return c.json(await service.recordSale(parsed.data), 201);
    } catch (err) {
      return domainErrorResponse(c, err);
    }
  },
);

// PUT /sales/goal — meta de ventas del turno (solo gerencia/admin)
sales.put("/goal", requireRoles("gerente_operativo", "admin"), async (c) => {
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
sales.get("/cierre", requireRoles("cajero", "gerente_operativo", "admin"), async (c) => {
  const date = c.req.query("date");
  if (!date || !DATE_RE.test(date)) {
    return c.json({ error: "invalid_date" }, 400);
  }
  return c.json(await service.getCierre(date));
});

// POST /sales/close — registra el cierre de caja del turno (solo cajero/gerente/admin)
sales.post("/close", requireRoles("cajero", "gerente_operativo", "admin"), async (c) => {
  const parsed = CloseShiftSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  return c.json(await service.closeShift(parsed.data), 201);
});

export default sales;
