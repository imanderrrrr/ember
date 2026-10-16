"use client";

/**
 * Cliente browser de Ventas. Habla con el proxy autenticado `/api/sales/*`.
 * Los montos se manejan en Quetzales (decimales) de cara al caller y se
 * convierten a centavos (enteros) al enviar.
 */

import type { SalesSummary } from "@ember/types";

export type { SalesSummary };

export interface CreateSaleInput {
  orderId?: string | null;
  tableId?: string | null;
  tableLabel: string;
  zoneName: string;
  mesero?: string | null;
  cashier?: string | null;
  method?: string;
  subtotal?: number; // Q
  iva?: number; // Q
  total?: number; // Q
  items?: {
    menuItemId?: string;
    quantity?: number;
    qty?: number;
    name?: string;
    mods?: string;
  }[];
  serviceDate: string; // yyyy-mm-dd
}

const toCents = (q: number) => Math.round(q * 100);

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const body = await res.text();
  if (!res.ok) throw new Error(body.slice(0, 200) || `HTTP ${res.status}`);
  return JSON.parse(body) as T;
}

/** Registra un cobro completado dentro de una transacción ACID en el servidor. */
export async function createSale(input: CreateSaleInput): Promise<void> {
  await jsonOrThrow(
    await fetch("/api/sales/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: input.orderId ?? null,
        tableId: input.tableId ?? null,
        tableLabel: input.tableLabel,
        zoneName: input.zoneName,
        mesero: input.mesero ?? null,
        cashier: input.cashier ?? null,
        method: input.method ?? "efectivo",
        subtotalCents: input.subtotal !== undefined ? toCents(input.subtotal) : undefined,
        ivaCents: input.iva !== undefined ? toCents(input.iva) : undefined,
        totalCents: input.total !== undefined ? toCents(input.total) : undefined,
        items: input.items?.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity ?? item.qty,
          qty: item.qty ?? item.quantity,
          name: item.name,
          mods: item.mods,
        })) ?? [],
        serviceDate: input.serviceDate,
      }),
    }),
  );
}

/** Fija/actualiza la meta de ventas del turno (en Q). Devuelve el resumen. */
export async function setShiftGoal(
  serviceDate: string,
  goalQ: number,
): Promise<SalesSummary> {
  return jsonOrThrow<SalesSummary>(
    await fetch("/api/sales/goal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceDate, goalCents: toCents(goalQ) }),
    }),
  );
}

/** Registra el cierre de caja del turno. Devuelve el cierre actualizado. */
export async function closeShift(input: {
  serviceDate: string;
  countedCents: number; // efectivo contado, en centavos
  notes?: string | null;
  cashier?: string | null;
}): Promise<import("@/app/caja/_lib/cierre").CierreData> {
  return jsonOrThrow(
    await fetch("/api/sales/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceDate: input.serviceDate,
        countedCashCents: input.countedCents,
        notes: input.notes ?? null,
        cashier: input.cashier ?? null,
      }),
    }),
  );
}

/** Fecha local yyyy-mm-dd (coincide con la del dashboard). */
export function todayServiceDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
