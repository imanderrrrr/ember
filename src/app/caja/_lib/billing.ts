/**
 * Cálculo de factura a partir de las órdenes de cocina de una mesa.
 * Cruza los ítems de kitchen_orders contra el CATALOG del menú para obtener
 * precios. Si un platillo no está en el catálogo se estima Q0 (se muestra
 * como "precio pendiente") y no bloquea el cobro.
 */
import { CATALOG, IVA_RATE, formatQ } from "@/app/salon/_lib/menu";
import type { KitchenOrderDTO } from "@/app/cocina/_lib/orders";
import type { SalonTable } from "@/app/salon/_lib/types";

export interface BillLine {
  menuItemId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  mods?: string;
}

export interface Bill {
  orderId?: string | null;
  tableId: string;
  tableLabel: string;
  zoneName: string;
  partySize: number;
  mesero: string | null;
  lines: BillLine[];
  subtotal: number;
  iva: number;
  total: number;
  /** Texto formateado del total (ej. "Q715.90"). */
  totalLabel: string;
}

/** Mapa rápido nombre→precio del catálogo (lower-cased para matching tolerante). */
const PRICE_MAP = new Map<string, number>(
  Object.values(CATALOG)
    .flat()
    .map((p) => [p.name.toLowerCase().trim(), p.price]),
);

function priceFor(name: string): number {
  return PRICE_MAP.get(name.toLowerCase().trim()) ?? 0;
}

/**
 * Agrupa las líneas de todas las órdenes de una mesa en una sola factura
 * consolidada. Las órdenes "entregada" ya cobradas se excluyen por defecto
 * (solo nueva/preparacion/lista se consideran pendientes; aquí asumimos que
 * todas las que llegan son las del turno activo).
 */
export function buildBill(
  tableId: string,
  tableLabel: string,
  zoneName: string,
  partySize: number,
  mesero: string | null,
  orders: KitchenOrderDTO[],
  orderId?: string | null,
): Bill {
  // Consolidar líneas de todas las órdenes activas de la mesa.
  const lineMap = new Map<string, BillLine>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.name}|${item.mods ?? ""}`;
      const existing = lineMap.get(key);
      const unit =
        item.priceCents && item.priceCents > 0
          ? item.priceCents / 100
          : priceFor(item.name);
      if (existing) {
        existing.qty += item.qty;
        existing.lineTotal = Math.round(existing.qty * unit * 100) / 100;
      } else {
        const catalogItem = Object.values(CATALOG)
          .flat()
          .find((p) => p.name.toLowerCase().trim() === item.name.toLowerCase().trim());
        lineMap.set(key, {
          menuItemId: item.menuItemId ?? catalogItem?.id,
          name: item.name,
          qty: item.qty,
          unitPrice: unit,
          lineTotal: Math.round(item.qty * unit * 100) / 100,
          mods: item.mods,
        });
      }
    }
  }

  const lines = [...lineMap.values()];

  // Aritmética financiera idéntica a sales.calculator.ts en backend:
  // Previene float rounding errors y rechazo de 'price_tampered'.
  let subtotalCents = 0;
  for (const line of lines) {
    const itemPriceCents = Math.round(line.unitPrice * 100);
    subtotalCents += itemPriceCents * line.qty;
  }
  const ivaCents = Math.round((subtotalCents * 12) / 100);
  const totalCents = subtotalCents + ivaCents;

  const subtotal = subtotalCents / 100;
  const iva = ivaCents / 100;
  const total = totalCents / 100;

  return {
    orderId: orderId ?? orders[0]?.id ?? null,
    tableId,
    tableLabel,
    zoneName,
    partySize,
    mesero,
    lines,
    subtotal,
    iva,
    total,
    totalLabel: formatQ(total),
  };
}

/**
 * Construye la factura consolidada de una mesa a partir de TODAS sus órdenes
 * de cocina. No se filtra por estado de cocina: `nueva → preparacion → lista →
 * entregada` describe la preparación del platillo, no el pago. Una mesa que
 * pide la cuenta normalmente ya tiene sus órdenes en "entregada", así que esas
 * líneas DEBEN entrar en el cobro. El cobro es lo que pasa la mesa a "limpieza".
 */
export function buildBillForTable(
  table: SalonTable,
  zoneName: string,
  orders: KitchenOrderDTO[],
): Bill {
  const tableOrders = orders.filter((o) => o.tableId === table.id);
  return buildBill(
    table.id,
    table.label,
    zoneName,
    table.partySize ?? table.seats,
    tableOrders[0]?.mesero ?? null,
    tableOrders,
    tableOrders[0]?.id ?? null,
  );
}

export { formatQ };
