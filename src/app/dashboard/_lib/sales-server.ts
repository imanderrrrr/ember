import "server-only";
import { getAuthHeaders } from "@/lib/server-token";

/**
 * Fetch server-side del resumen de ventas del turno (red interna del docker).
 * Lo usa el dashboard para mostrar ventas reales + meta.
 */
const API_URL = process.env.API_URL ?? "http://api:3001";

import type { SalesSummary } from "@ember/types";
export type { SalesSummary };

export async function fetchSalesSummary(
  serviceDate: string,
): Promise<SalesSummary> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/sales/summary?date=${serviceDate}`, {
    cache: "no-store",
    headers,
  }).catch((err) => {
    console.error("[dashboard] fetchSalesSummary failed:", err);
    return null;
  });
  if (!res || !res.ok) {
    return { serviceDate, totalCents: 0, count: 0, goalCents: null };
  }
  return res.json();
}

export interface HourlySalesItem {
  hour: number;
  totalCents: number;
  ticketCount: number;
  formattedHour: string;
  totalQ: number;
}

export interface HourlySalesData {
  serviceDate: string;
  items: HourlySalesItem[];
  peakHour: number | null;
  peakHourLabel: string | null;
  totalCents: number;
  totalQ: number;
  ticketCount: number;
}

export interface OperationalMetricsData {
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

export async function fetchHourlySales(serviceDate: string): Promise<HourlySalesData> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/sales/analytics/hourly?date=${serviceDate}`, {
    cache: "no-store",
    headers,
  }).catch((err) => {
    console.error("[dashboard] fetchHourlySales failed:", err);
    return null;
  });
  if (!res || !res.ok) {
    return {
      serviceDate,
      items: [],
      peakHour: null,
      peakHourLabel: null,
      totalCents: 0,
      totalQ: 0,
      ticketCount: 0,
    };
  }
  return res.json();
}

export async function fetchOperationalMetrics(
  serviceDate: string,
): Promise<OperationalMetricsData> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/sales/analytics/performance?date=${serviceDate}`,
    {
      cache: "no-store",
      headers,
    },
  ).catch((err) => {
    console.error("[dashboard] fetchOperationalMetrics failed:", err);
    return null;
  });
  if (!res || !res.ok) {
    return {
      serviceDate,
      ticketAverageCents: 0,
      ticketAverageQ: 0,
      ticketAverageLabel: "Q0",
      totalTickets: 0,
      totalCents: 0,
      totalQ: 0,
      tableTurnover: 0,
      finishedSessionsCount: 0,
      totalConfiguredTables: 0,
      avgServiceSeconds: null,
      avgServiceLabel: "00:00",
    };
  }
  return res.json();
}

