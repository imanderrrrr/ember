import * as repo from "./kitchen.repository.js";
import { eventHub } from "../../lib/events.js";
import { getMenuItemById, getMenuItemByName } from "../sales/sales.repository.js";
import type { KitchenOrder, KitchenOrderItem } from "../../db/schema.js";

/**
 * Service de Órdenes de cocina. Mapea DB ↔ wire y centraliza la lógica.
 */

import type { KitchenOrderDTO } from "@ember/types";
export type { KitchenOrderDTO };

function toDTO(o: KitchenOrder): KitchenOrderDTO {
  return {
    id: o.id,
    tableId: o.tableId,
    tableLabel: o.tableLabel,
    zoneName: o.zoneName,
    partySize: o.partySize,
    mesero: o.mesero,
    items: o.items ?? [],
    station: o.station,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export async function listOrders(statuses?: string[]): Promise<KitchenOrderDTO[]> {
  const rows = await repo.listOrders(statuses);
  return rows.map(toDTO);
}

export async function createOrder(input: {
  tableId?: string | null;
  tableLabel: string;
  zoneName: string;
  partySize?: number;
  mesero?: string | null;
  items: Array<{
    menuItemId?: string;
    quantity?: number;
    qty?: number;
    name?: string;
    mods?: string;
  }>;
  station?: string;
  status?: string;
}): Promise<KitchenOrderDTO> {
  // Resolver items contra el catálogo oficial
  const resolvedItems: KitchenOrderItem[] = [];
  for (const item of input.items) {
    const qty = item.quantity ?? item.qty ?? 1;
    let menuItem = null;

    if (item.menuItemId) {
      menuItem = await getMenuItemById(item.menuItemId);
    } else if (item.name) {
      menuItem = await getMenuItemByName(item.name);
    }

    resolvedItems.push({
      menuItemId: menuItem?.id ?? item.menuItemId,
      name: menuItem?.name ?? item.name ?? "Platillo",
      qty,
      priceCents: menuItem?.priceCents,
      mods: item.mods,
    });
  }

  const row = await repo.insertOrder({
    tableId: input.tableId ?? null,
    tableLabel: input.tableLabel,
    zoneName: input.zoneName,
    partySize: input.partySize ?? 1,
    mesero: input.mesero ?? null,
    items: resolvedItems,
    station: input.station ?? "platos",
    status: input.status ?? "nueva",
  });

  const dto = toDTO(row);

  // Emisión de evento en tiempo real
  eventHub.emitEvent("order:created", dto);

  return dto;
}

import {
  assertValidOrderStatusTransition,
  OrderPolicyError,
} from "./kitchen.policy.js";

export { OrderPolicyError };

export async function updateStatus(
  id: string,
  status: string,
): Promise<KitchenOrderDTO> {
  const currentOrders = await repo.listOrders();
  const existing = currentOrders.find((o) => o.id === id);
  if (existing) {
    assertValidOrderStatusTransition(existing.status, status);
  }

  const row = await repo.updateOrderStatus(id, status);
  if (!row) {
    throw new DomainError("order_not_found", "Orden no encontrada", 404);
  }
  const dto = toDTO(row);

  // Emisión de evento en tiempo real
  eventHub.emitEvent("order:status_updated", dto);

  return dto;
}
