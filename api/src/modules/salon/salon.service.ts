import * as repo from "./salon.repository.js";
import type {
  Zone,
  SalonTable as TableRow,
  Shape as ShapeRow,
} from "../../db/schema.js";

/**
 * Service: lógica de dominio y mapeo DB ↔ wire-format.
 *
 * El wire-format usa `camelCase` y omite timestamps internos. Cualquier
 * regla de negocio (validar máximo de zonas, evitar borrar la única zona,
 * etc.) vive acá, no en el route.
 */

const MAX_ZONES = 20;

export interface ZoneDTO {
  id: string;
  name: string;
  ord: number;
}

export interface TableDTO {
  id: string;
  zoneId: string;
  label: string;
  shape: "round" | "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  rotation: number;
  status: string;
  // Ficha rápida — nullables: no toda mesa tiene cliente/notas asignados.
  customerName: string | null;
  partySize: number | null;
  notes: string | null;
}

export interface ShapeDTO {
  id: string;
  zoneId: string | null;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string | null;
}

export interface FloorPlanDTO {
  zones: ZoneDTO[];
  tables: TableDTO[];
  shapes: ShapeDTO[];
}

function toZoneDTO(z: Zone): ZoneDTO {
  return { id: z.id, name: z.name, ord: z.ord };
}

function toTableDTO(t: TableRow): TableDTO {
  return {
    id: t.id,
    zoneId: t.zoneId,
    label: t.label,
    shape: t.shape as "round" | "rect",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    seats: t.seats,
    rotation: t.rotation,
    status: t.status,
    customerName: t.customerName,
    partySize: t.partySize,
    notes: t.notes,
  };
}

function toShapeDTO(s: ShapeRow): ShapeDTO {
  return {
    id: s.id,
    zoneId: s.zoneId,
    kind: s.kind,
    x: s.x,
    y: s.y,
    width: s.width,
    height: s.height,
    rotation: s.rotation,
    label: s.label,
  };
}

export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

/* ─── Aggregate ─── */

export async function getFloorPlan(): Promise<FloorPlanDTO> {
  const [zonesRows, tablesRows, shapesRows] = await Promise.all([
    repo.listZones(),
    repo.listTables(),
    repo.listShapes(),
  ]);
  return {
    zones: zonesRows.map(toZoneDTO),
    tables: tablesRows.map(toTableDTO),
    shapes: shapesRows.map(toShapeDTO),
  };
}

/* ─── Zones ─── */

export async function listZones(): Promise<ZoneDTO[]> {
  const rows = await repo.listZones();
  return rows.map(toZoneDTO);
}

export async function createZone(input: { name: string; ord?: number }): Promise<ZoneDTO> {
  const existing = await repo.listZones();
  if (existing.length >= MAX_ZONES) {
    throw new DomainError("too_many_zones", `Máximo ${MAX_ZONES} zonas`, 422);
  }
  const ord = input.ord ?? existing.length;
  const row = await repo.insertZone({ name: input.name, ord });
  return toZoneDTO(row);
}

export async function updateZone(
  id: string,
  input: { name?: string; ord?: number },
): Promise<ZoneDTO> {
  const row = await repo.updateZoneById(id, input);
  if (!row) throw new DomainError("zone_not_found", "Zona no encontrada", 404);
  return toZoneDTO(row);
}

export async function deleteZone(id: string): Promise<void> {
  const row = await repo.deleteZoneById(id);
  if (!row) throw new DomainError("zone_not_found", "Zona no encontrada", 404);
}

/* ─── Tables ─── */

export async function createTable(input: {
  zoneId: string;
  label: string;
  shape: "round" | "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  rotation: number;
  status: string;
  customerName?: string | null;
  partySize?: number | null;
  notes?: string | null;
}): Promise<TableDTO> {
  const zone = await repo.findZoneById(input.zoneId);
  if (!zone) throw new DomainError("zone_not_found", "Zona no encontrada", 404);
  const row = await repo.insertTable(input);
  return toTableDTO(row);
}

export async function updateTable(
  id: string,
  input: Partial<{
    zoneId: string;
    label: string;
    shape: "round" | "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    seats: number;
    rotation: number;
    status: string;
    customerName: string | null;
    partySize: number | null;
    notes: string | null;
  }>,
): Promise<TableDTO> {
  if (input.zoneId) {
    const zone = await repo.findZoneById(input.zoneId);
    if (!zone) throw new DomainError("zone_not_found", "Zona no encontrada", 404);
  }
  const row = await repo.updateTableById(id, input);
  if (!row) throw new DomainError("table_not_found", "Mesa no encontrada", 404);
  return toTableDTO(row);
}

export async function deleteTable(id: string): Promise<void> {
  const row = await repo.deleteTableById(id);
  if (!row) throw new DomainError("table_not_found", "Mesa no encontrada", 404);
}

/* ─── Shapes ─── */

export async function createShape(input: {
  zoneId?: string | null;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string | null;
}): Promise<ShapeDTO> {
  if (input.zoneId) {
    const zone = await repo.findZoneById(input.zoneId);
    if (!zone) throw new DomainError("zone_not_found", "Zona no encontrada", 404);
  }
  const row = await repo.insertShape({
    zoneId: input.zoneId ?? null,
    kind: input.kind,
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
    rotation: input.rotation,
    label: input.label ?? null,
  });
  return toShapeDTO(row);
}

export async function updateShape(
  id: string,
  input: Partial<{
    zoneId: string | null;
    kind: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    label: string | null;
  }>,
): Promise<ShapeDTO> {
  if (input.zoneId) {
    const zone = await repo.findZoneById(input.zoneId);
    if (!zone) throw new DomainError("zone_not_found", "Zona no encontrada", 404);
  }
  const row = await repo.updateShapeById(id, input);
  if (!row) throw new DomainError("shape_not_found", "Forma no encontrada", 404);
  return toShapeDTO(row);
}

export async function deleteShape(id: string): Promise<void> {
  const row = await repo.deleteShapeById(id);
  if (!row) throw new DomainError("shape_not_found", "Forma no encontrada", 404);
}
