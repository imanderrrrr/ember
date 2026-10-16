import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { app } from "../app.js";
import { db, pgClient } from "../db/index.js";
import {
  users,
  salonTables,
  zones,
  kitchenOrders,
  sales,
  shiftGoals,
  cashCloses,
  reservations,
  menuItems,
} from "../db/schema.js";
import { eventHub } from "../lib/events.js";
import { getAuthSecret } from "../lib/auth-middleware.js";

function createJwt(payload: Record<string, unknown>, secret = getAuthSecret()) {
  const header = { alg: "HS256", typ: "JWT" };
  const b64 = (s: string) => Buffer.from(s).toString("base64url");
  const encHeader = b64(JSON.stringify(header));
  const encPayload = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }));
  const sig = crypto.createHmac("sha256", secret).update(`${encHeader}.${encPayload}`).digest("base64url");
  return `${encHeader}.${encPayload}.${sig}`;
}

const managerToken = createJwt({ sub: "mgr-test", role: "gerente_operativo", name: "Gerente Test" });
const waiterToken = createJwt({ sub: "waiter-test", role: "mesero", name: "Mesero Test" });
const cashierToken = createJwt({ sub: "cashier-test", role: "cajero", name: "Cajero Test" });

test("Integration: /auth/verify authenticates against real Postgres seed user", async () => {
  const res = await app.request("/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": getAuthSecret(),
    },
    body: JSON.stringify({ email: "chef@ember.com", password: "brasa2026" }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.email, "chef@ember.com");
  assert.equal(data.role, "gerente_operativo");

  // Verify in PostgreSQL database
  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, "chef@ember.com"),
  });
  assert.ok(dbUser);
  assert.equal(dbUser.role, "gerente_operativo");
});

test("Integration: Floor Plan & Salon persistence in Postgres", async () => {
  // 1. Fetch floor plan
  const planRes = await app.request("/salon/floor-plan", {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert.equal(planRes.status, 200);
  const plan = await planRes.json();
  assert.ok(plan.zones.length > 0, "Debe tener zonas del seed");

  // 2. Create a test zone in PostgreSQL
  const createZoneRes = await app.request("/salon/zones", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managerToken}`,
    },
    body: JSON.stringify({ name: "Zona Integración Test" }),
  });
  assert.equal(createZoneRes.status, 201);
  const createdZone = await createZoneRes.json();
  assert.equal(createdZone.name, "Zona Integración Test");

  // 3. Create a table in that zone
  const createTableRes = await app.request("/salon/tables", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managerToken}`,
    },
    body: JSON.stringify({
      zoneId: createdZone.id,
      label: "T-99",
      shape: "rect",
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      seats: 6,
      rotation: 0,
      status: "libre",
    }),
  });
  assert.equal(createTableRes.status, 201);
  const createdTable = await createTableRes.json();
  assert.equal(createdTable.label, "T-99");

  // 4. Update table operational state as a waiter
  const updateTableRes = await app.request(`/salon/tables/${createdTable.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${waiterToken}`,
    },
    body: JSON.stringify({
      status: "ocupada",
      customerName: "Familia Integración",
      partySize: 5,
      notes: "Alergia a mariscos",
    }),
  });
  assert.equal(updateTableRes.status, 200);

  // 5. Query PostgreSQL directly to verify state
  const directTable = await db.query.salonTables.findFirst({
    where: eq(salonTables.id, createdTable.id),
  });
  assert.ok(directTable);
  assert.equal(directTable.status, "ocupada");
  assert.equal(directTable.customerName, "Familia Integración");
  assert.equal(directTable.partySize, 5);

  // Cleanup test zone and table
  await app.request(`/salon/tables/${createdTable.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  await app.request(`/salon/zones/${createdZone.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${managerToken}` },
  });
});

test("Integration: Kitchen Orders lifecycle in Postgres", async () => {
  // 1. Waiter sends order to kitchen
  const createOrderRes = await app.request("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${waiterToken}`,
    },
    body: JSON.stringify({
      tableLabel: "Mesa 02",
      zoneName: "Salón principal",
      partySize: 2,
      mesero: "Marco R.",
      station: "platos",
      items: [
        { qty: 1, name: "Ribeye a la brasa", mods: "Término medio" },
        { qty: 2, name: "Copa Malbec" },
      ],
    }),
  });
  assert.equal(createOrderRes.status, 201);
  const order = await createOrderRes.json();
  assert.equal(order.status, "nueva");
  assert.equal(order.items.length, 2);

  // 2. Kitchen advances order to "preparacion"
  const cookToken = createJwt({ sub: "cook-1", role: "cocina", name: "Cocinero 1" });
  const prepRes = await app.request(`/orders/${order.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookToken}`,
    },
    body: JSON.stringify({ status: "preparacion" }),
  });
  assert.equal(prepRes.status, 200);

  // 3. Kitchen marks order as "lista"
  const readyRes = await app.request(`/orders/${order.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookToken}`,
    },
    body: JSON.stringify({ status: "lista" }),
  });
  assert.equal(readyRes.status, 200);

  // 4. Verify in PostgreSQL directly
  const directOrder = await db.query.kitchenOrders.findFirst({
    where: eq(kitchenOrders.id, order.id),
  });
  assert.ok(directOrder);
  assert.equal(directOrder.status, "lista");
});

