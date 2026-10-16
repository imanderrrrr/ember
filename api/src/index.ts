import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 3001;
console.log(`[ember-api] listening on :${port}`);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
