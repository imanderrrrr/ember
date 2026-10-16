/**
 * Motor de cálculo financiero para Ventas, Impuestos (IVA 12%) y Cuadre de Caja.
 * Funciones puras con aritmética de enteros (centavos) para prevenir deriva por coma flotante.
 */

export class CalculationError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface LineItemInput {
  priceCents: number;
  qty: number;
  ivaRate?: number;
}

export interface SaleTotalsResult {
  subtotalCents: number;
  ivaCents: number;
  totalCents: number;
}

/**
 * Calcula el desglose de IVA y total para una línea de producto.
 */
export function calculateLineItem(item: LineItemInput): {
  subtotalCents: number;
  ivaCents: number;
  totalCents: number;
} {
  if (item.qty <= 0) {
    throw new CalculationError(
      "invalid_quantity",
      "La cantidad debe ser mayor a 0",
      400,
    );
  }
  if (item.priceCents < 0) {
    throw new CalculationError(
      "invalid_price",
      "El precio unitario no puede ser negativo",
      400,
    );
  }

  const subtotalCents = item.priceCents * item.qty;
  const rate = item.ivaRate ?? 12;
  const ivaCents = Math.round((subtotalCents * rate) / 100);
  const totalCents = subtotalCents + ivaCents;

  return { subtotalCents, ivaCents, totalCents };
}

/**
 * Calcula los totales consolidados a partir de una lista de ítems resueltos con el catálogo.
 */
export function calculateSaleTotals(items: LineItemInput[]): SaleTotalsResult {
  if (items.length === 0) {
    throw new CalculationError(
      "missing_items",
      "Debe proporcionar al menos un ítem para calcular la venta",
      400,
    );
  }

  let subtotalCents = 0;
  let ivaCents = 0;

  for (const item of items) {
    const line = calculateLineItem(item);
    subtotalCents += line.subtotalCents;
    ivaCents += line.ivaCents;
  }

  const totalCents = subtotalCents + ivaCents;
  return { subtotalCents, ivaCents, totalCents };
}

/**
 * Cálculo retrocompatible para ventas enviadas únicamente con monto total.
 * Aplica tasa general de IVA 12%.
 */
export function calculateRetroTotals(
  totalCents: number,
  providedSubtotal?: number,
  providedIva?: number,
): SaleTotalsResult {
  if (totalCents <= 0) {
    throw new CalculationError(
      "invalid_total",
      "El monto total de la venta debe ser mayor a cero",
      400,
    );
  }

  const subtotalCents =
    providedSubtotal ?? Math.round((totalCents * 100) / 112);
  const ivaCents = providedIva ?? (totalCents - subtotalCents);

  return { subtotalCents, ivaCents, totalCents };
}

/**
 * Verifica la integridad matemática de los montos recibidos vs los calculados oficialmente.
 * Previene fraude o alteración de precios por clientes modificados.
 */
export function verifyPriceIntegrity(
  calculated: SaleTotalsResult,
  declared: {
    subtotalCents?: number;
    ivaCents?: number;
    totalCents?: number;
  },
): void {
  if (
    declared.totalCents !== undefined &&
    declared.totalCents !== calculated.totalCents
  ) {
    throw new CalculationError(
      "price_tampered",
      `Monto total alterado. Enviado: ${declared.totalCents}, Calculado oficialmente: ${calculated.totalCents}`,
      400,
    );
  }

  if (
    declared.subtotalCents !== undefined &&
    declared.subtotalCents !== calculated.subtotalCents
  ) {
    throw new CalculationError(
      "price_tampered",
      `Subtotal alterado. Enviado: ${declared.subtotalCents}, Calculado oficialmente: ${calculated.subtotalCents}`,
      400,
    );
  }

  if (
    declared.ivaCents !== undefined &&
    declared.ivaCents !== calculated.ivaCents
  ) {
    throw new CalculationError(
      "price_tampered",
      `IVA alterado. Enviado: ${declared.ivaCents}, Calculado oficialmente: ${calculated.ivaCents}`,
      400,
    );
  }
}

/**
 * Cuadre de caja: cálculo de efectivo esperado y detección de descuadre (sobrante o faltante).
 * Solo las ventas cobradas en 'efectivo' impactan el cajón físico.
 */
export function calculateCashClose(input: {
  openingCents: number;
  cashSalesCents: number;
  countedCashCents: number;
}): {
  openingCents: number;
  cashSalesCents: number;
  expectedCashCents: number;
  countedCashCents: number;
  differenceCents: number;
  status: "cuadrada" | "sobrante" | "faltante";
} {
  const { openingCents, cashSalesCents, countedCashCents } = input;
  const expectedCashCents = openingCents + cashSalesCents;
  const differenceCents = countedCashCents - expectedCashCents;

  let status: "cuadrada" | "sobrante" | "faltante" = "cuadrada";
  if (differenceCents > 0) {
    status = "sobrante";
  } else if (differenceCents < 0) {
    status = "faltante";
  }

  return {
    openingCents,
    cashSalesCents,
    expectedCashCents,
    countedCashCents,
    differenceCents,
    status,
  };
}
