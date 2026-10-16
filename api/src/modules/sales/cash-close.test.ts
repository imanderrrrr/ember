import test from "node:test";
import assert from "node:assert/strict";
import { calculateCashClose } from "./sales.calculator.js";

test("calculateCashClose calculates exact cash match (caja cuadrada)", () => {
  // Apertura Q1,500.00 (150,000 cents) + Ventas en efectivo Q2,350.00 (235,000 cents)
  const result = calculateCashClose({
    openingCents: 150000,
    cashSalesCents: 235000,
    countedCashCents: 385000, // Exactamente Q3,850.00
  });

  assert.equal(result.expectedCashCents, 385000);
  assert.equal(result.differenceCents, 0);
  assert.equal(result.status, "cuadrada");
});

test("calculateCashClose detects cash surplus (sobrante de caja)", () => {
  const result = calculateCashClose({
    openingCents: 150000,
    cashSalesCents: 200000,
    countedCashCents: 360000, // Q3,600 contados vs Q3,500 esperados (+Q100 sobrante)
  });

  assert.equal(result.expectedCashCents, 350000);
  assert.equal(result.differenceCents, 10000);
  assert.equal(result.status, "sobrante");
});

test("calculateCashClose detects cash deficit (faltante de caja)", () => {
  const result = calculateCashClose({
    openingCents: 150000,
    cashSalesCents: 200000,
    countedCashCents: 335000, // Q3,350 contados vs Q3,500 esperados (-Q150 faltante)
  });

  assert.equal(result.expectedCashCents, 350000);
  assert.equal(result.differenceCents, -15000);
  assert.equal(result.status, "faltante");
});

test("calculateCashClose isolates cash sales from electronic/card payments", () => {
  // Las ventas totales fueron Q10,000 pero solo Q2,000 fueron en efectivo (el resto tarjeta/transferencia)
  const totalSalesCents = 1000000;
  const cardSalesCents = 800000;
  const cashSalesCents = totalSalesCents - cardSalesCents; // 200000
  const openingCents = 150000;

  const result = calculateCashClose({
    openingCents,
    cashSalesCents,
    countedCashCents: 350000,
  });

  // El efectivo esperado en el cajón NO debe incluir los cobros con tarjeta
  assert.equal(result.expectedCashCents, openingCents + cashSalesCents);
  assert.notEqual(result.expectedCashCents, openingCents + totalSalesCents);
  assert.equal(result.differenceCents, 0);
  assert.equal(result.status, "cuadrada");
});

test("calculateCashClose handles zero sales shift correctly", () => {
  // Turno sin ventas en efectivo: el cajón debe tener exactamente el fondo de apertura
  const result = calculateCashClose({
    openingCents: 150000,
    cashSalesCents: 0,
    countedCashCents: 150000,
  });

  assert.equal(result.expectedCashCents, 150000);
  assert.equal(result.differenceCents, 0);
  assert.equal(result.status, "cuadrada");
});

test("calculateCashClose supports custom opening cash fund", () => {
  // Cajón con apertura mayor: Q3,000.00
  const customOpening = 300000;
  const result = calculateCashClose({
    openingCents: customOpening,
    cashSalesCents: 50000,
    countedCashCents: 340000, // Q3,400 contados (-Q100 faltante)
  });

  assert.equal(result.expectedCashCents, 350000);
  assert.equal(result.differenceCents, -10000);
  assert.equal(result.status, "faltante");
});
