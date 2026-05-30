import "server-only";
import type { CierreData } from "./cierre";

/**
 * Fetch server-side de los datos del cierre de caja (red interna del docker).
 */
const API_URL = process.env.API_URL ?? "http://api:3001";

const EMPTY = (serviceDate: string): CierreData => ({
  serviceDate,
  totalCents: 0,
  subtotalCents: 0,
  ivaCents: 0,
  count: 0,
  byMethod: {
    efectivo: { cents: 0, count: 0 },
    tarjeta: { cents: 0, count: 0 },
    transferencia: { cents: 0, count: 0 },
    mixto: { cents: 0, count: 0 },
  },
  openingCents: 150000,
  expectedCashCents: 150000,
  goalCents: null,
  closed: false,
  close: null,
});

export async function fetchCierre(serviceDate: string): Promise<CierreData> {
  const res = await fetch(`${API_URL}/sales/cierre?date=${serviceDate}`, {
    cache: "no-store",
  }).catch((err) => {
    console.error("[caja] fetchCierre failed:", err);
    return null;
  });
  if (!res || !res.ok) return EMPTY(serviceDate);
  return res.json();
}