test("Integration: Sales, Goal & Cash Close in Postgres", async () => {
  const testDate = "2026-10-15";

  // Pre-limpieza para garantizar idempotencia del test
  await db.delete(sales).where(eq(sales.serviceDate, testDate));
  await db.delete(shiftGoals).where(eq(shiftGoals.serviceDate, testDate));
  await db.delete(cashCloses).where(eq(cashCloses.serviceDate, testDate));

  // 1. Set shift goal as manager
  const goalRes = await app.request("/sales/goal", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managerToken}`,
    },
    body: JSON.stringify({ serviceDate: testDate, goalCents: 500000 }), // Q5,000.00
  });
  assert.equal(goalRes.status, 200);

  // 2. Record sale
  const saleRes = await app.request("/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      tableLabel: "Mesa 05",
      zoneName: "Terraza",
      mesero: "Andrés M.",
      cashier: "Cajero Test",
      method: "efectivo",
      subtotalCents: 30000,
      ivaCents: 3600,
      totalCents: 33600, // Q336.00
      serviceDate: testDate,
    }),
  });
  assert.equal(saleRes.status, 201);

  // 3. Check summary
  const summaryRes = await app.request(`/sales/summary?date=${testDate}`, {
    headers: { Authorization: `Bearer ${cashierToken}` },
  });
  assert.equal(summaryRes.status, 200);
  const summary = await summaryRes.json();
  assert.ok(summary.totalCents >= 33600);
  assert.equal(summary.goalCents, 500000);

  // 4. Perform shift cash close
  const closeRes = await app.request("/sales/close", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      serviceDate: testDate,
      countedCashCents: 183600, // Opening (150,000) + 33,600 = 183,600 exact
      cashier: "Cajero Test",
      notes: "Cierre cuadrado perfectamente",
    }),
  });
  assert.equal(closeRes.status, 201);
  const closeData = await closeRes.json();
  assert.ok(closeData.closed, "El turno debe figurar como cerrado");
  assert.ok(closeData.close, "Debe contener el objeto de cierre");
  assert.equal(closeData.close.differenceCents, 0, "El cuadre de caja debe ser exacto (diferencia 0)");

  // 5. Verify direct Postgres record
  const directClose = await db.query.cashCloses.findFirst({
    where: eq(cashCloses.serviceDate, testDate),
  });
  assert.ok(directClose);
  assert.equal(directClose.cashier, "Cajero Test");
  assert.equal(directClose.differenceCents, 0);
});

test("Integration: Reservations lifecycle in Postgres", async () => {
  const hostToken = createJwt({ sub: "host-1", role: "host", name: "Hostess Ana" });
  const resDate = "2026-11-20";

  // Pre-limpieza para garantizar idempotencia
  await db.delete(reservations).where(eq(reservations.date, resDate));

  // 1. Create reservation
  const createRes = await app.request("/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${hostToken}`,
    },
    body: JSON.stringify({
      date: resDate,
      timeSlot: "20:30",
      partySize: 4,
      zoneName: "Salón principal",
      tableLabel: "Mesa 03",
      customerName: "Ing. Roberto Peña",
      customerPhone: "+502 5555-1234",
      customerEmail: "roberto@example.com",
      occasion: "Aniversario",
      restrictions: ["vegetariano"],
      notes: "Mesa junto a la ventana si es posible",
      mesero: "Marco R.",
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.customerName, "Ing. Roberto Peña");
  assert.equal(created.status, "confirmed");

  // 2. Query reservations by date
  const listRes = await app.request(`/reservations?date=${resDate}`, {
    headers: { Authorization: `Bearer ${hostToken}` },
  });
  assert.equal(listRes.status, 200);
  const list = await listRes.json();
  assert.ok(list.some((r: { customerName: string }) => r.customerName === "Ing. Roberto Peña"));

  // 3. Verify in PostgreSQL directly
  const directRes = await db.query.reservations.findFirst({
    where: eq(reservations.customerName, "Ing. Roberto Peña"),
  });
  assert.ok(directRes);
  assert.equal(directRes.timeSlot, "20:30");
  assert.deepEqual(directRes.restrictions, ["vegetariano"]);
});

