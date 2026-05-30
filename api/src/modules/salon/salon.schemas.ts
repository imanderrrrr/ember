import { z } from "zod";

/**
 * Schemas Zod para el dominio Salón.
 *
 * Convención: cada entidad expone tres schemas:
 *   - `Schema`        → forma que devolvemos al cliente
 *   - `CreateSchema`  → body aceptado en POST
 *   - `UpdateSchema`  → body aceptado en PATCH (todos los campos opcionales,
 *                       valida que el body no esté vacío)
 *
 * Los IDs van por path param, nunca en el body — los validamos por separado.
 */

const STATUS = [
  "libre",
  "ocupada",
  "reservada",
  "cocina",
  "esperando",
  "limpieza",
] as const;

const SHAPE = ["round", "rect"] as const;

const SHAPE_KIND = [
  "wall",
  "door",
  "window",
  "plant",
  "column",
  "restroom",
  "bar",
  "kitchen_pass",
  "divider",
  "text",
] as const;

export const zoneIdParam = z.object({ id: z.string().uuid() });

export const ZoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  ord: z.number().int(),
});

export const CreateZoneSchema = z.object({
  name: z.string().trim().min(1).max(80),
  ord: z.number().int().optional(),
});

export const UpdateZoneSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    ord: z.number().int().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "empty_body" });

export const TableSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  label: z.string(),
  shape: z.enum(SHAPE),
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
  seats: z.number().int(),
  rotation: z.number().int(),
  status: z.enum(STATUS),
  customerName: z.string().nullable(),
  partySize: z.number().int().nullable(),
  notes: z.string().nullable(),
});

export const CreateTableSchema = z.object({
  zoneId: z.string().uuid(),
  label: z.string().trim().min(1).max(8),
  shape: z.enum(SHAPE).default("round"),
  x: z.number().int().min(0).max(2000),
  y: z.number().int().min(0).max(2000),
  width: z.number().int().min(24).max(400),
  height: z.number().int().min(24).max(400),
  seats: z.number().int().min(1).max(20).default(4),
  rotation: z.number().int().min(0).max(359).default(0),
  status: z.enum(STATUS).default("libre"),
  customerName: z.string().trim().max(80).nullable().optional(),
  partySize: z.number().int().min(0).max(40).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const UpdateTableSchema = z
  .object({
    zoneId: z.string().uuid().optional(),
    label: z.string().trim().min(1).max(8).optional(),
    shape: z.enum(SHAPE).optional(),
    x: z.number().int().min(0).max(2000).optional(),
    y: z.number().int().min(0).max(2000).optional(),
    width: z.number().int().min(24).max(400).optional(),
    height: z.number().int().min(24).max(400).optional(),
    seats: z.number().int().min(1).max(20).optional(),
    rotation: z.number().int().min(0).max(359).optional(),
    status: z.enum(STATUS).optional(),
    // Nullable + optional: el cliente puede mandar `null` para limpiar el
    // campo, u omitirlo si no quiere tocarlo.
    customerName: z.string().trim().max(80).nullable().optional(),
    partySize: z.number().int().min(0).max(40).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "empty_body" });

export const ShapeSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid().nullable(),
  kind: z.enum(SHAPE_KIND),
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
  rotation: z.number().int(),
  label: z.string().nullable(),
});

export const CreateShapeSchema = z.object({
  zoneId: z.string().uuid().nullable().optional(),
  kind: z.enum(SHAPE_KIND),
  x: z.number().int().min(0).max(2000),
  y: z.number().int().min(0).max(2000),
  width: z.number().int().min(1).max(2000),
  height: z.number().int().min(1).max(2000),
  rotation: z.number().int().min(0).max(359).default(0),
  label: z.string().trim().max(60).nullable().optional(),
});

export const UpdateShapeSchema = z
  .object({
    zoneId: z.string().uuid().nullable().optional(),
    kind: z.enum(SHAPE_KIND).optional(),
    x: z.number().int().min(0).max(2000).optional(),
    y: z.number().int().min(0).max(2000).optional(),
    width: z.number().int().min(1).max(2000).optional(),
    height: z.number().int().min(1).max(2000).optional(),
    rotation: z.number().int().min(0).max(359).optional(),
    label: z.string().trim().max(60).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "empty_body" });

export const FloorPlanSchema = z.object({
  zones: z.array(ZoneSchema),
  tables: z.array(TableSchema),
  shapes: z.array(ShapeSchema),
});

export const STATUSES = STATUS;
export const SHAPES = SHAPE;
export const SHAPE_KINDS = SHAPE_KIND;
