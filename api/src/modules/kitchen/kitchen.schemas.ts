import { z } from "zod";

/**
 * Schemas Zod del módulo Órdenes de cocina (KDS).
 */

const STATUSES = ["nueva", "preparacion", "lista", "entregada"] as const;
const STATIONS = ["entradas", "parrilla", "platos", "postres", "bebidas"] as const;

export const OrderItemSchema = z
  .object({
    menuItemId: z.string().min(1).optional(),
    quantity: z.number().int().min(1).max(99).optional(),
    qty: z.number().int().min(1).max(99).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    mods: z.string().trim().max(160).optional(),
  })
  .refine(
    (item) => Boolean(item.menuItemId || item.name),
    { message: "Debe especificar menuItemId o name para el producto" },
  )
  .refine(
    (item) => (item.quantity ?? item.qty ?? 0) > 0,
    { message: "Debe especificar una cantidad positiva (quantity o qty)" },
  );

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
