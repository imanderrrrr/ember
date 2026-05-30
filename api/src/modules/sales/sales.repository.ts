import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  cashCloses,
  sales,
  shiftGoals,
  type NewCashClose,
  type NewSale,
} from "../../db/schema.js";

/**
 * Capa Drizzle de Ventas. Funciones pequeñas que devuelven rows.
 */

export async function insertSale(data: NewSale) {
  const [row] = await db.insert(sales).values(data).returning();
  if (!row) throw new Error("insert_sale_failed");
  return row;
}

/** Suma y cuenta de ventas de una fecha de turno. */
export async function summaryByDate(serviceDate: string) {
  const [row] = await db
    .select({
      totalCents: sql<string>`coalesce(sum(${sales.totalCents}), 0)`,
      subtotalCents: sql<string>`coalesce(sum(${sales.subtotalCents}), 0)`,
      ivaCents: sql<string>`coalesce(sum(${sales.ivaCents}), 0)`,
      count: sql<string>`count(*)`,
    })
    .from(sales)
    .where(eq(sales.serviceDate, serviceDate));
  return {
    totalCents: Number(row?.totalCents ?? 0),
    subtotalCents: Number(row?.subtotalCents ?? 0),
    ivaCents: Number(row?.ivaCents ?? 0),
    count: Number(row?.count ?? 0),
  };
}

/** Desglose de ventas por método de pago (cents + count) de un turno. */
export async function byMethodByDate(serviceDate: string) {
  const rows = await db
    .select({
      method: sales.method,
      totalCents: sql<string>`coalesce(sum(${sales.totalCents}), 0)`,
      count: sql<string>`count(*)`,
    })
    .from(sales)
    .where(eq(sales.serviceDate, serviceDate))
    .groupBy(sales.method);
  return rows.map((r) => ({
    method: r.method,
    totalCents: Number(r.totalCents),
    count: Number(r.count),
  }));
}

export async function insertClose(data: NewCashClose) {
  const [row] = await db.insert(cashCloses).values(data).returning();
  if (!row) throw new Error("insert_close_failed");
  return row;
}

/** Último cierre registrado de un turno (o null si no se ha cerrado). */
export async function latestCloseByDate(serviceDate: string) {
  const [row] = await db
    .select()
    .from(cashCloses)
    .where(eq(cashCloses.serviceDate, serviceDate))
    .orderBy(desc(cashCloses.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getGoal(serviceDate: string) {
  const [row] = await db
    .select()
    .from(shiftGoals)
    .where(eq(shiftGoals.serviceDate, serviceDate));
  return row ?? null;
}

/** Inserta o actualiza la meta de un turno (clave: serviceDate). */
export async function upsertGoal(serviceDate: string, goalCents: number) {
  const [row] = await db
    .insert(shiftGoals)
    .values({ serviceDate, goalCents })
    .onConflictDoUpdate({
      target: shiftGoals.serviceDate,
      set: { goalCents, updatedAt: new Date() },
    })
    .returning();
  if (!row) throw new Error("upsert_goal_failed");
  return row;
}
