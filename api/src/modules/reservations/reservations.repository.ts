import { and, desc, eq, inArray, or, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  reservations,
  type NewReservation,
} from "../../db/schema.js";
import type { ReservationListFilters } from "./reservations.policy.js";

/**
 * Capa única que toca Drizzle para reservaciones. Espeja el patrón del
 * módulo Salón: funciones pequeñas y específicas, devuelven rows crudas.
 */

function tableIdentityCondition(input: {
  tableId?: string | null;
  zoneName?: string;
  tableLabel?: string;
}): SQL | undefined {
  const snapshot =
    input.zoneName && input.tableLabel
      ? and(
          eq(reservations.zoneName, input.zoneName),
          eq(reservations.tableLabel, input.tableLabel),
        )
      : undefined;

  if (input.tableId && snapshot) {
    return or(eq(reservations.tableId, input.tableId), snapshot);
  }
  if (input.tableId) return eq(reservations.tableId, input.tableId);
  return snapshot;
}

export async function listReservations(filters: ReservationListFilters = {}) {
  const conditions: SQL[] = [];
  if (filters.date) conditions.push(eq(reservations.date, filters.date));
  if (filters.timeSlot) conditions.push(eq(reservations.timeSlot, filters.timeSlot));
  const tableCondition = tableIdentityCondition(filters);
  if (tableCondition) conditions.push(tableCondition);

  if (conditions.length > 0) {
    return db
      .select()
      .from(reservations)
      .where(and(...conditions))
      .orderBy(desc(reservations.createdAt));
  }
  return db.select().from(reservations).orderBy(desc(reservations.createdAt));
}

export async function findReservationById(id: string) {
  const [row] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertReservation(data: NewReservation) {
  const [row] = await db.insert(reservations).values(data).returning();
  if (!row) throw new Error("insert_reservation_failed");
  return row;
}

export async function findBlockingReservation(input: {
  date: string;
  timeSlot: string;
  tableId?: string | null;
  zoneName: string;
  tableLabel: string;
  statuses: string[];
}) {
  const tableCondition = tableIdentityCondition(input);
  if (!tableCondition) return null;

  const [row] = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.date, input.date),
        eq(reservations.timeSlot, input.timeSlot),
        inArray(reservations.status, input.statuses),
        tableCondition,
      ),
    )
    .limit(1);
  return row ?? null;
}
