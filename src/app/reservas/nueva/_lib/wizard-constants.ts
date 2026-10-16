import type { ReservationDraft } from "./types";
import { formatDayLong, todayISO } from "./date-utils";

export const TODAY = todayISO();

export const INITIAL_DRAFT: ReservationDraft = {
  date: TODAY,
  dateLabel: formatDayLong(TODAY),
  timeSlot: "19:00",
  partySize: 4,
  tableId: null,
  tableLabel: null,
  zoneName: null,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  occasion: null,
  restrictions: [],
  notes: "",
  mesero: "",
};

export const DRAFT_KEY = "ember:reserva-draft";

export const TOTAL_STEPS = 5;

export const STEP_META: { number: string; label: string; sub: string }[] = [
  { number: "01", label: "FECHA Y HORA", sub: "Define cuándo y cuántos" },
  { number: "02", label: "DISPONIBILIDAD", sub: "Valida capacidad y zonas" },
  { number: "03", label: "MESA Y ZONA", sub: "Asignación de mesa" },
  { number: "04", label: "CLIENTE", sub: "Datos del huésped" },
  { number: "05", label: "CONFIRMAR", sub: "Revisar y reservar" },
];

export const TIME_REMAINING: Record<number, string> = {
  1: "3 min restantes",
  2: "2 min restantes",
  3: "1 min 30s restantes",
  4: "45 s restantes",
  5: "Casi listo",
};
