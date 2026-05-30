import "server-only";
import type { KitchenOrderDTO } from "./orders";

/**
 * Fetch server-side de órdenes de cocina (usa la red interna del docker).
 * Lo usa la página `/cocina` para traer las comandas reales que el mesero
 * envió a cocina.
 */
const API_URL = process.env.API_URL ?? "http://api:3001";

export async function fetchKitchenOrders(
  statuses?: string[],
): Promise<KitchenOrderDTO[]> {
  const q = statuses && statuses.length > 0 ? `?status=${statuses.join(",")}` : "";
  const res = await fetch(`${API_URL}/orders${q}`, { cache: "no-store" }).catch(
    (err) => {
      console.error("[cocina] fetchKitchenOrders failed:", err);
      return null;
    },
  );
  if (!res || !res.ok) return [];
  return res.json();
}
