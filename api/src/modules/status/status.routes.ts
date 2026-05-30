import { Hono } from "hono";
import * as service from "./status.service.js";

const status = new Hono();

/**
 * GET /status — sondea base de datos + API, registra los sondeos (throttle
 * ~1/min por componente) y devuelve el histórico de disponibilidad de 90 días.
 *
 * El frontend (web) reporta su propia vida vía query, porque la API no puede
 * observarlo desde dentro:
 *   ?feOk=1&feMs=3   → registra un sondeo 'frontend' ok con 3ms de latencia.
 *
 * Es público a propósito: la página /status del web lo consume sin sesión.
 */
status.get("/", async (c) => {
  const url = new URL(c.req.url);
  const feOk = url.searchParams.get("feOk");
  const feMs = url.searchParams.get("feMs");
  const frontend =
    feOk !== null
      ? {
          ok: feOk === "1" || feOk === "true",
          latencyMs: feMs !== null && feMs !== "" ? Number(feMs) : null,
        }
      : undefined;

  const report = await service.probeAndReport(frontend);
  return c.json(report);
});

/**
 * GET /status/db — ping aislado a Postgres. Útil para debug o para un monitor
 * externo. 200 si responde, 503 si no.
 */
status.get("/db", async (c) => {
  const result = await service.pingDatabase();
  return c.json(result, result.ok ? 200 : 503);
});

export default status;
