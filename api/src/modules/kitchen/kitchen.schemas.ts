import { z } from "zod";

/**
 * Schemas Zod del módulo Órdenes de cocina (KDS).
 */

const STATUSES = ["nueva", "preparacion", "lista", "entregada"] as const;
const STATIONS = ["entradas", "parrilla", "platos", "postres", "bebidas"] as const;

export const OrderItemSchema = z.object({
  qty: z.number().int().min(1).max(99),
  name: z.string().trim().min(1).max(120),
  mods: z.string().trim().max(160).optional(),
});

export const CreateKitchenOrderSchema = z.object({
  tableId: z.string().uuid().nullable().optional(),
  tableLabel: z.string().trim().min(1).max(20),
  zoneName: z.string().trim().min(1).max(80),
  partySize: z.number().int().min(1).max(40).optional().default(1),
  mesero: z.string().trim().max(80).nullable().optional(),
  items: z.array(OrderItemSchema).min(1),
  station: z.enum(STATIONS).optional().default("platos"),
  status: z.enum(STATUSES).optional().default("nueva"),
});

export const UpdateKitchenOrderSchema = z.object({
  status: z.enum(STATUSES),
});

export const KITCHEN_STATUSES = STATUSES;
