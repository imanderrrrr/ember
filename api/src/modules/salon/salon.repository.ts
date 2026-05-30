import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  salonTables,
  shapes,
  zones,
  type NewSalonTable,
  type NewShape,
  type NewZone,
} from "../../db/schema.js";

/**
 * Capa única que toca Drizzle. Devuelve registros tal cual están en la DB
 * — el service se encarga de adaptar nombres/casing si hace falta.
 *
 * Mantenemos métodos pequeños y específicos; nada de "queries dinámicas
 * mágicas" — preferimos varias funciones legibles a una sola con switches.
 */

/* ─── Zones ─── */

export async function listZones() {
  return db.select().from(zones).orderBy(asc(zones.ord), asc(zones.createdAt));
}

export async function findZoneById(id: string) {
  const [row] = await db.select().from(zones).where(eq(zones.id, id)).limit(1);
  return row ?? null;
}

export async function insertZone(data: NewZone) {
  const [row] = await db.insert(zones).values(data).returning();
  if (!row) throw new Error("insert_zone_failed");
  return row;
}

export async function updateZoneById(id: string, data: Partial<NewZone>) {
  const [row] = await db
    .update(zones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(zones.id, id))
    .returning();
  return row ?? null;
}

export async function deleteZoneById(id: string) {
  const [row] = await db.delete(zones).where(eq(zones.id, id)).returning();
  return row ?? null;
}

/* ─── Tables ─── */

export async function listTables() {
  return db.select().from(salonTables).orderBy(asc(salonTables.createdAt));
}

export async function findTableById(id: string) {
  const [row] = await db
    .select()
    .from(salonTables)
    .where(eq(salonTables.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertTable(data: NewSalonTable) {
  const [row] = await db.insert(salonTables).values(data).returning();
  if (!row) throw new Error("insert_table_failed");
  return row;
}

export async function updateTableById(id: string, data: Partial<NewSalonTable>) {
  const [row] = await db
    .update(salonTables)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(salonTables.id, id))
    .returning();
  return row ?? null;
}

export async function deleteTableById(id: string) {
  const [row] = await db.delete(salonTables).where(eq(salonTables.id, id)).returning();
  return row ?? null;
}

/* ─── Shapes ─── */

export async function listShapes() {
  return db.select().from(shapes).orderBy(asc(shapes.createdAt));
}

export async function findShapeById(id: string) {
  const [row] = await db.select().from(shapes).where(eq(shapes.id, id)).limit(1);
  return row ?? null;
}

export async function insertShape(data: NewShape) {
  const [row] = await db.insert(shapes).values(data).returning();
  if (!row) throw new Error("insert_shape_failed");
  return row;
}

export async function updateShapeById(id: string, data: Partial<NewShape>) {
  const [row] = await db
    .update(shapes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shapes.id, id))
    .returning();
  return row ?? null;
}

export async function deleteShapeById(id: string) {
  const [row] = await db.delete(shapes).where(eq(shapes.id, id)).returning();
  return row ?? null;
}
