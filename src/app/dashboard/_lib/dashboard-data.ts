import "server-only";

import { fetchFloorPlan, fetchReservations } from "@/app/salon/_lib/server-api";
import { fetchKitchenOrders } from "@/app/cocina/_lib/orders-server";
import { fetchSalesSummary } from "./sales-server";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  TABLE_STATUSES,
  type TableStatus,
} from "@/app/salon/_lib/types";
import type { KitchenOrderDTO } from "@/app/cocina/_lib/orders";

/**
 * Capa de datos del dashboard. Compone las tres fuentes reales (plano del
 * salón, órdenes de cocina y reservaciones) en un objeto serializable que las
 * tarjetas consumen como props. Todo el cálculo dependiente del tiempo (demoras,
 * promedios, "hace X") vive AQUÍ —una función utilitaria, no un render de
 * componente— por lo que usar `Date.now()` es seguro y no viola la pureza de
 * render que exige React/ESLint. Al refrescarse cada pocos segundos, el "ahora"
 * se reevalúa y las métricas quedan al día sin recargar la página.
 */

/** Objetivo de preparación por orden (igual que el KDS): 14 min. */
const TARGET_SEC = 14 * 60;

/** Estados de mesa que cuentan como "salón activo". */
const ACTIVE_TABLE_STATUSES: TableStatus[] = [
  "ocupada",
  "cocina",
  "esperando",
  "reservada",
];

/** Estados de mesa con comensales sentados (para el aforo). */
const SEATED_TABLE_STATUSES: TableStatus[] = ["ocupada", "cocina", "esperando"];

const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: "Por confirmar",
  confirmed: "Confirmada",
  seated: "Sentada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No-show",
};

const RESERVATION_GOOD = new Set(["confirmed", "seated", "completed"]);
const RESERVATION_HIDDEN = new Set(["cancelled", "no_show"]);

export interface SalonStatusRow {
  status: TableStatus;
  label: string;
  color: string;
  count: number;
  /** Porcentaje del total (para el ancho de la barra apilada). */
  pct: number;
}

export interface DashboardSalon {
  total: number;
  active: number;
  occupiedPct: number;
  rows: SalonStatusRow[];
  zones: { name: string; active: number; total: number }[];
}

export interface DashboardCocina {
  nuevas: number;
  preparacion: number;
  listas: number;
  total: number;
  demoras: number;
  avgLabel: string;
}

export interface DashboardKpis {
  mesasActivas: number;
  mesasTotal: number;
  ocupadoPct: number;
  reservasHoy: number;
  reservasProximas: number;
  pedidosCocina: number;
  pedidosBreakdown: string;
  comensales: number;
  aforoTotal: number;
  aforoPct: number;
}

export interface DashboardReserva {
  id: string;
  ini: string;
  name: string;
  meta: string;
  status: string;
  tone: "good" | "warn";
}

export type ActivityKind =
  | "pedido"
  | "preparacion"
  | "lista"
  | "entregada"
  | "reserva";

export interface DashboardActivity {
  id: string;
  kind: ActivityKind;
  text: string;
  when: string;
}

export interface DashboardVentas {
  /** Ventas acumuladas del turno, en Q. */
  totalQ: number;
  /** Texto formateado, ej. "Q12,480.00". */
  totalLabel: string;
  /** Número de cobros registrados en el turno. */
  count: number;
  /** Meta del turno en Q, o null si no se ha fijado. */
  goalQ: number | null;
  /** % de avance hacia la meta (0–∞), o null sin meta. */
  pct: number | null;
  /** Q restantes para la meta (≥0), o null sin meta. */
  remainingQ: number | null;
  /** Fecha de turno (yyyy-mm-dd) usada para registrar/leer ventas y meta. */
  serviceDate: string;
}

export interface DashboardData {
  salon: DashboardSalon;
  cocina: DashboardCocina;
  kpis: DashboardKpis;
  reservas: DashboardReserva[];
  reservasHoy: number;
  actividad: DashboardActivity[];
  ventas: DashboardVentas;
  /** Mesas esperando cuenta (cobro pendiente). */
  cuentasPendientes: number;
}

