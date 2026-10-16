/**
 * Políticas de autorización (RBAC) y reglas de negocio para el módulo Salón.
 */

export const LAYOUT_PROPERTIES = [
  "zoneId",
  "label",
  "shape",
  "x",
  "y",
  "width",
  "height",
  "seats",
  "rotation",
] as const;

export const OPERATIONAL_PROPERTIES = [
  "status",
  "customerName",
  "partySize",
  "notes",
] as const;

export type LayoutProperty = (typeof LAYOUT_PROPERTIES)[number];
export type OperationalProperty = (typeof OPERATIONAL_PROPERTIES)[number];

export class SalonPolicyError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}

/**
 * Determina si un rol de usuario tiene permisos para modificar la arquitectura
 * física del salón (zonas, figuras, geometría de mesas).
 */
export function canModifySalonLayout(role: string): boolean {
  return (
    role === "gerente_operativo" ||
    role === "admin" ||
    role === "system-internal"
  );
}

/**
 * Valida si un rol tiene permisos para realizar una actualización específica sobre una mesa.
 * - Gerentes y administradores pueden modificar tanto layout como estado operativo.
 * - Meseros, cajeros y anfitriones (hosts) ÚNICAMENTE pueden modificar campos operativos.
 *
 * Si un mesero intenta modificar x, y, width, height, seats, etc., se rechaza con error de política.
 */
export function validateTableUpdatePermissions(
  role: string,
  updateData: Record<string, unknown>,
): void {
  if (canModifySalonLayout(role)) {
    return;
  }

  const attemptedLayoutKeys = Object.keys(updateData).filter((k) =>
    (LAYOUT_PROPERTIES as readonly string[]).includes(k),
  );

  if (attemptedLayoutKeys.length > 0) {
    throw new SalonPolicyError(
      "forbidden_layout_modification",
      `El rol '${role}' no tiene permisos para modificar la distribución física de la mesa (campos restringidos: ${attemptedLayoutKeys.join(", ")})`,
      403,
    );
  }
}

/**
 * Valida la capacidad de una mesa frente al tamaño del grupo.
 */
export function validateTableCapacity(seats: number, partySize: number): boolean {
  if (partySize <= 0) return false;
  // Margen de tolerancia de hasta +2 comensales por sillas supletorias
  return partySize <= seats + 2;
}
