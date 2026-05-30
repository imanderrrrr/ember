import test from "node:test";
import assert from "node:assert/strict";
import {
  isBlockingReservationStatus,
  parseReservationListFilters,
} from "./reservations.policy.js";

const tableId = "11111111-1111-4111-8111-111111111111";

test("parseReservationListFilters accepts date, timeSlot, tableId and table snapshot filters", () => {
  const filters = parseReservationListFilters({
    date: "2026-05-29",
    timeSlot: "19:30",
    tableId,
    zoneName: "Salón principal",
    tableLabel: "07",
  });

  assert.deepEqual(filters, {
    date: "2026-05-29",
    timeSlot: "19:30",
    tableId,
    zoneName: "Salón principal",
    tableLabel: "07",
  });
});

test("parseReservationListFilters rejects malformed tableId", () => {
  assert.throws(
    () => parseReservationListFilters({ tableId: "mesa-07" }),
    /invalid_table_id/,
  );
});

test("isBlockingReservationStatus only blocks active reservation lifecycle states", () => {
  assert.equal(isBlockingReservationStatus("pending"), true);
  assert.equal(isBlockingReservationStatus("confirmed"), true);
  assert.equal(isBlockingReservationStatus("seated"), true);
  assert.equal(isBlockingReservationStatus("cancelled"), false);
  assert.equal(isBlockingReservationStatus("completed"), false);
  assert.equal(isBlockingReservationStatus("no_show"), false);
});
