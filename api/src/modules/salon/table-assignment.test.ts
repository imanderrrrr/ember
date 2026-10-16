import test from "node:test";
import assert from "node:assert/strict";
import {
  validateTableCapacity,
  validateTableUpdatePermissions,
  canModifySalonLayout,
  SalonPolicyError,
  LAYOUT_PROPERTIES,
} from "./salon.policy.js";
import { isBlockingReservationStatus } from "../reservations/reservations.policy.js";

test("validateTableCapacity validates party size against table seating capacity", () => {
  // Mesa de 4 asientos
  assert.equal(validateTableCapacity(4, 2), true); // 2 personas caben perfectamente
  assert.equal(validateTableCapacity(4, 4), true); // 4 personas caben exactas
  assert.equal(validateTableCapacity(4, 6), true); // 6 personas caben con tolerancia (+2 sillas)
  assert.equal(validateTableCapacity(4, 7), false); // 7 personas excede el límite
  assert.equal(validateTableCapacity(4, 0), false); // 0 comensales es inválido
  assert.equal(validateTableCapacity(4, -1), false); // negativo es inválido
});

test("canModifySalonLayout restricts architecture modifications to managers and admin", () => {
  assert.equal(canModifySalonLayout("gerente_operativo"), true);
  assert.equal(canModifySalonLayout("admin"), true);
  assert.equal(canModifySalonLayout("system-internal"), true);

  assert.equal(canModifySalonLayout("mesero"), false);
  assert.equal(canModifySalonLayout("cajero"), false);
  assert.equal(canModifySalonLayout("host"), false);
  assert.equal(canModifySalonLayout("cocina"), false);
  assert.equal(canModifySalonLayout("chef"), false);
});

test("validateTableUpdatePermissions allows operational staff to update table status and customer details", () => {
  const operationalUpdates = [
    { status: "ocupada", customerName: "Familia García", partySize: 4 },
    { status: "cocina" },
    { status: "esperando" },
    { status: "limpieza", customerName: null, partySize: null },
    { notes: "Comensal solicita silla para bebé" },
  ];

  for (const update of operationalUpdates) {
    // Mesero
    assert.doesNotThrow(() => {
      validateTableUpdatePermissions("mesero", update);
    });
    // Cajero
    assert.doesNotThrow(() => {
      validateTableUpdatePermissions("cajero", update);
    });
    // Host
    assert.doesNotThrow(() => {
      validateTableUpdatePermissions("host", update);
    });
  }
});

test("validateTableUpdatePermissions BLOCKS non-managers from modifying table layout or geometry with 403", () => {
  const unauthorizedRoles = ["mesero", "cajero", "host", "cocina"];

  for (const property of LAYOUT_PROPERTIES) {
    const maliciousPayload = { [property]: property === "seats" ? 10 : 150 };

    for (const role of unauthorizedRoles) {
      assert.throws(
        () => validateTableUpdatePermissions(role, maliciousPayload),
        (err: unknown) => {
          assert.ok(err instanceof SalonPolicyError);
          assert.equal(err.code, "forbidden_layout_modification");
          assert.equal(err.status, 403);
          return true;
        },
        `El rol '${role}' no debe tener permisos para modificar la propiedad física '${property}'`,
      );
    }
  }
});

test("validateTableUpdatePermissions allows managers to update both layout and operational fields", () => {
  const managerRoles = ["gerente_operativo", "admin"];
  const fullUpdate = {
    x: 450,
    y: 300,
    width: 90,
    height: 90,
    seats: 6,
    rotation: 45,
    label: "Mesa 12",
    shape: "round",
    status: "ocupada",
    customerName: "VIP",
  };

  for (const role of managerRoles) {
    assert.doesNotThrow(() => {
      validateTableUpdatePermissions(role, fullUpdate);
    });
  }
});

test("Reservation policy protects table allocation from double-booking", () => {
  // Estados que bloquean la mesa físicamente para esa franja
  assert.equal(isBlockingReservationStatus("pending"), true);
  assert.equal(isBlockingReservationStatus("confirmed"), true);
  assert.equal(isBlockingReservationStatus("seated"), true);

  // Estados liberados que permiten reasignar la mesa
  assert.equal(isBlockingReservationStatus("completed"), false);
  assert.equal(isBlockingReservationStatus("cancelled"), false);
  assert.equal(isBlockingReservationStatus("no_show"), false);
});
