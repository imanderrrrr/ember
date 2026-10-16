import type { SalonTable, TableStatus } from "./types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";

export interface TableDecor {
  timer?: string;
  star?: boolean;
}

export const TABLE_DECOR: Record<string, TableDecor> = {
  // Salón principal
  "02": { timer: "01:12" },
  "06": { timer: "00:35" },
  "04": { timer: "00:45" },
  "07": { timer: "01:24:38", star: true },
  "08": { timer: "01:45" },
  // Terraza
  T2: { timer: "00:55" },
  T3: { timer: "01:30" },
  T8: { timer: "00:20" },
  // Barra
  B2: { timer: "00:45" },
  B3: { timer: "01:10" },
  B5: { timer: "01:55" },
  // VIP
  V1: { timer: "02:10", star: true },
  V2: { timer: "00:30" },
};

export const SUBLABEL_FALLBACK: Record<"ocupada" | "cocina" | "esperando", string> = {
  ocupada: "OCUPADA",
  cocina: "EN COCINA",
  esperando: "CUENTA",
};

export const ROLE_LABEL: Record<string, string> = {
  gerente_operativo: "Gerente operativo",
  anfitrion: "Anfitrión",
  mesero: "Mesero",
  cocina: "Cocina",
  caja: "Caja",
  admin: "Administrador",
};

export function roleLabel(role: string | null): string {
  if (!role) return "En turno";
  return (
    ROLE_LABEL[role] ??
    role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")
  );
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: "Por confirmar",
  confirmed: "Confirmada",
  seated: "Sentada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No-show",
};

export function isActiveReservation(r: ReservationDTO): boolean {
  return r.status === "confirmed" || r.status === "pending";
}

export function minutesOf(timeSlot: string): number {
  const [h, m] = timeSlot.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function reservationsForTable(
  reservations: ReservationDTO[],
  table: SalonTable,
  zoneName?: string | null,
): ReservationDTO[] {
  return reservations
    .filter(
      (r) =>
        isActiveReservation(r) &&
        (r.tableId === table.id ||
          (r.tableLabel === table.label && (!zoneName || r.zoneName === zoneName))),
    )
    .sort((a, b) => minutesOf(a.timeSlot) - minutesOf(b.timeSlot));
}

export function allReservationsForTable(
  reservations: ReservationDTO[],
  table: SalonTable,
  zoneName?: string | null,
): ReservationDTO[] {
  return reservations
    .filter(
      (r) =>
        r.tableId === table.id ||
        (r.tableLabel === table.label && (!zoneName || r.zoneName === zoneName)),
    )
    .sort((a, b) => minutesOf(a.timeSlot) - minutesOf(b.timeSlot));
}

export function nextReservationForTable(
  reservations: ReservationDTO[],
  table: SalonTable,
  zoneName?: string | null,
): ReservationDTO | null {
  const active = reservationsForTable(reservations, table, zoneName);
  return active[0] ?? null;
}

export function effectiveStatus(
  table: SalonTable,
  reservation: ReservationDTO | null,
): TableStatus {
  if (table.status === "libre" && reservation) return "reservada";
  return table.status;
}

export function subLabelFor(
  table: SalonTable,
  decor: TableDecor,
  reservation: ReservationDTO | null,
): string | null {
  const eff = effectiveStatus(table, reservation);
  if (eff === "reservada") {
    return reservation?.timeSlot ?? null;
  }
  if (decor.timer) return decor.timer;
  if (eff === "ocupada" || eff === "cocina" || eff === "esperando") {
    return SUBLABEL_FALLBACK[eff];
  }
  return null;
}

export function formatReservationDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("es-GT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  }
  return value;
}
