/**
 * Contrato DTO compartido para el módulo de Cocina y Órdenes.
 */

export type KitchenOrderStatus =
  | "nueva"
  | "preparacion"
  | "lista"
  | "entregada"
  | "cancelada";

export const KITCHEN_ORDER_STATUSES: readonly KitchenOrderStatus[] = [
  "nueva",
  "preparacion",
  "lista",
  "entregada",
  "cancelada",
] as const;

export interface KitchenOrderItem {
  menuItemId?: string;
  name: string;
  qty: number;
  priceCents?: number;
  mods?: string;
}

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

export interface CreateKitchenOrderPayload {
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
}

export interface UpdateKitchenOrderPayload {
  status: KitchenOrderStatus | string;
}
