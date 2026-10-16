import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLineItem,
  calculateSaleTotals,
  calculateRetroTotals,
  verifyPriceIntegrity,
  CalculationError,
} from "./sales.calculator.js";

test("calculateLineItem calculates correct subtotal, IVA (12%) and total in integer cents", () => {
  // Platillo de Q89.00 (8900 centavos) x 2 unidades
  const result = calculateLineItem({ priceCents: 8900, qty: 2, ivaRate: 12 });
  assert.equal(result.subtotalCents, 17800);
  assert.equal(result.ivaCents, 2136); // Math.round(17800 * 0.12) = 2136
  assert.equal(result.totalCents, 19936);
  assert.equal(result.subtotalCents + result.ivaCents, result.totalCents);
});

test("calculateLineItem rejects zero or negative quantity", () => {
  assert.throws(
    () => calculateLineItem({ priceCents: 5000, qty: 0 }),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "invalid_quantity");
      return true;
    },
  );

  assert.throws(
    () => calculateLineItem({ priceCents: 5000, qty: -3 }),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "invalid_quantity");
      return true;
    },
  );
});

test("calculateLineItem rejects negative price", () => {
  assert.throws(
    () => calculateLineItem({ priceCents: -100, qty: 1 }),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "invalid_price");
      return true;
    },
  );
});

test("calculateSaleTotals consolidates multiple items with mathematical exactness", () => {
  const items = [
    { priceCents: 8900, qty: 1, ivaRate: 12 }, // Tartar: 8900 sub, 1068 iva
    { priceCents: 7200, qty: 2, ivaRate: 12 }, // Burrata x2: 14400 sub, 1728 iva
    { priceCents: 2800, qty: 3, ivaRate: 12 }, // Bebidas x3: 8400 sub, 1008 iva
  ];

  const totals = calculateSaleTotals(items);

  assert.equal(totals.subtotalCents, 8900 + 14400 + 8400); // 31700
  assert.equal(totals.ivaCents, 1068 + 1728 + 1008); // 3804
  assert.equal(totals.totalCents, 31700 + 3804); // 35504
  assert.equal(totals.subtotalCents + totals.ivaCents, totals.totalCents);
});

test("calculateSaleTotals rejects empty item list", () => {
  assert.throws(
    () => calculateSaleTotals([]),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "missing_items");
      return true;
    },
  );
});

test("verifyPriceIntegrity accepts declared totals matching official calculation", () => {
  const calculated = {
    subtotalCents: 10000,
    ivaCents: 1200,
    totalCents: 11200,
  };

  assert.doesNotThrow(() => {
    verifyPriceIntegrity(calculated, {
      subtotalCents: 10000,
      ivaCents: 1200,
      totalCents: 11200,
    });
  });
});

test("verifyPriceIntegrity detects and rejects tampered total, subtotal or IVA", () => {
  const calculated = {
    subtotalCents: 10000,
    ivaCents: 1200,
    totalCents: 11200,
  };

  // 1. Total adulterado a la baja (intento de pagar menos)
  assert.throws(
    () => verifyPriceIntegrity(calculated, { totalCents: 5000 }),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "price_tampered");
      return true;
    },
  );

  // 2. Subtotal adulterado
  assert.throws(
    () => verifyPriceIntegrity(calculated, { subtotalCents: 8000 }),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "price_tampered");
      return true;
    },
  );

  // 3. IVA adulterado
  assert.throws(
    () => verifyPriceIntegrity(calculated, { ivaCents: 0 }),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "price_tampered");
      return true;
    },
  );
});

test("calculateRetroTotals deduces subtotal and IVA without floating point drift", () => {
  // Factura de Q1,120.00 (112000 centavos)
  const totals = calculateRetroTotals(112000);
  assert.equal(totals.totalCents, 112000);
  assert.equal(totals.subtotalCents, 100000);
  assert.equal(totals.ivaCents, 12000);
  assert.equal(totals.subtotalCents + totals.ivaCents, totals.totalCents);
});

test("calculateRetroTotals rejects zero or negative total", () => {
  assert.throws(
    () => calculateRetroTotals(0),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "invalid_total");
      return true;
    },
  );
  assert.throws(
    () => calculateRetroTotals(-500),
    (err: unknown) => {
      assert.ok(err instanceof CalculationError);
      assert.equal(err.code, "invalid_total");
      return true;
    },
  );
});
