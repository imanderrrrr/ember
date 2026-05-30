"use client";

import type { ReservationDTO, ReservationPayload } from "./types";

/**
 * Cliente browser compartido del modulo Reservaciones.
 *
 * Habla con el proxy autenticado de Next en `/api/reservations/*`, que
 * reenvia al api Hono. El browser nunca llega directo al backend.
 */

export type { ReservationDTO, ReservationPayload } from "./types";

export async function jsonOrThrow<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise;
  const body = await res.text().catch(() => "");
  if (!res.ok) {
    let detail = body.slice(0, 240);
    try {
      const parsed = JSON.parse(body);
      if (parsed?.message) detail = parsed.message;
      else if (parsed?.error) detail = parsed.error;
    } catch {
      // El backend no siempre devuelve JSON en errores de infraestructura.
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return JSON.parse(body) as T;
}

export async function createReservation(
  payload: ReservationPayload,
): Promise<ReservationDTO> {
  return jsonOrThrow<ReservationDTO>(
    fetch("/api/reservations/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

/** Lista las reservas de una fecha especifica (formato yyyy-mm-dd). */
export async function listReservationsByDate(
  date: string,
): Promise<ReservationDTO[]> {
  return jsonOrThrow<ReservationDTO[]>(
    fetch(`/api/reservations/?date=${encodeURIComponent(date)}`, {
      cache: "no-store",
    }),
  );
}

export async function listReservationsByTable(input: {
  tableId: string;
  date?: string;
  zoneName?: string;
  tableLabel?: string;
}): Promise<ReservationDTO[]> {
  const params = new URLSearchParams({ tableId: input.tableId });
  if (input.date) params.set("date", input.date);
  if (input.zoneName) params.set("zoneName", input.zoneName);
  if (input.tableLabel) params.set("tableLabel", input.tableLabel);
  return jsonOrThrow<ReservationDTO[]>(
    fetch(`/api/reservations/?${params.toString()}`, {
      cache: "no-store",
    }),
  );
}
