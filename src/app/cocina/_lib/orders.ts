/**
 * Tipos y helpers de cliente para Órdenes de cocina. Las mutaciones pasan por
 * el proxy autenticado `/api/orders/*` (solo funcionan en el navegador).
 */

export interface KitchenOrderItem {
  qty: number;
  name: string;
  mods?: string;
}

export interface KitchenOrderDTO {
  id: string;
  tableId: string | null;
  tableLabel: string;
  zoneName: string;
  partySize: number;
  mesero: string | null;
  items: KitchenOrderItem[];
  station: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKitchenOrderPayload {
  tableId?: string | null;
  tableLabel: string;
  zoneName: string;
  partySize?: number;
  mesero?: string | null;
  station?: string;
  items: KitchenOrderItem[];
}

async function jsonOrThrow<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise;
  const body = await res.text().catch(() => "");
  if (!res.ok) {
    let detail = body.slice(0, 240);
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.message ?? parsed?.error ?? detail;
    } catch {
      // ignore
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return JSON.parse(body) as T;
}

/** Crea una orden de cocina (el mesero al "Enviar a cocina"). */
export async function createKitchenOrder(
  payload: CreateKitchenOrderPayload,
): Promise<KitchenOrderDTO> {
  return jsonOrThrow<KitchenOrderDTO>(
    fetch("/api/orders/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

/** Avanza el estado de una orden desde el KDS. */
export async function updateKitchenOrder(
  id: string,
  status: "nueva" | "preparacion" | "lista" | "entregada",
): Promise<KitchenOrderDTO> {
  return jsonOrThrow<KitchenOrderDTO>(
    fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  );
}
