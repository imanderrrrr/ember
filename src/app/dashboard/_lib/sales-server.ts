import "server-only";

/**
 * Fetch server-side del resumen de ventas del turno (red interna del docker).
 * Lo usa el dashboard para mostrar ventas reales + meta.
 */
const API_URL = process.env.API_URL ?? "http://api:3001";

export interface SalesSummary {
  serviceDate: string;
  totalCents: number;
  count: number;
  goalCents: number | null;
}

export async function fetchSalesSummary(
  serviceDate: string,
): Promise<SalesSummary> {
  const res = await fetch(`${API_URL}/sales/summary?date=${serviceDate}`, {
    cache: "no-store",
  }).catch((err) => {
    console.error("[dashboard] fetchSalesSummary failed:", err);
    return null;
  });
  if (!res || !res.ok) {
    return { serviceDate, totalCents: 0, count: 0, goalCents: null };
  }
  return res.json();
}
