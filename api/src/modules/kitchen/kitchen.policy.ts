import type { KitchenOrderStatus } from "@ember/types";

export const KITCHEN_ORDER_STATUSES: readonly KitchenOrderStatus[] = [
  "nueva",
  "preparacion",
  "lista",
  "entregada",
  "cancelada",
] as const;

export class OrderPolicyError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/**
 * Matriz de transiciones válidas para el ciclo de vida de una orden de cocina.
 *
 * Flujo estándar:
 *   nueva ➔ preparacion ➔ lista ➔ entregada
 *
 * Flujo de cancelación:
 *   nueva / preparacion / lista ➔ cancelada
 */
const VALID_TRANSITIONS: Record<KitchenOrderStatus, readonly KitchenOrderStatus[]> = {
  nueva: ["preparacion", "cancelada"],
  preparacion: ["lista", "cancelada"],
  lista: ["entregada", "cancelada"],
  entregada: [], // Estado terminal de servicio
  cancelada: [], // Estado terminal
};

export function isValidOrderStatus(status: string): status is KitchenOrderStatus {
  return (KITCHEN_ORDER_STATUSES as readonly string[]).includes(status);
}

export function canTransitionOrderStatus(
  currentStatus: KitchenOrderStatus | string,
  newStatus: KitchenOrderStatus | string,
): boolean {
  if (currentStatus === newStatus) return true;
  if (!isValidOrderStatus(currentStatus) || !isValidOrderStatus(newStatus)) {
    return false;
  }
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

export function assertValidOrderStatusTransition(
  currentStatus: string,
  newStatus: string,
): void {
  if (!isValidOrderStatus(newStatus)) {
    throw new OrderPolicyError(
      "invalid_order_status",
      `Estado de orden inválido: '${newStatus}'. Estados permitidos: ${KITCHEN_ORDER_STATUSES.join(", ")}`,
      400,
    );
  }

  if (currentStatus === newStatus) return;

  if (isValidOrderStatus(currentStatus)) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new OrderPolicyError(
        "invalid_status_transition",
        `Transición no permitida de '${currentStatus}' a '${newStatus}'`,
        422,
      );
    }
  }
}
