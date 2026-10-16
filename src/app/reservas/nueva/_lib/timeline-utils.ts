import type { ReservationDraft, ZoneDef } from "./types";
import { findDraftTable } from "./zone-utils";

export const TIMELINE_REF = 1080;
export const pct = (v: number) => `${(v / TIMELINE_REF) * 100}%`;

export interface TLBar {
  x: number;
  w: number;
  kind: "green" | "buffer" | "orange";
}

export const TIMELINE_ROWS: { label: string; active?: boolean; bars: TLBar[] }[] = [
  {
    label: "MESA 1",
    bars: [
      { x: 0, w: 160, kind: "green" },
      { x: 520, w: 140, kind: "green" },
      { x: 840, w: 160, kind: "green" },
    ],
  },
  {
    label: "TU MESA",
    active: true,
    bars: [
      { x: 200, w: 200, kind: "buffer" },
      { x: 400, w: 280, kind: "orange" },
      { x: 680, w: 200, kind: "buffer" },
      { x: 900, w: 180, kind: "green" },
    ],
  },
  {
    label: "MESA 3",
    bars: [
      { x: 60, w: 120, kind: "green" },
      { x: 420, w: 200, kind: "green" },
    ],
  },
  {
    label: "MESA 4",
    bars: [
      { x: 120, w: 200, kind: "green" },
      { x: 780, w: 160, kind: "green" },
    ],
  },
];

export function timelineRowsFor(
  zones: ZoneDef[],
  draft: ReservationDraft,
): { label: string; active?: boolean; bars: TLBar[] }[] {
  const flat = zones.flatMap((zone) =>
    zone.tables.map((table) => ({ zone, table })),
  );
  if (flat.length === 0) return TIMELINE_ROWS;

  const selected =
    findDraftTable(zones, draft) ??
    (flat[0] ? { zone: flat[0].zone, table: flat[0].table } : null);
  const selectedKey = selected?.table.tableId ?? null;
  const selectedRow = selected
    ? [{ zone: selected.zone, table: selected.table }]
    : [];
  const rest = flat
    .filter((item) => item.table.tableId !== selectedKey)
    .slice(0, 3);
  const source = [...selectedRow, ...rest].slice(0, 4);
  const bars = TIMELINE_ROWS.map((row) => row.bars);
  return source.map((item, index) => ({
    label: `${item.table.id} · ${item.zone.shortName.toUpperCase()}`,
    active: item.table.tableId === selectedKey,
    bars: bars[index] ?? TIMELINE_ROWS[0].bars,
  }));
}

export function incHours(hhmm: string, hours: number, minutes = 0): string {
  const [h, m] = hhmm.split(":").map(Number);
  const totalMin = (h + hours) * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}
