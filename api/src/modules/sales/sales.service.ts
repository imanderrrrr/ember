import * as repo from "./sales.repository.js";
import { db } from "../../db/index.js";
import { eventHub } from "../../lib/events.js";
import type { CashClose, KitchenOrderItem, Sale } from "../../db/schema.js";

/** Fondo de apertura del cajón (Q1,500). El efectivo esperado al cierre es
 *  esta apertura + las ventas cobradas en efectivo del turno. */
const OPENING_CASH_CENTS = 150000;

/** Métodos de pago que el sistema reconoce (para el desglose del cierre). */
const METHODS = ["efectivo", "tarjeta", "transferencia", "mixto"] as const;
type Method = (typeof METHODS)[number];

import {
  CalculationError,
  calculateLineItem,
  calculateSaleTotals,
  calculateRetroTotals,
  verifyPriceIntegrity,
  calculateCashClose,
} from "./sales.calculator.js";

export {
  CalculationError,
  calculateLineItem,
  calculateSaleTotals,
  calculateRetroTotals,
  verifyPriceIntegrity,
  calculateCashClose,
};

export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

/**
 * Service de Ventas. Mapea DB ↔ wire y centraliza la lógica de resumen del
 * turno (ventas acumuladas + meta).
 */

import type {
  SaleDTO,
  SalesSummaryDTO,
  HourlySalesItemDTO,
  HourlySalesDTO,
  MethodBreakdown,
  CashCloseDTO,
  CierreDTO,
} from "@ember/types";

export type {
  SaleDTO,
  SalesSummaryDTO,
  HourlySalesItemDTO,
  HourlySalesDTO,
  MethodBreakdown,
  CashCloseDTO,
  CierreDTO,
};

