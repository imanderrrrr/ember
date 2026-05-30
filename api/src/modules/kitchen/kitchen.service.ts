import * as repo from "./kitchen.repository.js";
import type { KitchenOrder, KitchenOrderItem } from "../../db/schema.js";

/**
 * Service de Órdenes de cocina. Mapea DB ↔ wire y centraliza la lógica.
 */

export interface KitchenOrderDTO {
  id: string;
  tableId: string | null;
  tableLabel: string;
  zoneName: string;
  partySize: number;
  mesero: string | null;
  items: KitchenOrderItem[];
  station: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
  items: KitchenOrderItem[];
  station?: string;
  status?: string;
}): Promise<KitchenOrderDTO> {
  const row = await repo.insertOrder({
    tableId: input.tableId ?? null,
    tableLabel: input.tableLabel,
    zoneName: input.zoneName,
    partySize: input.partySize ?? 1,
    mesero: input.mesero ?? null,
    items: input.items,
    station: input.station ?? "platos",
    status: input.status ?? "nueva",
  });
  return toDTO(row);
}

export async function updateStatus(
  id: string,
  status: string,
): Promise<KitchenOrderDTO> {
  const row = await repo.updateOrderStatus(id, status);
  if (!row) {
    throw new DomainError("order_not_found", "Orden no encontrada", 404);
  }
  return toDTO(row);
}
