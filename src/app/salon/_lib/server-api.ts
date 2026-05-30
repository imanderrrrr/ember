import "server-only";
import type { FloorPlan } from "./types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";

/**
 * Cliente server-side del módulo Salón.
 *
 * Usa `API_URL` (red interna del docker compose) para hablar con el api
 * Hono. Solo se importa desde Server Components y Route Handlers.
 */

const API_URL = process.env.API_URL ?? "http://api:3001";

export async function fetchFloorPlan(): Promise<FloorPlan> {
  const res = await fetch(`${API_URL}/salon/floor-plan`, {
    // El plano cambia con cada edit — no cachear.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`fetchFloorPlan failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchReservations(filters: {
  date?: string;
  tableId?: string;
  zoneName?: string;
  tableLabel?: string;
} = {}): Promise<ReservationDTO[]> {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.tableId) params.set("tableId", filters.tableId);
  if (filters.zoneName) params.set("zoneName", filters.zoneName);
  if (filters.tableLabel) params.set("tableLabel", filters.tableLabel);

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/reservations${suffix}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`fetchReservations failed: ${res.status}`);
  }
  return res.json();
}
