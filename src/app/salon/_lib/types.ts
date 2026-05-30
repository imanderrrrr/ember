/**
 * Tipos compartidos del módulo Salón. Espejan los DTOs del backend
 * (api/src/modules/salon/salon.service.ts). Si el contrato cambia ahí,
 * hay que actualizarlos aquí — no hay generación automática todavía.
 */

export type TableShape = "round" | "rect";

export type TableStatus =
  | "libre"
  | "ocupada"
  | "reservada"
  | "cocina"
  | "esperando"
  | "limpieza";

export type ShapeKind =
  | "wall"
  | "door"
  | "window"
  | "plant"
  | "column"
  | "restroom"
  | "bar"
  | "kitchen_pass"
  | "divider"
  | "text";

export interface Zone {
  id: string;
  name: string;
  ord: number;
}

export interface SalonTable {
  id: string;
  zoneId: string;
  label: string;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  rotation: number;
  status: TableStatus;
  /**
   * Ficha rápida — datos visibles en el panel derecho del salón en vivo.
   * Nullables: una mesa libre no tiene cliente/comensales/notas.
   */
  customerName: string | null;
  partySize: number | null;
  notes: string | null;
}

export interface Shape {
  id: string;
  zoneId: string | null;
  kind: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string | null;
}

export interface FloorPlan {
  zones: Zone[];
  tables: SalonTable[];
  shapes: Shape[];
}

export const TABLE_STATUSES: TableStatus[] = [
  "libre",
  "ocupada",
  "reservada",
  "cocina",
  "esperando",
  "limpieza",
];

export const SHAPE_KINDS: { kind: ShapeKind; label: string }[] = [
  { kind: "wall", label: "Pared" },
  { kind: "door", label: "Puerta" },
  { kind: "window", label: "Ventanal" },
  { kind: "plant", label: "Planta" },
  { kind: "column", label: "Columna" },
  { kind: "restroom", label: "Baños" },
  { kind: "bar", label: "Barra" },
  { kind: "kitchen_pass", label: "Pase de cocina" },
  { kind: "divider", label: "Divisor" },
  { kind: "text", label: "Texto" },
];

export const STATUS_COLOR: Record<TableStatus, string> = {
  libre: "#7c8a6a",
  ocupada: "#C95A3D",
  reservada: "#D8A641",
  cocina: "#4E7DA6",
  esperando: "#7D5BA6",
  limpieza: "#a89d8e",
};

export const STATUS_LABEL: Record<TableStatus, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  reservada: "Reservada",
  cocina: "En cocina",
  esperando: "Esperando cuenta",
  limpieza: "Limpieza pendiente",
};
