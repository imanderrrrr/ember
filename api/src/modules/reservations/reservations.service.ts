import * as repo from "./reservations.repository.js";
import type { Reservation } from "../../db/schema.js";
import {
  isBlockingReservationStatus,
  type ReservationListFilters,
} from "./reservations.policy.js";
import { sendReservationConfirmation } from "../../lib/mailer.js";

/**
 * Service del módulo Reservaciones. Lógica de dominio + mapping DB ↔ wire.
 *
 * Por ahora la creación es directa — no hay reglas de negocio salvo
 * validación Zod en la ruta. Cuando agreguemos "no permitir reservar en
 * fecha pasada", "evitar doble booking en misma mesa+hora", etc., el código
 * vive acá.
 */

export interface ReservationDTO {
  id: string;
  tableId: string | null;
  date: string;
  timeSlot: string;
  partySize: number;
  zoneName: string;
  tableLabel: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  occasion: string | null;
  restrictions: string[];
  notes: string | null;
  mesero: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function toDTO(r: Reservation): ReservationDTO {
  return {
    id: r.id,
    tableId: r.tableId,
    date: r.date,
    timeSlot: r.timeSlot,
    partySize: r.partySize,
    zoneName: r.zoneName,
    tableLabel: r.tableLabel,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerEmail: r.customerEmail,
    occasion: r.occasion,
    restrictions: r.restrictions ?? [],
    notes: r.notes,
    mesero: r.mesero,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const BLOCKING_STATUSES = ["pending", "confirmed", "seated"];

export async function listReservations(
  filters: ReservationListFilters = {},
): Promise<ReservationDTO[]> {
  const rows = await repo.listReservations(filters);
  return rows.map(toDTO);
}

export async function getReservation(id: string): Promise<ReservationDTO> {
  const row = await repo.findReservationById(id);
  if (!row) {
    throw new DomainError("reservation_not_found", "Reservación no encontrada", 404);
  }
  return toDTO(row);
}

export async function createReservation(input: {
  tableId?: string | null;
  date: string;
  timeSlot: string;
  partySize: number;
  zoneName: string;
  tableLabel: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  occasion?: string | null;
  restrictions?: string[];
  notes?: string | null;
  mesero?: string | null;
  status?: string;
}): Promise<ReservationDTO> {
  // Validación de dominio mínima: no permitir reservar en fecha pasada
  // (validamos formato en Zod; el rango lo chequeamos acá porque depende del
  // reloj del servidor).
  const today = new Date().toISOString().slice(0, 10);
  if (input.date < today) {
    throw new DomainError(
      "past_date",
      "No se puede reservar en una fecha pasada",
      422,
    );
  }
  const status = input.status ?? "confirmed";
  if (
    isBlockingReservationStatus(status) &&
    (input.tableId || (input.zoneName && input.tableLabel))
  ) {
    const existing = await repo.findBlockingReservation({
      date: input.date,
      timeSlot: input.timeSlot,
      tableId: input.tableId ?? null,
      zoneName: input.zoneName,
      tableLabel: input.tableLabel,
      statuses: BLOCKING_STATUSES,
    });
    if (existing) {
      throw new DomainError(
        "reservation_conflict",
        "La mesa ya tiene una reservación activa en ese horario",
        409,
      );
    }
  }

  const row = await repo.insertReservation({
    tableId: input.tableId ?? null,
    date: input.date,
    timeSlot: input.timeSlot,
    partySize: input.partySize,
    zoneName: input.zoneName,
    tableLabel: input.tableLabel,
    customerName: input.customerName,
    customerPhone: input.customerPhone ?? null,
    customerEmail: input.customerEmail ?? null,
    occasion: input.occasion ?? null,
    restrictions: input.restrictions ?? [],
    notes: input.notes ?? null,
    mesero: input.mesero ?? null,
    status,
  });

  // Efecto secundario: enviar la confirmación al correo del cliente. No se
  // espera (fire-and-forget) ni se deja que falle el alta de la reserva.
  void sendReservationConfirmation({
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    date: row.date,
    timeSlot: row.timeSlot,
    partySize: row.partySize,
    zoneName: row.zoneName,
    tableLabel: row.tableLabel,
    occasion: row.occasion,
    restrictions: row.restrictions ?? [],
    mesero: row.mesero,
  });

  return toDTO(row);
}