function toDTO(s: Sale): SaleDTO {
  return {
    id: s.id,
    orderId: s.orderId ?? null,
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
  orderId?: string | null;
  tableId?: string | null;
  tableLabel: string;
  zoneName: string;
  mesero?: string | null;
  cashier?: string | null;
  method?: string;
  subtotalCents?: number;
  ivaCents?: number;
  totalCents?: number;
  items?: {
    menuItemId?: string;
    quantity?: number;
    qty?: number;
    name?: string;
    mods?: string;
  }[];
  serviceDate: string;
}): Promise<SaleDTO> {
  let finalSubtotalCents = 0;
  let finalIvaCents = 0;
  let finalTotalCents = 0;
  const processedItems: KitchenOrderItem[] = [];

  // 1. REGLA INQUEBRANTABLE: El frontend NUNCA dicta los precios.
  // Si vienen items, consultamos el catálogo oficial en PostgreSQL.
  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      const quantity = item.quantity ?? item.qty ?? 1;
      if (quantity <= 0) {
        throw new DomainError("invalid_quantity", "La cantidad debe ser mayor a 0", 400);
      }

      let menuItem = null;
      if (item.menuItemId) {
        menuItem = await repo.getMenuItemById(item.menuItemId);
      } else if (item.name) {
        menuItem = await repo.getMenuItemByName(item.name);
      }

      if (!menuItem) {
        throw new DomainError(
          "menu_item_not_found",
          `Platillo no encontrado en el catálogo oficial: ${item.menuItemId ?? item.name}`,
          400,
        );
      }
      if (!menuItem.isActive) {
        throw new DomainError("menu_item_inactive", `El platillo ${menuItem.name} no está activo`, 400);
      }

      const lineSubtotal = menuItem.priceCents * quantity;
      const rate = menuItem.ivaRate ?? 12;
      const lineIva = Math.round((lineSubtotal * rate) / 100);

      finalSubtotalCents += lineSubtotal;
      finalIvaCents += lineIva;

      processedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        qty: quantity,
        priceCents: menuItem.priceCents,
        mods: item.mods,
      });
    }

    finalTotalCents = finalSubtotalCents + finalIvaCents;

    // Validación de integridad matemática / prevención de fraude
    if (input.totalCents !== undefined && input.totalCents !== finalTotalCents) {
      throw new DomainError(
        "price_tampered",
        `Monto total alterado. Enviado: ${input.totalCents}, Calculado oficialmente: ${finalTotalCents}`,
        400,
      );
    }
    if (input.subtotalCents !== undefined && input.subtotalCents !== finalSubtotalCents) {
      throw new DomainError(
        "price_tampered",
        `Subtotal alterado. Enviado: ${input.subtotalCents}, Calculado oficialmente: ${finalSubtotalCents}`,
        400,
      );
    }
    if (input.ivaCents !== undefined && input.ivaCents !== finalIvaCents) {
      throw new DomainError(
        "price_tampered",
        `IVA alterado. Enviado: ${input.ivaCents}, Calculado oficialmente: ${finalIvaCents}`,
        400,
      );
    }
  } else if (input.totalCents !== undefined) {
    // Compatibilidad retroactiva: cálculo matemático asegurado
    finalTotalCents = input.totalCents;
    finalSubtotalCents = input.subtotalCents ?? Math.round((finalTotalCents * 100) / 112);
    finalIvaCents = input.ivaCents ?? (finalTotalCents - finalSubtotalCents);
  } else {
    throw new DomainError("missing_items_or_total", "Debe proporcionar los ítems del catálogo o el total de la venta", 400);
  }

  // 2. TRANSACCIÓN ATÓMICA ACID EN COBROS Y MESAS
  // Ejecutado 100% dentro de db.transaction(async (tx) => ...)
  const { saleRow, linkedOrderId, updatedTableId } = await db.transaction(async (tx) => {
    let resolvedOrderId: string | null = input.orderId ?? null;

    // Trazabilidad Estricta: Comanda ➔ Venta
    if (!resolvedOrderId && input.tableId) {
      const activeOrder = await repo.findActiveKitchenOrderByTableId(input.tableId, tx);
      if (activeOrder) {
        resolvedOrderId = activeOrder.id;
        // Si no se enviaron items en el payload pero existe comanda, transferimos los items
        if (processedItems.length === 0 && activeOrder.items && activeOrder.items.length > 0) {
          processedItems.push(...activeOrder.items);
        }
      }
    }

    // Si hay orden vinculada, marcarla como completada/entregada
    if (resolvedOrderId) {
      const existingOrder = await repo.findKitchenOrderById(resolvedOrderId, tx);
      if (!existingOrder) {
        throw new DomainError("order_not_found", "Orden de cocina vinculada no encontrada", 404);
      }
      await repo.markKitchenOrderCompleted(resolvedOrderId, tx);
    }

    // Si hay mesa, cambiar su estado a "limpieza" dentro de la misma transacción
    if (input.tableId) {
      const table = await repo.findTableById(input.tableId, tx);
      if (!table) {
        throw new DomainError("table_not_found", "Mesa no encontrada", 404);
      }
      await repo.updateTableStatus(input.tableId, "limpieza", tx);
    }

    // Registrar el ticket de venta en la base de datos
    const inserted = await repo.insertSale({
      orderId: resolvedOrderId,
      tableId: input.tableId ?? null,
      tableLabel: input.tableLabel,
      zoneName: input.zoneName,
      mesero: input.mesero ?? null,
      cashier: input.cashier ?? null,
      method: input.method ?? "efectivo",
      subtotalCents: finalSubtotalCents,
      ivaCents: finalIvaCents,
      totalCents: finalTotalCents,
      items: processedItems,
      serviceDate: input.serviceDate,
    }, tx);

    return {
      saleRow: inserted,
      linkedOrderId: resolvedOrderId,
      updatedTableId: input.tableId ?? null,
    };
  });

  const dto = toDTO(saleRow);

  // 3. Emisión de eventos de dominio ligeros tras éxito transaccional
  eventHub.emitEvent("sale:recorded", dto);
  if (updatedTableId) {
    eventHub.emitEvent("table:status_updated", {
      tableId: updatedTableId,
      status: "limpieza",
    });
  }
  if (linkedOrderId) {
    eventHub.emitEvent("order:status_updated", {
      orderId: linkedOrderId,
      status: "entregada",
    });
  }

  return dto;
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
  const cashCheck = calculateCashClose({
    openingCents: opening,
    cashSalesCents: cierre.byMethod.efectivo?.cents ?? 0,
    countedCashCents: input.countedCashCents,
  });

  await repo.insertClose({
    serviceDate: input.serviceDate,
    openingCents: cashCheck.openingCents,
    expectedCashCents: cashCheck.expectedCashCents,
    countedCashCents: cashCheck.countedCashCents,
    differenceCents: cashCheck.differenceCents,
    totalCents: cierre.totalCents,
    salesCount: cierre.count,
    byMethod: cierre.byMethod,
    notes: input.notes ?? null,
    cashier: input.cashier ?? null,
  });

  return getCierre(input.serviceDate);
}



