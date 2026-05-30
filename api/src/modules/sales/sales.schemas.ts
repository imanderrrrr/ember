import { z } from "zod";

/**
 * Validación de Ventas. Montos en CENTAVOS (enteros). `serviceDate` agrupa por
 * turno (yyyy-mm-dd). El web lo envía con la misma fecha local que usa el
 * dashboard, para que coincidan.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ItemSchema = z.object({
  qty: z.number().int().positive(),
  name: z.string().min(1),
  mods: z.string().optional(),
});

export const CreateSaleSchema = z.object({
  tableId: z.string().uuid().nullable().optional(),
  tableLabel: z.string().min(1),
  zoneName: z.string().min(1),
  mesero: z.string().nullable().optional(),
  cashier: z.string().nullable().optional(),
  method: z
    .enum(["efectivo", "tarjeta", "transferencia", "mixto"])
    .optional(),
  subtotalCents: z.number().int().nonnegative().optional(),
  ivaCents: z.number().int().nonnegative().optional(),
  totalCents: z.number().int().nonnegative(),
  items: z.array(ItemSchema).optional(),
  serviceDate: z.string().regex(DATE_RE),
});

export const SetGoalSchema = z.object({
  serviceDate: z.string().regex(DATE_RE),
  goalCents: z.number().int().nonnegative(),
});

export const CloseShiftSchema = z.object({
  serviceDate: z.string().regex(DATE_RE),
  countedCashCents: z.number().int().nonnegative(),
  notes: z.string().max(500).nullable().optional(),
  cashier: z.string().nullable().optional(),
  openingCents: z.number().int().nonnegative().optional(),
});
