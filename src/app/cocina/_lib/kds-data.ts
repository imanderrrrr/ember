import type { KitchenOrderDTO } from "./orders";

/**
 * Modelo de datos del KDS (Kitchen Display System).
 *
 * Mientras no exista el módulo de órdenes en el backend, el board se alimenta
 * de:
 *   1. Tickets demo (curados, fieles al diseño) que pueblan el tablero.
 *   2. Tickets reales derivados de las mesas en estado "cocina" (lo que el
 *      mesero envía desde Mesa activa) — se anexan a la columna "Nuevas".
 *
 * El estado del ticket (columna) y los cronómetros viven en el cliente; al
 * "Marcar entregado" un ticket real se persiste el cambio de la mesa.
 */

export type TicketStatus = "nueva" | "preparacion" | "lista" | "demorada";

export type Station =
  | "entradas"
  | "parrilla"
  | "platos"
  | "postres"
  | "bebidas";

export type TicketVariant = "default" | "vip" | "takeaway";

export interface TicketItem {
  qty: number;
  name: string;
  /** Modificadores/observaciones de cocción (texto secundario). */
  mods?: string;
}

export interface Ticket {
  id: string;
  status: TicketStatus;
  tableLabel: string;
  zoneName: string;
  comanda: string; // "#4821"
  comensales: number;
  mesero: string;
  ingreso: string; // "13:14"
  /** Segundos transcurridos desde el ingreso (cronómetro en vivo). */
  elapsedSec: number;
  /** Objetivo de preparación en segundos. */
  targetSec: number;
  items: TicketItem[];
  station: Station;
  /** Etiqueta de categoría para el chip (ej. "ENTRADAS", "PLATOS FUERTES"). */
  category: string;
  /** Nota crítica (alergias) — chip rojo en la tarjeta. */
  note?: string;
  vip?: boolean;
  variant?: TicketVariant;
  /** Avance de línea para tickets en preparación. */
  stages?: { done: number; total: number };
  /** Reclamos (tickets demorados). */
  reclamos?: number;
  lastReclamo?: string;
  glutenFree?: boolean;
  /** Si el ticket proviene de una mesa real, su id para persistir cambios. */
  tableId?: string;
  /** Si el ticket proviene de una orden real (DB), su id para hacer PATCH. */
  orderId?: string;
  /** Epoch ms de ingreso real (orden); el board calcula el elapsed en vivo. */
  startedAtMs?: number;
}

export const STATION_LABEL: Record<Station, string> = {
  entradas: "Entradas",
  parrilla: "Parrilla",
  platos: "Platos fuertes",
  postres: "Postres",
  bebidas: "Bebidas",
};

export const STATION_TABS: { key: Station | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "entradas", label: "Entradas" },
  { key: "parrilla", label: "Parrilla" },
  { key: "platos", label: "Platos fuertes" },
  { key: "postres", label: "Postres" },
  { key: "bebidas", label: "Bebidas" },
];

/** mm:ss a partir de segundos. */
export function formatTimer(sec: number): string {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


const VALID_STATIONS: Station[] = [
  "entradas",
  "parrilla",
  "platos",
  "postres",
  "bebidas",
];
const VALID_STATUSES: TicketStatus[] = [
  "nueva",
  "preparacion",
  "lista",
  "demorada",
];

/**
 * Convierte una orden real (de la DB, enviada por el mesero) en un ticket del
 * KDS. No calcula el tiempo aquí (sería impuro en el render del server): guarda
 * `startedAtMs` y el board cliente computa el cronómetro en vivo.
 */
export function ticketFromOrder(o: KitchenOrderDTO): Ticket {
  const station: Station = VALID_STATIONS.includes(o.station as Station)
    ? (o.station as Station)
    : "platos";
  const status: TicketStatus = VALID_STATUSES.includes(o.status as TicketStatus)
    ? (o.status as TicketStatus)
    : "nueva";
  // Parsear un string fijo es puro (no usa la hora actual).
  const created = new Date(o.createdAt);
  const startedAtMs = created.getTime();
  const ingreso = `${String(created.getHours()).padStart(2, "0")}:${String(
    created.getMinutes(),
  ).padStart(2, "0")}`;
  const items: TicketItem[] =
    o.items.length > 0
      ? o.items.map((it) => ({ qty: it.qty, name: it.name, mods: it.mods }))
      : [{ qty: 1, name: "Comanda enviada" }];

  return {
    id: o.id,
    orderId: o.id,
    tableId: o.tableId ?? undefined,
    startedAtMs,
    status,
    tableLabel: o.tableLabel,
    zoneName: o.zoneName,
    comanda: `#${o.id.slice(0, 4).toUpperCase()}`,
    comensales: o.partySize,
    mesero: o.mesero ?? "Mesero",
    ingreso,
    elapsedSec: 0,
    targetSec: 14 * 60,
    station,
    category: STATION_LABEL[station].toUpperCase(),
    items,
    stages:
      status === "preparacion" ? { done: 0, total: items.length } : undefined,
  };
}
