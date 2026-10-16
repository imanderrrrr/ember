import { Hono } from "hono";
import * as service from "./catalog.service.js";
import { authMiddleware } from "../../lib/auth-middleware.js";

const catalog = new Hono();

catalog.use("*", authMiddleware);

// GET /catalog — list categories and items
catalog.get("/", async (c) => {
  return c.json(await service.listCatalog());
});

// GET /catalog/:id
catalog.get("/:id", async (c) => {
  const item = await service.getMenuItem(c.req.param("id"));
  if (!item) return c.json({ error: "item_not_found" }, 404);
  return c.json(item);
});

export default catalog;