function moneyQ(q: number): string {
  return (
    "Q" +
    q.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Etiqueta relativa ("ahora", "hace 3m", "hace 2h") a partir de un delta ms. */
function relTime(deltaMs: number): string {
  const s = Math.max(0, Math.floor(deltaMs / 1000));
  if (s < 10) return "ahora";
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function ms(value: string): number {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Minutos del día (0–1439) de un "HH:MM". -1 si no parsea. */
function slotMinutes(timeSlot: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(timeSlot);
  if (!m) return -1;
  return Number(m[1]) * 60 + Number(m[2]);
}

export async function getDashboardData(
  serviceDate: string,
): Promise<DashboardData> {
  const [plan, orders, reservations, salesSummary] = await Promise.all([
    fetchFloorPlan().catch(() => ({ zones: [], tables: [], shapes: [] })),
    fetchKitchenOrders().catch(() => [] as KitchenOrderDTO[]),
    fetchReservations({ date: serviceDate }).catch(() => []),
    fetchSalesSummary(serviceDate),
  ]);

  const now = Date.now();
  const tables = plan.tables;

  /* ---------- SALÓN ---------- */
  const counts = {} as Record<TableStatus, number>;
  for (const s of TABLE_STATUSES) counts[s] = 0;
  for (const t of tables) counts[t.status] = (counts[t.status] ?? 0) + 1;

  const total = tables.length;
  const active = ACTIVE_TABLE_STATUSES.reduce((a, s) => a + counts[s], 0);
  const occupiedPct = total > 0 ? Math.round((active / total) * 100) : 0;

  // Orden de presentación de las filas (más relevante primero).
  const ROW_ORDER: TableStatus[] = [
    "ocupada",
    "cocina",
    "esperando",
    "reservada",
    "libre",
    "limpieza",
  ];
  const rows: SalonStatusRow[] = ROW_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    color: STATUS_COLOR[status],
    count: counts[status],
    pct: total > 0 ? (counts[status] / total) * 100 : 0,
  }));

  const zoneAgg = new Map<string, { name: string; active: number; total: number }>();
  for (const z of plan.zones) zoneAgg.set(z.id, { name: z.name, active: 0, total: 0 });
  for (const t of tables) {
    const z = zoneAgg.get(t.zoneId);
    if (!z) continue;
    z.total += 1;
    if (ACTIVE_TABLE_STATUSES.includes(t.status)) z.active += 1;
  }
  const zones = [...zoneAgg.values()];

  /* ---------- COCINA ---------- */
  const isActive = (o: KitchenOrderDTO) =>
    o.status === "nueva" || o.status === "preparacion" || o.status === "lista";
  const activeOrders = orders.filter(isActive);
  const nuevas = orders.filter((o) => o.status === "nueva").length;
  const preparacion = orders.filter((o) => o.status === "preparacion").length;
  const listas = orders.filter((o) => o.status === "lista").length;

  const elapsedSec = (o: KitchenOrderDTO) =>
    Math.max(0, Math.floor((now - ms(o.createdAt)) / 1000));
  // "En fuego": activas que aún no están listas (nueva/preparación).
  const inFire = orders.filter(
    (o) => o.status === "nueva" || o.status === "preparacion",
  );
  const demoras = inFire.filter((o) => elapsedSec(o) > TARGET_SEC).length;
  const avgSec =
    inFire.length > 0
      ? Math.round(inFire.reduce((a, o) => a + elapsedSec(o), 0) / inFire.length)
      : 0;
  const avgLabel = `${String(Math.floor(avgSec / 60)).padStart(2, "0")}:${String(
    avgSec % 60,
  ).padStart(2, "0")}`;

  /* ---------- AFORO ---------- */
  const aforoTotal = tables.reduce((a, t) => a + t.seats, 0);
  const comensales = tables
    .filter((t) => SEATED_TABLE_STATUSES.includes(t.status))
    .reduce((a, t) => a + (t.partySize ?? t.seats), 0);
  const aforoPct = aforoTotal > 0 ? Math.round((comensales / aforoTotal) * 100) : 0;

  /* ---------- RESERVAS ---------- */
  const visibleRes = reservations.filter(
    (r) => !RESERVATION_HIDDEN.has(r.status),
  );
  const reservasHoy = visibleRes.length;
  const sortedRes = [...visibleRes].sort((a, b) =>
    a.timeSlot.localeCompare(b.timeSlot),
  );
  const reservas: DashboardReserva[] = sortedRes.slice(0, 4).map((r) => ({
    id: r.id,
    ini: initialsFrom(r.customerName),
    name: r.customerName,
    meta: `${r.timeSlot} · ${r.partySize} personas · ${r.zoneName}`,
    status: RESERVATION_STATUS_LABEL[r.status] ?? r.status,
    tone: RESERVATION_GOOD.has(r.status) ? "good" : "warn",
  }));

  const nowMinutes = new Date(now).getHours() * 60 + new Date(now).getMinutes();
  const reservasProximas = sortedRes.filter((r) => {
    const sm = slotMinutes(r.timeSlot);
    return sm >= nowMinutes && sm <= nowMinutes + 60;
  }).length;

  /* ---------- KPIs ---------- */
  const kpis: DashboardKpis = {
    mesasActivas: active,
    mesasTotal: total,
    ocupadoPct: occupiedPct,
    reservasHoy,
    reservasProximas,
    pedidosCocina: activeOrders.length,
    pedidosBreakdown: `${nuevas} nuevos · ${preparacion} en prep · ${listas} listos`,
    comensales,
    aforoTotal,
    aforoPct,
  };

  /* ---------- ACTIVIDAD ---------- */
  // Un evento por orden (su transición de estado más reciente) + reservas.
  const events: (DashboardActivity & { sortKey: number })[] = [];
  for (const o of orders) {
    const created = ms(o.createdAt);
    const updated = ms(o.updatedAt);
    if (o.status === "nueva") {
      events.push({
        id: `o-${o.id}`,
        kind: "pedido",
        text: `Mesa ${o.tableLabel} envió pedido a cocina`,
        when: relTime(now - created),
        sortKey: created,
      });
    } else if (o.status === "preparacion") {
      events.push({
        id: `o-${o.id}`,
        kind: "preparacion",
        text: `Cocina tomó la comanda · Mesa ${o.tableLabel}`,
        when: relTime(now - updated),
        sortKey: updated,
      });
    } else if (o.status === "lista") {
      events.push({
        id: `o-${o.id}`,
        kind: "lista",
        text: `Orden lista para servir · Mesa ${o.tableLabel}`,
        when: relTime(now - updated),
        sortKey: updated,
      });
    } else if (o.status === "entregada") {
      events.push({
        id: `o-${o.id}`,
        kind: "entregada",
        text: `Mesa ${o.tableLabel} · pedido entregado`,
        when: relTime(now - updated),
        sortKey: updated,
      });
    }
  }
  for (const r of visibleRes) {
    const created = ms(r.createdAt);
    events.push({
      id: `r-${r.id}`,
      kind: "reserva",
      text: `Reserva de ${r.customerName} · ${r.timeSlot} (${r.partySize}p)`,
      when: relTime(now - created),
      sortKey: created,
    });
  }
  events.sort((a, b) => b.sortKey - a.sortKey);
  const actividad: DashboardActivity[] = events
    .slice(0, 6)
    .map(({ id, kind, text, when }) => ({ id, kind, text, when }));

  /* ---------- VENTAS DEL TURNO ---------- */
  const totalQ = salesSummary.totalCents / 100;
  const goalQ =
    salesSummary.goalCents != null ? salesSummary.goalCents / 100 : null;
  const pct =
    goalQ && goalQ > 0 ? Math.round((totalQ / goalQ) * 100) : null;
  const remainingQ = goalQ != null ? Math.max(0, goalQ - totalQ) : null;
  const ventas: DashboardVentas = {
    totalQ,
    totalLabel: moneyQ(totalQ),
    count: salesSummary.count,
    goalQ,
    pct,
    remainingQ,
    serviceDate,
  };

  return {
    salon: { total, active, occupiedPct, rows, zones },
    cocina: {
      nuevas,
      preparacion,
      listas,
      total: activeOrders.length,
      demoras,
      avgLabel,
    },
    kpis,
    reservas,
    reservasHoy,
    actividad,
    ventas,
    cuentasPendientes: counts.esperando,
  };
}
