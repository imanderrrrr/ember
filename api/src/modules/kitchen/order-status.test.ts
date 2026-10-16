import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionOrderStatus,
  assertValidOrderStatusTransition,
  isValidOrderStatus,
  OrderPolicyError,
} from "./kitchen.policy.js";

test("isValidOrderStatus recognizes all valid kitchen order states", () => {
  assert.equal(isValidOrderStatus("nueva"), true);
  assert.equal(isValidOrderStatus("preparacion"), true);
  assert.equal(isValidOrderStatus("lista"), true);
  assert.equal(isValidOrderStatus("entregada"), true);
  assert.equal(isValidOrderStatus("cancelada"), true);

  assert.equal(isValidOrderStatus("en_camino"), false);
  assert.equal(isValidOrderStatus("completada"), false);
  assert.equal(isValidOrderStatus(""), false);
});

test("canTransitionOrderStatus permits progressive kitchen workflow", () => {
  // nueva ➔ preparacion ➔ lista ➔ entregada
  assert.equal(canTransitionOrderStatus("nueva", "preparacion"), true);
  assert.equal(canTransitionOrderStatus("preparacion", "lista"), true);
  assert.equal(canTransitionOrderStatus("lista", "entregada"), true);
});

test("canTransitionOrderStatus permits cancellation from active states", () => {
  assert.equal(canTransitionOrderStatus("nueva", "cancelada"), true);
  assert.equal(canTransitionOrderStatus("preparacion", "cancelada"), true);
  assert.equal(canTransitionOrderStatus("lista", "cancelada"), true);
});

test("canTransitionOrderStatus blocks transitions out of terminal states", () => {
  // 'entregada' es terminal: no puede volver a cocina ni cancelarse
  assert.equal(canTransitionOrderStatus("entregada", "nueva"), false);
  assert.equal(canTransitionOrderStatus("entregada", "preparacion"), false);
  assert.equal(canTransitionOrderStatus("entregada", "lista"), false);
  assert.equal(canTransitionOrderStatus("entregada", "cancelada"), false);

  // 'cancelada' es terminal
  assert.equal(canTransitionOrderStatus("cancelada", "nueva"), false);
  assert.equal(canTransitionOrderStatus("cancelada", "preparacion"), false);
  assert.equal(canTransitionOrderStatus("cancelada", "lista"), false);
  assert.equal(canTransitionOrderStatus("cancelada", "entregada"), false);
});

test("canTransitionOrderStatus blocks backward or skipping transitions", () => {
  // No se puede retroceder de 'lista' a 'nueva'
  assert.equal(canTransitionOrderStatus("lista", "nueva"), false);
  assert.equal(canTransitionOrderStatus("lista", "preparacion"), false);

  // No se puede saltar directo de 'nueva' a 'entregada' sin cocinar
  assert.equal(canTransitionOrderStatus("nueva", "entregada"), false);
});

test("canTransitionOrderStatus allows idempotent self-transitions", () => {
  assert.equal(canTransitionOrderStatus("nueva", "nueva"), true);
  assert.equal(canTransitionOrderStatus("preparacion", "preparacion"), true);
  assert.equal(canTransitionOrderStatus("lista", "lista"), true);
  assert.equal(canTransitionOrderStatus("entregada", "entregada"), true);
});

test("assertValidOrderStatusTransition enforces validation and throws OrderPolicyError", () => {
  // Transición legal pasa sin error
  assert.doesNotThrow(() => {
    assertValidOrderStatusTransition("nueva", "preparacion");
  });

  // Estado destino desconocido
  assert.throws(
    () => assertValidOrderStatusTransition("nueva", "estado_fantasma"),
    (err: unknown) => {
      assert.ok(err instanceof OrderPolicyError);
      assert.equal(err.code, "invalid_order_status");
      assert.equal(err.status, 400);
      return true;
    },
  );

  // Transición ilegal
  assert.throws(
    () => assertValidOrderStatusTransition("entregada", "nueva"),
    (err: unknown) => {
      assert.ok(err instanceof OrderPolicyError);
      assert.equal(err.code, "invalid_status_transition");
      assert.equal(err.status, 422);
      return true;
    },
  );
});
