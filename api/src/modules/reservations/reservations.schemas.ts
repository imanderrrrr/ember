import { z } from "zod";

/**
 * Schemas Zod del módulo Reservaciones.
 *
 * Convención (igual al módulo Salón):
 *   - `Schema`        → forma que devolvemos al cliente
 *   - `CreateSchema`  → body aceptado en POST
 */

const STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "seated",
  "completed",
  "no_show",
] as const;

/** "yyyy-mm-dd" — formato ISO de fecha sin hora. */
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date");
/** "HH:MM" formato 24h. */
const TIME_SLOT = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "invalid_time");

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  tableId: z.string().uuid().nullable(),
  date: ISO_DATE,
  timeSlot: TIME_SLOT,
  partySize: z.number().int().min(1).max(40),
  zoneName: z.string().min(1).max(80),
  tableLabel: z.string().min(1).max(20),
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().max(40).nullable(),
  customerEmail: z.string().max(120).nullable(),
  occasion: z.string().max(60).nullable(),
  restrictions: z.array(z.string().min(1).max(40)),
  notes: z.string().max(500).nullable(),
  mesero: z.string().max(120).nullable(),
  status: z.enum(STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateReservationSchema = z.object({
  tableId: z.string().uuid().nullable().optional(),
  date: ISO_DATE,
  timeSlot: TIME_SLOT,
  partySize: z.number().int().min(1).max(40),
  zoneName: z.string().trim().min(1).max(80),
  tableLabel: z.string().trim().min(1).max(20),
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().max(40).nullable().optional(),
  customerEmail: z.string().trim().max(120).nullable().optional(),
  occasion: z.string().trim().max(60).nullable().optional(),
  restrictions: z.array(z.string().trim().min(1).max(40)).optional().default([]),
  notes: z.string().trim().max(500).nullable().optional(),
  mesero: z.string().trim().max(120).nullable().optional(),
  // El cliente normalmente no manda status — default "confirmed".
  status: z.enum(STATUSES).optional().default("confirmed"),
});

export const RESERVATION_STATUSES = STATUSES;