test("Integration Prioridad 2: El frontend NUNCA dicta los precios & prevención de fraude", async () => {
  const testDate = "2026-10-16";

  // Pre-limpieza
  await db.delete(sales).where(eq(sales.serviceDate, testDate));

  // 1. Intento de fraude: el cliente envía un totalCents alterado (Q10.00 en vez del valor del catálogo)
  const tamperedTotalRes = await app.request("/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      tableLabel: "Mesa 08",
      zoneName: "Salón principal",
      mesero: "Diego Ramos",
      cashier: "Cajero Test",
      method: "efectivo",
      serviceDate: testDate,
      totalCents: 1000, // Q10.00 (falso, cuando debería ser más de Q300)
      items: [
        { menuItemId: "ent-1", quantity: 2 }, // Tartar de atún: 8900 * 2 = 17800 + IVA
        { menuItemId: "pri-1", quantity: 1 }, // Risotto de hongos: 9500 + IVA
      ],
    }),
  });

  assert.equal(tamperedTotalRes.status, 400, "Debe rechazar monto total alterado");
  const tamperedTotalData = await tamperedTotalRes.json();
  assert.equal(tamperedTotalData.error, "price_tampered");

  // 2. Intento de fraude: el cliente intenta alterar el subtotal
  const tamperedSubtotalRes = await app.request("/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      tableLabel: "Mesa 08",
      zoneName: "Salón principal",
      mesero: "Diego Ramos",
      cashier: "Cajero Test",
      method: "efectivo",
      serviceDate: testDate,
      subtotalCents: 5000, // Alterado
      items: [
        { menuItemId: "ent-1", quantity: 1 },
      ],
    }),
  });

  assert.equal(tamperedSubtotalRes.status, 400, "Debe rechazar subtotal alterado");
  const tamperedSubtotalData = await tamperedSubtotalRes.json();
  assert.equal(tamperedSubtotalData.error, "price_tampered");

  // 3. Venta legítima: el cliente ÚNICAMENTE envía menuItemId y quantity
  // Tartar de atún (ent-1): 8900 * 2 = 17800 subtotal, IVA 12% = 2136
  // Risotto de hongos (pri-1): 9500 * 1 = 9500 subtotal, IVA 12% = 1140
  // Subtotal oficial = 27300, IVA oficial = 3276, Total oficial = 30576
  const legitSaleRes = await app.request("/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      tableLabel: "Mesa 08",
      zoneName: "Salón principal",
      mesero: "Diego Ramos",
      cashier: "Cajero Test",
      method: "tarjeta",
      serviceDate: testDate,
      items: [
        { menuItemId: "ent-1", quantity: 2 },
        { menuItemId: "pri-1", quantity: 1 },
      ],
    }),
  });

  assert.equal(legitSaleRes.status, 201, "Debe registrar la venta calculada en el backend");
  const legitSale = await legitSaleRes.json();
  assert.equal(legitSale.subtotalCents, 27300, "Subtotal calculado estrictamente por el backend");
  assert.equal(legitSale.ivaCents, 3276, "IVA calculado estrictamente por el backend");
  assert.equal(legitSale.totalCents, 30576, "Total calculado estrictamente por el backend");

  // 4. Verificar integridad directa en la base de datos PostgreSQL
  const dbSale = await db.query.sales.findFirst({
    where: eq(sales.id, legitSale.id),
  });
  assert.ok(dbSale);
  assert.equal(dbSale.subtotalCents, 27300);
  assert.equal(dbSale.ivaCents, 3276);
  assert.ok(dbSale.items);
  assert.equal(dbSale.items.length, 2);
  assert.equal(dbSale.items[0]?.name, "Tartar de atún");
  assert.equal(dbSale.items[1]?.name, "Risotto de hongos");
});

