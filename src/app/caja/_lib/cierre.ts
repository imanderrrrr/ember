/**
 * Tipos compartidos del Cierre de caja (espejan los DTOs del api
 * `sales.service.ts`). Módulo neutro para que lo usen tanto el server
 * (fetchCierre) como el cliente (closeShift / la pantalla).
 */

export interface MethodBreakdown {
  cents: number;
  count: number;
}

export interface CashCloseData {
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

export interface CierreData {
  serviceDate: string;
  totalCents: number;
  subtotalCents: number;
  ivaCents: number;
  count: number;
  byMethod: Record<string, MethodBreakdown>;
  openingCents: number;
  expectedCashCents: number;
  goalCents: number | null;
  closed: boolean;
  close: CashCloseData | null;
}
