import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { resolveCorsOrigin } from "./lib/cors.js";
import auth from "./routes/auth.js";
import salon from "./modules/salon/salon.routes.js";
import reservations from "./modules/reservations/reservations.routes.js";
import kitchen from "./modules/kitchen/kitchen.routes.js";
import sales from "./modules/sales/sales.routes.js";
import staff from "./modules/staff/staff.routes.js";
import status from "./modules/status/status.routes.js";
import catalog from "./modules/catalog/catalog.routes.js";
import realtime from "./routes/realtime.js";

export function createApiApp(): Hono {
  const app = new Hono();

  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: resolveCorsOrigin(),
      credentials: true,
    }),
  );

  app.get("/health", (c) =>
    c.json({
      status: "ok",
      service: "ember-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    }),
  );

  app.route("/auth", auth);
  app.route("/salon", salon);
  app.route("/reservations", reservations);
  app.route("/orders", kitchen);
  app.route("/sales", sales);
  app.route("/staff", staff);
  app.route("/status", status);
  app.route("/catalog", catalog);
  app.route("/menu", catalog);
  app.route("/realtime", realtime);
  app.route("/events", realtime);

  return app;
}

export const app = createApiApp();