test("Integration Prioridad 2: Atomicidad ACID y Rollback Total en Cobro de Mesa", async () => {
  const testDate = "2026-10-17";

  // Pre-limpieza
  await db.delete(sales).where(eq(sales.serviceDate, testDate));

  // 1. Crear mesa de prueba en estado 'ocupada'
  const floorPlan = await app.request("/salon/floor-plan", {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  const plan = await floorPlan.json();
  const zoneId = plan.zones[0].id;

  const tableRes = await app.request("/salon/tables", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managerToken}`,
    },
    body: JSON.stringify({
      zoneId,
      label: "M-ACID",
      shape: "rect",
      x: 120,
      y: 120,
      width: 80,
      height: 80,
      seats: 4,
      rotation: 0,
      status: "ocupada",
      customerName: "Cliente ACID",
      partySize: 3,
    }),
  });
  assert.equal(tableRes.status, 201);
  const testTable = await tableRes.json();

  // 2. Crear comanda de cocina para la mesa
  const orderRes = await app.request("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${waiterToken}`,
    },
    body: JSON.stringify({
      tableId: testTable.id,
      tableLabel: testTable.label,
      zoneName: "Zona Test",
      partySize: 3,
      mesero: "Mesero Test",
      station: "platos",
      items: [{ menuItemId: "car-1", quantity: 2 }], // Cordero al horno
    }),
  });
  assert.equal(orderRes.status, 201);
  const testOrder = await orderRes.json();
  assert.equal(testOrder.status, "nueva");

  // 3. Simular fallo inducido en transacción: mesa inexistente
  const failedCheckoutRes = await app.request("/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      tableId: "00000000-0000-0000-0000-000000000000", // Mesa inexistente
      orderId: testOrder.id,
      tableLabel: "M-FANTASMA",
      zoneName: "Zona Fantasma",
      serviceDate: testDate,
      items: [{ menuItemId: "car-1", quantity: 2 }],
    }),
  });
  assert.equal(failedCheckoutRes.status, 404, "Debe fallar al no encontrar la mesa");

  // Verificar ROLLBACK TOTAL en PostgreSQL:
  // - No debe haberse insertado ninguna venta en testDate
  const failedSales = await db.query.sales.findMany({
    where: eq(sales.serviceDate, testDate),
  });
  assert.equal(failedSales.length, 0, "Rollback: la venta NO debe haberse insertado");

  // - La orden de cocina original NO debe haberse modificado (permanece 'nueva')
  const untouchedOrder = await db.query.kitchenOrders.findFirst({
    where: eq(kitchenOrders.id, testOrder.id),
  });
  assert.ok(untouchedOrder);
  assert.equal(untouchedOrder.status, "nueva", "Rollback: la orden debe permanecer intacta");

  // 4. Cobro exitoso dentro de transacción atómica completa
  const successCheckoutRes = await app.request("/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      tableId: testTable.id,
      orderId: testOrder.id,
      tableLabel: testTable.label,
      zoneName: "Zona Test",
      cashier: "Cajero Test",
      method: "efectivo",
      serviceDate: testDate,
      items: [{ menuItemId: "car-1", quantity: 2 }],
    }),
  });
  assert.equal(successCheckoutRes.status, 201);
  const completedSale = await successCheckoutRes.json();

  // Verificar la transacción atómica completa en PostgreSQL:
  // a) Ticket de venta registrado con trazabilidad a la orden (orderId)
  assert.equal(completedSale.orderId, testOrder.id, "Trazabilidad comanda -> venta estricta");
  const verifiedSale = await db.query.sales.findFirst({
    where: eq(sales.id, completedSale.id),
  });
  assert.ok(verifiedSale);
  assert.equal(verifiedSale.orderId, testOrder.id);

  // b) Comanda de cocina marcada como 'entregada'
  const completedOrder = await db.query.kitchenOrders.findFirst({
    where: eq(kitchenOrders.id, testOrder.id),
  });
  assert.ok(completedOrder);
  assert.equal(completedOrder.status, "entregada");

  // c) Mesa pasada a estado 'limpieza'
  const updatedTable = await db.query.salonTables.findFirst({
    where: eq(salonTables.id, testTable.id),
  });
  assert.ok(updatedTable);
  assert.equal(updatedTable.status, "limpieza");

  // Cleanup de la mesa de test
  await app.request(`/salon/tables/${testTable.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${managerToken}` },
  });
});

