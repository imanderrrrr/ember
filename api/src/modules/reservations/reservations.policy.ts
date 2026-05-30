const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_SLOT = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BLOCKING_STATUSES = new Set(["pending", "confirmed", "seated"]);

export interface ReservationListFilters {
  date?: string;
  timeSlot?: string;
  tableId?: string;
  zoneName?: string;
  tableLabel?: string;
}

export class ReservationFilterError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function trimmed(value: string | string[] | undefined): string | undefined {
  const v = first(value)?.trim();
  return v ? v : undefined;
}

export function parseReservationListFilters(input: {
  date?: string | string[];
  timeSlot?: string | string[];
  tableId?: string | string[];
  zoneName?: string | string[];
  tableLabel?: string | string[];
}): ReservationListFilters {
  const date = trimmed(input.date);
  const timeSlot = trimmed(input.timeSlot);
  const tableId = trimmed(input.tableId);
  const zoneName = trimmed(input.zoneName);
  const tableLabel = trimmed(input.tableLabel);

  if (date && !ISO_DATE.test(date)) {
    throw new ReservationFilterError("invalid_date");
  }
  if (timeSlot && !TIME_SLOT.test(timeSlot)) {
    throw new ReservationFilterError("invalid_time");
  }
  if (tableId && !UUID.test(tableId)) {
    throw new ReservationFilterError("invalid_table_id");
  }

  return {
    ...(date ? { date } : {}),
    ...(timeSlot ? { timeSlot } : {}),
    ...(tableId ? { tableId } : {}),
    ...(zoneName ? { zoneName } : {}),
    ...(tableLabel ? { tableLabel } : {}),
  };
}

export function isBlockingReservationStatus(status: string): boolean {
  return BLOCKING_STATUSES.has(status);
}
