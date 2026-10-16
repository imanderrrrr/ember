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
  /** Mesero responsable (nombre). Se elige del roster en el paso 4. */
  mesero: string;
}

export type ZoneBadge = "PREFERIDA" | "DISPONIBLE" | "LIMITADA" | "CERRADA";

export interface ZoneTable {
  tableId: string;
  id: string;
  shape: "round" | "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  seats: number;
  seatsLabel?: string;
  reservedBy?: string;
  fontSize?: number;
}

export interface ZoneAlt {
  label: string;
  labelColor?: string;
  meta: string;
  chip: {
    icon?: "check" | "clock" | "x";
    text: string;
    tone: "good" | "warn" | "muted" | "bad";
  };
  dotColor: string;
  dotX: number;
  muted?: boolean;
}

export type ZoneKey = "terraza" | "salon" | "barra" | "privado";

export interface ZoneDef {
  key: ZoneKey;
  name: string;
  shortName: string;
  badge: ZoneBadge;
  total: number;
  totalSeats: number;
  disabled?: boolean;
  preferred?: boolean;
  subline: string;
  dotColor: string;
  sectorBg: string;
  recommendation: { tableId: string; reasons: string[] } | null;
  tables: ZoneTable[];
  alts: ZoneAlt[];
}

export interface SalonFloorPlanLike {
  zones: { id: string; name: string; ord: number }[];
  tables: {
    id: string;
    zoneId: string;
    label: string;
    shape: "round" | "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    seats: number;
  }[];
}

export type DayDot = "alta" | "media" | "baja" | "cerrado" | "none";
export type TurnoKey = "comida" | "cena";