export async function getHourlySales(serviceDate: string): Promise<HourlySalesDTO> {
  const rows = await repo.hourlySalesByDate(serviceDate);
  let peakHour: number | null = null;
  let peakHourLabel: string | null = null;
  let maxCents = -1;
  let totalCents = 0;
  let ticketCount = 0;

  const items: HourlySalesItemDTO[] = rows.map((r) => {
    totalCents += r.totalCents;
    ticketCount += r.ticketCount;

    if (r.totalCents > maxCents && r.totalCents > 0) {
      maxCents = r.totalCents;
      peakHour = r.hour;
      peakHourLabel = `${String(r.hour).padStart(2, "0")}:00`;
    }

    return {
      hour: r.hour,
      totalCents: r.totalCents,
      ticketCount: r.ticketCount,
      formattedHour: `${r.hour}h`,
      totalQ: r.totalCents / 100,
    };
  });

  return {
    serviceDate,
    items,
    peakHour,
    peakHourLabel,
    totalCents,
    totalQ: totalCents / 100,
    ticketCount,
  };
}

export interface OperationalMetricsDTO {
  serviceDate: string;
  ticketAverageCents: number;
  ticketAverageQ: number;
  ticketAverageLabel: string;
  totalTickets: number;
  totalCents: number;
  totalQ: number;
  tableTurnover: number;
  finishedSessionsCount: number;
  totalConfiguredTables: number;
  avgServiceSeconds: number | null;
  avgServiceLabel: string;
}

export async function getOperationalMetrics(
  serviceDate: string,
): Promise<OperationalMetricsDTO> {
  const [summary, totalTables, avgSec] = await Promise.all([
    repo.summaryByDate(serviceDate),
    repo.totalConfiguredTablesCount(),
    repo.averageServiceDurationSeconds(serviceDate),
  ]);

  const totalTickets = summary.count;
  const totalCents = summary.totalCents;
  const ticketAverageCents =
    totalTickets > 0 ? Math.round(totalCents / totalTickets) : 0;
  const ticketAverageQ = ticketAverageCents / 100;
  const ticketAverageLabel =
    "Q" +
    ticketAverageQ.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const tableTurnover =
    totalTables > 0 ? Number((totalTickets / totalTables).toFixed(1)) : 0;

  let avgServiceLabel = "Sin datos";
  if (avgSec !== null && avgSec > 0) {
    const mins = Math.floor(avgSec / 60);
    const secs = avgSec % 60;
    avgServiceLabel = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  } else if (totalTickets === 0) {
    avgServiceLabel = "00:00";
  }

  return {
    serviceDate,
    ticketAverageCents,
    ticketAverageQ,
    ticketAverageLabel,
    totalTickets,
    totalCents,
    totalQ: totalCents / 100,
    tableTurnover,
    finishedSessionsCount: totalTickets,
    totalConfiguredTables: totalTables,
    avgServiceSeconds: avgSec,
    avgServiceLabel,
  };
}

