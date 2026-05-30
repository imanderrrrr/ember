import * as repo from "./sales.repository.js";
import type { CashClose, KitchenOrderItem, Sale } from "../../db/schema.js";

/** Fondo de apertura del cajón (Q1,500). El efectivo esperado al cierre es
 *  esta apertura + las ventas cobradas en efectivo del turno. */
const OPENING_CASH_CENTS = 150000;

/** Métodos de pago que el sistema reconoce (para el desglose del cierre). */
const METHODS = ["efectivo", "tarjeta", "transferencia", "mixto"] as const;
type Method = (typeof METHODS)[number];

/**
 * Service de Ventas. Mapea DB ↔ wire y centraliza la lógica de resumen del
 * turno (ventas acumuladas + meta).
 */

export interface SaleDTO {
  id: string;
  tableId: string | null;
  tableLabel: string;
  zoneName: string;
  mesero: string | null;
  cashier: string | null;
  method: string;
  subtotalCents: number;
  ivaCents: number;
  totalCents: number;
  items: KitchenOrderItem[];
  serviceDate: string;
  createdAt: string;
}

export interface SalesSummaryDTO {
  serviceDate: string;
  /** Ventas acumuladas del turno, en centavos. */
  totalCents: number;
  /** Número de cobros registrados. */
  count: number;
  /** Meta del turno en centavos, o null si el gerente no la ha fijado. */
  goalCents: number | null;
}

function toDTO(s: Sale): SaleDTO {
  return {
    id: s.id,
    tableId: s.tableId,
    tableLabel: s.tableLabel,
    zoneName: s.zoneName,
    mesero: s.mesero,
    cashier: s.cashier,
    method: s.method,
    subtotalCents: s.subtotalCents,
    ivaCents: s.ivaCents,
    totalCents: s.totalCents,
    items: s.items ?? [],
    serviceDate: s.serviceDate,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function recordSale(input: {
  tableId?: string | null;
  tableLabel: string;
  zoneName: string;
  mesero?: string | null;
  cashier?: string | null;
  method?: string;
  subtotalCents?: number;
  ivaCents?: number;
  totalCents: number;
  items?: KitchenOrderItem[];
  serviceDate: string;
}): Promise<SaleDTO> {
  const row = await repo.insertSale({
    tableId: input.tableId ?? null,
    tableLabel: input.tableLabel,
    zoneName: input.zoneName,
    mesero: input.mesero ?? null,
    cashier: input.cashier ?? null,
    method: input.method ?? "efectivo",
    subtotalCents: input.subtotalCents ?? 0,
    ivaCents: input.ivaCents ?? 0,
    totalCents: input.totalCents,
    items: input.items ?? [],
    serviceDate: input.serviceDate,
  });
  return toDTO(row);
}

export async function getSummary(serviceDate: string): Promise<SalesSummaryDTO> {
  const [summary, goal] = await Promise.all([
    repo.summaryByDate(serviceDate),
    repo.getGoal(serviceDate),
  ]);
  return {
    serviceDate,
    totalCents: summary.totalCents,
    count: summary.count,
    goalCents: goal?.goalCents ?? null,
  };
}

export async function setGoal(
  serviceDate: string,
  goalCents: number,
): Promise<SalesSummaryDTO> {
  await repo.upsertGoal(serviceDate, goalCents);
  return getSummary(serviceDate);
}

/* ─── Cierre de caja ─────────────────────────────────────────────────────── */

export interface MethodBreakdown {
  cents: number;
  count: number;
}

export interface CashCloseDTO {
  id: string;
  serviceDate: string;
  openingCents: number;
  expectedCashCents: number;
  countedCashCents: number;
  differenceCents: number;
  totalCents: number;
  salesCount: number;
  byMethod: Record<string, MethodBreakdown>;
  notes: string | null;
  cashier: string | null;
  createdAt: string;
}

export interface CierreDTO {
  serviceDate: string;
  totalCents: number;
  subtotalCents: number;
  ivaCents: number;
  count: number;
  byMethod: Record<Method, MethodBreakdown>;
  openingCents: number;
  expectedCashCents: number;
  goalCents: number | null;
  closed: boolean;
  close: CashCloseDTO | null;
}

function emptyByMethod(): Record<Method, MethodBreakdown> {
  return {
    efectivo: { cents: 0, count: 0 },
    tarjeta: { cents: 0, count: 0 },
    transferencia: { cents: 0, count: 0 },
    mixto: { cents: 0, count: 0 },
  };
}

function closeToDTO(c: CashClose): CashCloseDTO {
  return {
    id: c.id,
    serviceDate: c.serviceDate,
    openingCents: c.openingCents,
    expectedCashCents: c.expectedCashCents,
    countedCashCents: c.countedCashCents,
    differenceCents: c.differenceCents,
    totalCents: c.totalCents,
    salesCount: c.salesCount,
    byMethod: (c.byMethod ?? {}) as Record<string, MethodBreakdown>,
    notes: c.notes,
    cashier: c.cashier,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function getCierre(serviceDate: string): Promise<CierreDTO> {
  const [summary, methodRows, goal, close] = await Promise.all([
    repo.summaryByDate(serviceDate),
    repo.byMethodByDate(serviceDate),
    repo.getGoal(serviceDate),
    repo.latestCloseByDate(serviceDate),
  ]);

  const byMethod = emptyByMethod();
  for (const r of methodRows) {
    if ((METHODS as readonly string[]).includes(r.method)) {
      byMethod[r.method as Method] = { cents: r.totalCents, count: r.count };
    }
  }

  const expectedCashCents = OPENING_CASH_CENTS + byMethod.efectivo.cents;

  return {
    serviceDate,
    totalCents: summary.totalCents,
    subtotalCents: summary.subtotalCents,
    ivaCents: summary.ivaCents,
    count: summary.count,
    byMethod,
    openingCents: OPENING_CASH_CENTS,
    expectedCashCents,
    goalCents: goal?.goalCents ?? null,
    closed: close != null,
    close: close ? closeToDTO(close) : null,
  };
}

export async function closeShift(input: {
  serviceDate: string;
  countedCashCents: number;
  notes?: string | null;
  cashier?: string | null;
  openingCents?: number;
}): Promise<CierreDTO> {
  const cierre = await getCierre(input.serviceDate);
  const opening = input.openingCents ?? OPENING_CASH_CENTS;
  const expected = opening + cierre.byMethod.efectivo.cents;
  const difference = input.countedCashCents - expected;

  await repo.insertClose({
    serviceDate: input.serviceDate,
    openingCents: opening,
    expectedCashCents: expected,
    countedCashCents: input.countedCashCents,
    differenceCents: difference,
    totalCents: cierre.totalCents,
    salesCount: cierre.count,
    byMethod: cierre.byMethod,
    notes: input.notes ?? null,
    cashier: input.cashier ?? null,
  });

  return getCierre(input.serviceDate);
}
