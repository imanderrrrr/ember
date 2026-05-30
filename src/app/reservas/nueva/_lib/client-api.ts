"use client";

import { jsonOrThrow } from "../../_lib/client-api";

/**
 * Cliente browser especifico del wizard de Reservaciones.
 *
 * Las operaciones del recurso reserva viven en `app/reservas/_lib`; este
 * archivo agrega lo propio del wizard, como leer el plano del salon.
 */

export type { ReservationDTO, ReservationPayload } from "../../_lib/types";
export {
  createReservation,
  listReservationsByDate,
  listReservationsByTable,
} from "../../_lib/client-api";

/* ─── Floor plan del salón — fuente real de zonas y mesas ────────────── */

export interface SalonZoneDTO {
  id: string;
  name: string;
  ord: number;
}

export interface SalonTableDTO {
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
}

export interface SalonFloorPlanDTO {
  zones: SalonZoneDTO[];
  tables: SalonTableDTO[];
}

/** Trae el plano completo del salón (zonas + mesas). El wizard usa esto
 *  para descubrir qué zonas existen y qué capacidad tiene cada mesa. */
export async function getSalonFloorPlan(): Promise<SalonFloorPlanDTO> {
  return jsonOrThrow<SalonFloorPlanDTO>(
    fetch("/api/salon/floor-plan", { cache: "no-store" }),
  );
}

/* ─── Meseros — para el selector de "mesero responsable" ─────────────── */

export interface MeseroDTO {
  id: string;
  name: string;
  avatarInitials: string;
  role: string;
}

/** Lista los perfiles de mesero reales (rol = "mesero"). */
export async function listMeseros(): Promise<MeseroDTO[]> {
  return jsonOrThrow<MeseroDTO[]>(
    fetch("/api/staff?role=mesero", { cache: "no-store" }),
  );
}
