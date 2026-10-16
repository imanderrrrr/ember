/**
 * Contrato DTO compartido para Reservaciones.
 */

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled";

export const BLOCKING_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  "pending",
  "confirmed",
  "seated",
] as const;

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

export interface ReservationPayload {
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
}

export interface ReservationDraft {
  date: string; // ISO yyyy-mm-dd
  dateLabel: string; // "Jueves 14 de mayo"
  timeSlot: string; // "19:00"
  partySize: number;
  tableId: string | null;
  tableLabel: string | null;
  zoneName: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  occasion: string | null;
  restrictions: string[];
  notes: string;
  mesero: string;
}

export interface ReservationListFilters {
  date?: string;
  timeSlot?: string;
  tableId?: string;
  zoneName?: string;
  tableLabel?: string;
}