test("Integration Prioridad 3: EventHub y Realtime SSE emite eventos de dominio", async () => {
  const eventsReceived: Array<{ type: string; data: any }> = [];

  const unsubscribe = eventHub.subscribe((evt) => {
    eventsReceived.push({ type: evt.type, data: evt.data });
  });

  try {
    // 1. Emitir order:created al crear comanda
    const orderRes = await app.request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${waiterToken}`,
      },
      body: JSON.stringify({
        tableLabel: "Mesa SSE",
        zoneName: "Terraza",
        partySize: 2,
        mesero: "Marco R.",
        station: "bebidas",
        items: [{ menuItemId: "beb-1", quantity: 2 }],
      }),
    });
    assert.equal(orderRes.status, 201);
    const order = await orderRes.json();

    // 2. Emitir order:status_updated al cambiar estado
    const cookToken = createJwt({ sub: "cook-1", role: "cocina", name: "Cocinero 1" });
    const patchOrderRes = await app.request(`/orders/${order.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookToken}`,
      },
      body: JSON.stringify({ status: "preparacion" }),
    });
    assert.equal(patchOrderRes.status, 200);

    // Verificar que los eventos fueron despachados por el Hub
    assert.ok(eventsReceived.some((e) => e.type === "order:created"));
    assert.ok(eventsReceived.some((e) => e.type === "order:status_updated"));

    // 3. Probar endpoint SSE GET /events
    const ac = new AbortController();
    const sseRes = await app.request("/events", { signal: ac.signal });
    assert.equal(sseRes.status, 200);
    assert.equal(sseRes.headers.get("content-type"), "text/event-stream");
    ac.abort();
  } finally {
    unsubscribe();
  }
});

test("Integration Prioridad 4: Analítica real de ventas por hora y métricas operativas en Postgres", async () => {
  const testDate = "2026-12-31";

  // Limpieza inicial para idempotencia
  await db.delete(sales).where(eq(sales.serviceDate, testDate));

  // 1. Estado vacío elegante cuando no hay ventas
  const emptyHourlyRes = await app.request(`/sales/analytics/hourly?date=${testDate}`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert.equal(emptyHourlyRes.status, 200);
  const emptyHourly = await emptyHourlyRes.json();
  assert.equal(emptyHourly.serviceDate, testDate);
  assert.equal(emptyHourly.items.length, 0);
  assert.equal(emptyHourly.peakHour, null);
  assert.equal(emptyHourly.totalCents, 0);

  const emptyPerfRes = await app.request(`/sales/analytics/performance?date=${testDate}`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert.equal(emptyPerfRes.status, 200);
  const emptyPerf = await emptyPerfRes.json();
  assert.equal(emptyPerf.serviceDate, testDate);
  assert.equal(emptyPerf.totalTickets, 0);
  assert.equal(emptyPerf.ticketAverageCents, 0);

  // 2. Crear mesa y orden en cocina para vincular
  const orderRes = await app.request("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${waiterToken}`,
    },
    body: JSON.stringify({
      tableLabel: "Mesa Analytics",
      zoneName: "Salón principal",
      partySize: 4,
      mesero: "Marco R.",
      station: "platos",
      items: [{ menuItemId: "ent-1", quantity: 2 }],
    }),
  });
  assert.equal(orderRes.status, 201);
  const testOrder = await orderRes.json();

  // 3. Registrar venta asociada a la orden
  const saleRes = await app.request("/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cashierToken}`,
    },
    body: JSON.stringify({
      orderId: testOrder.id,
      tableLabel: "Mesa Analytics",
      zoneName: "Salón principal",
      serviceDate: testDate,
      method: "tarjeta",
      items: [{ menuItemId: "ent-1", quantity: 2 }],
    }),
  });
  assert.equal(saleRes.status, 201);
  const sale = await saleRes.json();
  assert.ok(sale.totalCents > 0);

  // 4. Consultar analítica horaria real
  const hourlyRes = await app.request(`/sales/analytics/hourly?date=${testDate}`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert.equal(hourlyRes.status, 200);
  const hourly = await hourlyRes.json();
  assert.ok(hourly.items.length >= 1);
  assert.equal(hourly.totalCents, sale.totalCents);
  assert.ok(hourly.peakHour !== null);
  assert.ok(hourly.peakHourLabel !== null);

  // 5. Consultar métricas operativas reales
  const perfRes = await app.request(`/sales/analytics/performance?date=${testDate}`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert.equal(perfRes.status, 200);
  const perf = await perfRes.json();
  assert.equal(perf.totalTickets, 1);
  assert.equal(perf.ticketAverageCents, sale.totalCents);
  assert.ok(perf.totalConfiguredTables > 0);
  assert.ok(perf.tableTurnover >= 0);
  assert.ok(perf.avgServiceSeconds !== null);

  // Limpieza final
  await db.delete(sales).where(eq(sales.serviceDate, testDate));
  await db.delete(kitchenOrders).where(eq(kitchenOrders.id, testOrder.id));
});


after(async () => {
  await pgClient.end({ timeout: 2 });
});
