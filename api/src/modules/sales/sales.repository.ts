import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  cashCloses,
  kitchenOrders,
  menuItems,
  sales,
  salonTables,
  shiftGoals,
  type NewCashClose,
  type NewSale,
} from "../../db/schema.js";

type DbOrTx = any;

/**
 * Capa Drizzle de Ventas. Admite un ejecutor opcional `tx` para
 * transacciones atómicas ACID (db.transaction).
 */

export async function insertSale(data: NewSale, tx?: DbOrTx) {
  const client = tx ?? db;
  const [row] = await client.insert(sales).values(data).returning();
  if (!row) throw new Error("insert_sale_failed");
  return row;
}

export async function findKitchenOrderById(orderId: string, tx?: DbOrTx) {
  const client = tx ?? db;
  const [row] = await client
    .select()
    .from(kitchenOrders)
    .where(eq(kitchenOrders.id, orderId))
    .limit(1);
  return row ?? null;
}

export async function findActiveKitchenOrderByTableId(tableId: string, tx?: DbOrTx) {
  const client = tx ?? db;
  const rows = await client
    .select()
    .from(kitchenOrders)
    .where(eq(kitchenOrders.tableId, tableId))
    .orderBy(desc(kitchenOrders.createdAt));
  // Preferimos órdenes que no estén ya completadas/entregadas
  const active = rows.find((r: { status: string }) => r.status !== "entregada");
  return active ?? rows[0] ?? null;
}

export async function markKitchenOrderCompleted(orderId: string, tx?: DbOrTx) {
  const client = tx ?? db;
  const [row] = await client
    .update(kitchenOrders)
    .set({ status: "entregada", updatedAt: new Date() })
    .where(eq(kitchenOrders.id, orderId))
    .returning();
  return row ?? null;
}

export async function findTableById(tableId: string, tx?: DbOrTx) {
  const client = tx ?? db;
  const [row] = await client
    .select()
    .from(salonTables)
    .where(eq(salonTables.id, tableId))
    .limit(1);
  return row ?? null;
}

export async function updateTableStatus(
  tableId: string,
  status: string,
  tx?: DbOrTx,
) {
  const client = tx ?? db;
  const [row] = await client
    .update(salonTables)
    .set({
      status,
      customerName: status === "libre" ? null : undefined,
      partySize: status === "libre" ? null : undefined,
      notes: status === "libre" ? null : undefined,
      updatedAt: new Date(),
    })
    .where(eq(salonTables.id, tableId))
    .returning();
  return row ?? null;
}

export async function getMenuItemById(id: string, tx?: DbOrTx) {
  const client = tx ?? db;
  const [row] = await client
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);
  return row ?? null;
}

export async function getMenuItemByName(name: string, tx?: DbOrTx) {
  const client = tx ?? db;
  const [row] = await client
    .select()
    .from(menuItems)
    .where(eq(menuItems.name, name))
    .limit(1);
  return row ?? null;
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

/**
 * Agregación de ventas por hora de un turno.
 * SELECT 
 *   EXTRACT(HOUR FROM created_at) AS hour,
 *   SUM(total_cents) AS total_cents,
 *   COUNT(id) AS ticket_count
 * FROM sales
 * WHERE service_date = :date
 * GROUP BY hour
 * ORDER BY hour ASC;
 */
export async function hourlySalesByDate(serviceDate: string) {
  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${sales.createdAt})::int`,
      totalCents: sql<string>`coalesce(sum(${sales.totalCents}), 0)`,
      ticketCount: sql<string>`count(${sales.id})`,
    })
    .from(sales)
    .where(eq(sales.serviceDate, serviceDate))
    .groupBy(sql`EXTRACT(HOUR FROM ${sales.createdAt})::int`)
    .orderBy(sql`EXTRACT(HOUR FROM ${sales.createdAt})::int ASC`);

  return rows.map((r) => ({
    hour: Number(r.hour),
    totalCents: Number(r.totalCents),
    ticketCount: Number(r.ticketCount),
  }));
}

/**
 * Promedio de duración en segundos entre la apertura de la orden en cocina y
 * el registro de la venta en caja.
 */
export async function averageServiceDurationSeconds(
  serviceDate: string,
): Promise<number | null> {
  const [row] = await db
    .select({
      avgSec: sql<string | null>`avg(extract(epoch from (${sales.createdAt} - ${kitchenOrders.createdAt})))`,
    })
    .from(sales)
    .innerJoin(kitchenOrders, eq(sales.orderId, kitchenOrders.id))
    .where(eq(sales.serviceDate, serviceDate));

  if (!row || row.avgSec === null) return null;
  const num = Math.round(Number(row.avgSec));
  return num >= 0 ? num : 0;
}

/** Total de mesas configuradas en el salón. */
export async function totalConfiguredTablesCount(): Promise<number> {
  const [row] = await db
    .select({
      count: sql<string>`count(*)`,
    })
    .from(salonTables);
  return Number(row?.count ?? 0);
}

