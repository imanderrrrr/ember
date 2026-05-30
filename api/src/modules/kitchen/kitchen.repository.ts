import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { kitchenOrders, type NewKitchenOrder } from "../../db/schema.js";

/**
 * Capa Drizzle de Órdenes de cocina. Funciones pequeñas, devuelven rows.
 */

export async function listOrders(statuses?: string[]) {
  if (statuses && statuses.length > 0) {
    return db
      .select()
      .from(kitchenOrders)
      .where(inArray(kitchenOrders.status, statuses))
      .orderBy(desc(kitchenOrders.createdAt));
  }
  return db.select().from(kitchenOrders).orderBy(desc(kitchenOrders.createdAt));
}

export async function insertOrder(data: NewKitchenOrder) {
  const [row] = await db.insert(kitchenOrders).values(data).returning();
  if (!row) throw new Error("insert_order_failed");
  return row;
}

export async function updateOrderStatus(id: string, status: string) {
  const [row] = await db
    .update(kitchenOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(kitchenOrders.id, id))
    .returning();
  return row ?? null;
}
