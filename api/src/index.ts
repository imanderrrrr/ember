import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { resolveCorsOrigins } from "./lib/cors.js";
import auth from "./routes/auth.js";
import salon from "./modules/salon/salon.routes.js";
import reservations from "./modules/reservations/reservations.routes.js";
import kitchen from "./modules/kitchen/kitchen.routes.js";
import sales from "./modules/sales/sales.routes.js";
import staff from "./modules/staff/staff.routes.js";
import status from "./modules/status/status.routes.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    // En una instalación por nodos, el frontend vive en otra computadora.
    // Configurar con CORS_ORIGINS=http://IP_FRONTEND:3000,http://frontend.local:3000
    origin: resolveCorsOrigins(),
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

const port = Number(process.env.PORT) || 3001;
console.log(`[ember-api] listening on :${port}`);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
