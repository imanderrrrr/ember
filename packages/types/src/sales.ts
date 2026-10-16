import type { KitchenOrderItem } from "./kitchen";

/**
 * Contrato DTO compartido para Ventas y Facturación.
 */

export interface SaleDTO {
  id: string;
  orderId: string | null;
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
  /** Ventas acumuladas del turno en centavos */
  totalCents: number;
  /** Cantidad de transacciones registradas */
  count: number;
  /** Meta de ventas fijada en centavos o null si no se ha fijado */
  goalCents: number | null;
}
export type SalesSummary = SalesSummaryDTO;

export interface HourlySalesItemDTO {
  hour: number;
  totalCents: number;
  ticketCount: number;
  formattedHour: string;
  totalQ: number;
  hourLabel?: string;
  count?: number;
}
export type HourlySalesItem = HourlySalesItemDTO;

export interface HourlySalesDTO {
  serviceDate: string;
  items: HourlySalesItemDTO[];
  peakHour: number | null;
  peakHourLabel: string | null;
  totalCents: number;
  totalQ: number;
  ticketCount: number;
}
export type HourlySalesData = HourlySalesDTO;

export interface OperationalMetricsDTO {
  serviceDate: string;
  averageTicketCents: number;
  totalSalesCents: number;
  salesCount: number;
  tableTurnoverRate: number;
  activeTablesCount: number;
  totalTablesCount: number;
}

export interface CreateSaleInput {
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
  items?: Array<{
    menuItemId?: string;
    quantity?: number;
    qty?: number;
    name?: string;
    mods?: string;
  }>;
  serviceDate: string;
}
