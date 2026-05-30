import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

/**
 * Staff — listado de personal por rol. Lo usa el wizard de reservas para
 * poblar el selector de "mesero responsable" con los perfiles reales.
 *
 *   GET /staff?role=mesero  → [{ id, name, avatarInitials, role }]
 */
const staff = new Hono();

staff.get("/", async (c) => {
  const role = c.req.query("role") || "mesero";
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarInitials: users.avatarInitials,
      role: users.role,
    })
    .from(users)
    .where(eq(users.role, role))
    .orderBy(asc(users.name));
  return c.json(rows);
});

export default staff;
