/**
 * Contrato DTO compartido para Cierre de Caja (Cash Close).
 */

export const PAYMENT_METHODS = [
  "efectivo",
  "tarjeta",
  "transferencia",
  "mixto",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
export type CashCloseData = CashCloseDTO;

export interface CierreDTO {
  serviceDate: string;
  totalCents: number;
  subtotalCents: number;
  ivaCents: number;
  count: number;
  byMethod: Record<PaymentMethod | string, MethodBreakdown>;
  openingCents: number;
  expectedCashCents: number;
  goalCents: number | null;
  closed: boolean;
  close: CashCloseDTO | null;
}
export type CierreData = CierreDTO;

export interface CloseShiftInput {
  serviceDate: string;
  countedCashCents: number;
  notes?: string | null;
  cashier?: string | null;
  openingCents?: number;
}
