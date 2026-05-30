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
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  mods?: string;
}

export interface Bill {
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
): Bill {
  // Consolidar líneas de todas las órdenes activas de la mesa.
  const lineMap = new Map<string, BillLine>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.name}|${item.mods ?? ""}`;
      const existing = lineMap.get(key);
      const unit = priceFor(item.name);
      if (existing) {
        existing.qty += item.qty;
        existing.lineTotal += unit * item.qty;
      } else {
        lineMap.set(key, {
          name: item.name,
          qty: item.qty,
          unitPrice: unit,
          lineTotal: unit * item.qty,
          mods: item.mods,
        });
      }
    }
  }

  const lines = [...lineMap.values()];
  // Los precios del catálogo ya incluyen IVA (ver menu.ts: "precio unitario
  // IVA incluido"). El total que paga el cliente es la suma de las líneas; el
  // subtotal y el IVA se desglosan hacia adentro. Misma convención que Mesa
  // activa, para que el total que cobra caja coincida con el que ve el mesero.
  const gross = lines.reduce((a, l) => a + l.lineTotal, 0);
  const subtotal = gross / (1 + IVA_RATE);
  const iva = gross - subtotal;
  const total = gross;

  return {
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
  );
}

export { formatQ };
