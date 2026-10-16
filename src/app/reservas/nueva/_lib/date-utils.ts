export const DAYS_LONG = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** ISO yyyy-mm-dd de hoy según el reloj del sistema. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "Lunes 25 de mayo" — usado en sidebars y cards de resumen. */
export function formatDayLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_LONG[dt.getDay()]} ${d} de ${MONTHS_LONG[m - 1]}`;
}

/** "Lun 25 may" — usado en subtítulos compactos (paso 3). */
export function formatDayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_SHORT[dt.getDay()]} ${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]}`;
}

/** "12s" / "3m" / "1h" — etiqueta compacta para el chip de borrador. */
export function relTimeShort(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
