import type {
  KitchenOrderItem,
  KitchenOrderDTO,
  CreateKitchenOrderPayload,
  KitchenOrderStatus,
} from "@ember/types";

export type {
  KitchenOrderItem,
  KitchenOrderDTO,
  CreateKitchenOrderPayload,
  KitchenOrderStatus,
};

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
  status: KitchenOrderStatus | string,
): Promise<KitchenOrderDTO> {
  return jsonOrThrow<KitchenOrderDTO>(
    fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  );
}
