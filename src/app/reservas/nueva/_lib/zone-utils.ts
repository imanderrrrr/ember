import type {
  ReservationDraft,
  SalonFloorPlanLike,
  ZoneBadge,
  ZoneDef,
  ZoneKey,
  ZoneTable,
} from "./types";
import type { ReservationDTO } from "./client-api";

export const SHORT_NAME: Record<string, string> = {
  "Salón principal": "Salón",
  Terraza: "Terraza",
  Barra: "Barra",
  VIP: "VIP",
};

export function buildZones(floorPlan: SalonFloorPlanLike): ZoneDef[] {
  const sorted = [...floorPlan.zones].sort((a, b) => a.ord - b.ord);
  return sorted.map((z, idx) => {
    const tables: ZoneTable[] = floorPlan.tables
      .filter((t) => t.zoneId === z.id)
      .map((t) => ({
        id: t.label,
        tableId: t.id,
        shape: t.shape,
        x: t.x,
        y: t.y,
        w: t.width,
        h: t.height,
        seats: t.seats,
        seatsLabel: t.seats >= 6 ? `${t.seats} PAX` : undefined,
        fontSize: t.seats >= 6 ? 16 : undefined,
      }));
    const totalSeats = tables.reduce((acc, t) => acc + t.seats, 0);
    const preferred = idx === 0;
    return {
      key: (z.id as ZoneKey) ?? z.name,
      name: z.name,
      shortName: SHORT_NAME[z.name] ?? z.name,
      badge: preferred ? "PREFERIDA" : "DISPONIBLE",
      total: tables.length,
      totalSeats,
      preferred,
      subline: `Capacidad ${totalSeats} personas`,
      dotColor: "#7c8a6a",
      sectorBg: preferred ? "#f7f3ee" : "#FFFFFF",
      recommendation: null,
      tables,
      alts: [],
    };
  });
}

/** Recalcula el badge de una zona según cuántas mesas tiene libres ahora. */
export function badgeFor(zone: ZoneDef, occupied: number): ZoneBadge {
  const free = zone.total - occupied;
  if (free <= 0) return "CERRADA";
  if (zone.preferred) return "PREFERIDA";
  if (free / zone.total <= 0.35) return "LIMITADA";
  return "DISPONIBLE";
}

export function findZone(zones: ZoneDef[], name: string | null): ZoneDef | null {
  return zones.find((z) => z.name === name) ?? null;
}

export function findDraftTable(
  zones: ZoneDef[],
  draft: ReservationDraft,
): { zone: ZoneDef; table: ZoneTable } | null {
  for (const zone of zones) {
    const table = zone.tables.find(
      (t) =>
        (draft.tableId && t.tableId === draft.tableId) ||
        (draft.tableLabel && t.id === draft.tableLabel),
    );
    if (table) return { zone, table };
  }
  return null;
}

export function recommendForZone(
  zone: ZoneDef,
  partySize: number,
  reservedSet: Set<string>,
): { tableId: string | null; reasons: string[]; noFit?: boolean } {
  const available = zone.tables.filter((t) => !reservedSet.has(t.id));
  const fits = available.filter((t) => t.seats >= partySize);
  if (fits.length === 0) {
    const maxAvailable = available.reduce(
      (acc, t) => (t.seats > acc ? t.seats : acc),
      0,
    );
    return {
      tableId: null,
      reasons: [
        `Ningún mesa individual cubre ${partySize} personas en ${zone.shortName.toLowerCase()}.`,
        maxAvailable > 0
          ? `La mesa más grande aquí es para ${maxAvailable}.`
          : "No hay mesas libres en este sector.",
        "Considera combinar mesas en piso o probar otro sector.",
      ],
      noFit: true,
    };
  }
  fits.sort((a, b) => a.seats - b.seats);
  const best = fits[0];
  const slack = best.seats - partySize;
  return {
    tableId: best.id,
    reasons: [
      slack === 0
        ? `Capacidad exacta (${best.seats} para ${partySize})`
        : slack <= 1
          ? `Capacidad ideal (${best.seats} para ${partySize})`
          : `Capacidad generosa (${best.seats} para ${partySize})`,
      "Disponible para tu fecha y hora",
      `Sector ${zone.shortName.toLowerCase()} con ${available.length} mesas libres`,
    ],
  };
}

export function recommendedTableForDraft(
  zones: ZoneDef[],
  draft: ReservationDraft,
  reservations: ReservationDTO[],
): { zone: ZoneDef; table: ZoneTable } | null {
  const prefilled = findDraftTable(zones, draft);
  if (prefilled) return prefilled;

  const zone = findZone(zones, draft.zoneName) ?? zones.find((z) => !z.disabled);
  if (!zone) return null;
  const reservedSet = reservedTablesAt(
    reservations,
    zone.name,
    draft.timeSlot,
  );
  const recommendation = recommendForZone(
    zone,
    draft.partySize,
    new Set(reservedSet.keys()),
  );
  const table = recommendation.tableId
    ? zone.tables.find((t) => t.id === recommendation.tableId)
    : null;
  return table ? { zone, table } : null;
}

export function reservationsAtSlot(
  reservations: ReservationDTO[],
  timeSlot: string,
): ReservationDTO[] {
  return reservations.filter((r) => r.timeSlot === timeSlot);
}

export function reservationsInZone(
  reservations: ReservationDTO[],
  zoneName: string,
  timeSlot?: string,
): ReservationDTO[] {
  return reservations.filter(
    (r) =>
      r.zoneName === zoneName &&
      (timeSlot === undefined || r.timeSlot === timeSlot),
  );
}

export function reservedTablesAt(
  reservations: ReservationDTO[],
  zoneName: string,
  timeSlot: string,
): Map<string, ReservationDTO> {
  const map = new Map<string, ReservationDTO>();
  for (const r of reservations) {
    if (r.zoneName === zoneName && r.timeSlot === timeSlot) {
      map.set(r.tableLabel, r);
    }
  }
  return map;
}
