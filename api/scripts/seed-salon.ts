import { sql } from "drizzle-orm";
import { db, pgClient } from "../src/db/index.js";
import { salonTables, shapes, zones } from "../src/db/schema.js";

/**
 * Seed que reproduce visualmente la pantalla "Salón en vivo - Restaurant
 * Manager" del archivo de diseño. NO es idempotente con append: borra todo
 * y recrea. Lo elegimos así porque este seed es de demo/visual fidelity,
 * no de bootstrap de producción.
 *
 * Cuatro zonas, ord 0..3:
 *   - "Salón principal" (zona activa por defecto, 13 mesas visibles)
 *   - "Terraza" (8 mesas stub)
 *   - "Barra" (6 mesas stub)
 *   - "VIP" (4 mesas stub)
 *
 * Para correrlo dentro del contenedor:
 *   docker compose exec api node_modules/.bin/tsx scripts/seed-salon.ts
 */

async function main() {
  console.log("[seed-salon] truncating salon tables…");
  // CASCADE limpia tablas y shapes que dependen de zones.
  await db.execute(sql`TRUNCATE TABLE "shapes", "salon_tables", "zones" CASCADE`);

  console.log("[seed-salon] inserting zones…");
  const [principal, terraza, barra, vip] = await db
    .insert(zones)
    .values([
      { name: "Salón principal", ord: 0 },
      { name: "Terraza", ord: 1 },
      { name: "Barra", ord: 2 },
      { name: "VIP", ord: 3 },
    ])
    .returning();
  if (!principal || !terraza || !barra || !vip) {
    throw new Error("[seed-salon] failed to insert all required zones");
  }

  console.log("[seed-salon] inserting tables for Salón principal…");
  await db.insert(salonTables).values([
    // ─── Fila superior: Zona Ventanal + Zona Interior ────────────────
    {
      zoneId: principal.id,
      label: "01",
      shape: "round",
      x: 180,
      y: 140,
      width: 80,
      height: 80,
      seats: 4,
      status: "libre",
    },
    {
      zoneId: principal.id,
      label: "02",
      shape: "round",
      x: 320,
      y: 140,
      width: 80,
      height: 80,
      seats: 4,
      status: "ocupada",
      customerName: "Mesa 02",
      partySize: 3,
    },
    {
      zoneId: principal.id,
      label: "05",
      shape: "round",
      x: 500,
      y: 140,
      width: 80,
      height: 80,
      seats: 4,
      status: "libre",
    },
    {
      zoneId: principal.id,
      label: "06",
      shape: "round",
      x: 640,
      y: 130,
      width: 96,
      height: 96,
      seats: 6,
      status: "ocupada",
      customerName: "Mesa 06",
      partySize: 6,
    },
    {
      zoneId: principal.id,
      label: "11",
      shape: "round",
      x: 800,
      y: 140,
      width: 80,
      height: 80,
      seats: 4,
      status: "reservada",
      customerName: "Reserva 21:30",
    },

    // ─── Fila intermedia 1 ───────────────────────────────────────────
    {
      zoneId: principal.id,
      label: "03",
      shape: "rect",
      x: 200,
      y: 320,
      width: 64,
      height: 64,
      seats: 2,
      status: "reservada",
      customerName: "Reserva 20:00",
    },
    {
      zoneId: principal.id,
      label: "04",
      shape: "rect",
      x: 320,
      y: 320,
      width: 180,
      height: 80,
      seats: 6,
      status: "cocina",
      customerName: "Mesa 04",
      partySize: 6,
    },

    // ─── Fila intermedia 2 ───────────────────────────────────────────
    {
      zoneId: principal.id,
      label: "07",
      shape: "rect",
      x: 200,
      y: 530,
      width: 200,
      height: 90,
      seats: 6,
      status: "ocupada",
      customerName: "Familia García",
      partySize: 6,
      notes: "Cliente alérgico a frutos secos. Aniversario — postre cortesía.",
    },
    {
      zoneId: principal.id,
      label: "08",
      shape: "round",
      x: 500,
      y: 540,
      width: 80,
      height: 80,
      seats: 4,
      status: "esperando",
      customerName: "Mesa 08",
      partySize: 4,
    },
    {
      zoneId: principal.id,
      label: "09",
      shape: "rect",
      x: 640,
      y: 550,
      width: 100,
      height: 60,
      seats: 2,
      status: "libre",
    },
    {
      zoneId: principal.id,
      label: "10",
      shape: "rect",
      x: 800,
      y: 550,
      width: 80,
      height: 60,
      seats: 4,
      status: "limpieza",
    },

    // ─── Fila inferior ───────────────────────────────────────────────
    {
      zoneId: principal.id,
      label: "12",
      shape: "round",
      x: 200,
      y: 720,
      width: 96,
      height: 96,
      seats: 6,
      status: "libre",
    },
    {
      zoneId: principal.id,
      label: "13",
      shape: "rect",
      x: 380,
      y: 740,
      width: 240,
      height: 80,
      seats: 8,
      status: "reservada",
      customerName: "Familia Ortiz",
    },
  ]);

  console.log("[seed-salon] inserting tables for Terraza, Barra, VIP…");
  await db.insert(salonTables).values([
    // ─── Terraza (8 mesas, distribución de estados variada) ──────────
    { zoneId: terraza.id, label: "T1", shape: "round", x: 120, y: 160, width: 80, height: 80, seats: 4, status: "libre" },
    { zoneId: terraza.id, label: "T2", shape: "round", x: 280, y: 160, width: 80, height: 80, seats: 4, status: "ocupada", customerName: "Mesa T2", partySize: 3 },
    { zoneId: terraza.id, label: "T3", shape: "round", x: 440, y: 160, width: 80, height: 80, seats: 4, status: "ocupada", customerName: "Mesa T3", partySize: 4 },
    { zoneId: terraza.id, label: "T4", shape: "round", x: 600, y: 160, width: 80, height: 80, seats: 4, status: "reservada", customerName: "Reserva 20:30" },
    { zoneId: terraza.id, label: "T5", shape: "round", x: 120, y: 360, width: 80, height: 80, seats: 4, status: "libre" },
    { zoneId: terraza.id, label: "T6", shape: "round", x: 280, y: 360, width: 80, height: 80, seats: 4, status: "libre" },
    { zoneId: terraza.id, label: "T7", shape: "round", x: 440, y: 360, width: 80, height: 80, seats: 4, status: "libre" },
    { zoneId: terraza.id, label: "T8", shape: "rect", x: 600, y: 360, width: 180, height: 80, seats: 6, status: "cocina", customerName: "Mesa T8", partySize: 5 },

    // ─── Barra (6 puestos lineales) ──────────────────────────────────
    { zoneId: barra.id, label: "B1", shape: "rect", x: 140, y: 200, width: 80, height: 50, seats: 1, status: "libre" },
    { zoneId: barra.id, label: "B2", shape: "rect", x: 260, y: 200, width: 80, height: 50, seats: 1, status: "ocupada", customerName: "Cliente B2", partySize: 1 },
    { zoneId: barra.id, label: "B3", shape: "rect", x: 380, y: 200, width: 80, height: 50, seats: 1, status: "ocupada", customerName: "Cliente B3", partySize: 1 },
    { zoneId: barra.id, label: "B4", shape: "rect", x: 500, y: 200, width: 80, height: 50, seats: 1, status: "limpieza" },
    { zoneId: barra.id, label: "B5", shape: "rect", x: 620, y: 200, width: 80, height: 50, seats: 1, status: "esperando", customerName: "Cliente B5", partySize: 1 },
    { zoneId: barra.id, label: "B6", shape: "rect", x: 140, y: 320, width: 200, height: 50, seats: 4, status: "reservada", customerName: "Reserva 22:00" },

    // ─── VIP (4 mesas privadas) ──────────────────────────────────────
    { zoneId: vip.id, label: "V1", shape: "rect", x: 140, y: 160, width: 200, height: 100, seats: 8, status: "ocupada", customerName: "Empresa Méndez", partySize: 7 },
    { zoneId: vip.id, label: "V2", shape: "round", x: 420, y: 160, width: 96, height: 96, seats: 6, status: "cocina", customerName: "Mesa V2", partySize: 5 },
    { zoneId: vip.id, label: "V3", shape: "round", x: 580, y: 160, width: 96, height: 96, seats: 6, status: "limpieza" },
    { zoneId: vip.id, label: "V4", shape: "rect", x: 140, y: 340, width: 200, height: 100, seats: 8, status: "limpieza" },
  ]);

  console.log("[seed-salon] inserting decorative shapes…");
  await db.insert(shapes).values([
    // Ventanal y label de la zona ventanal.
    {
      zoneId: principal.id,
      kind: "window",
      x: 60,
      y: 0,
      width: 760,
      height: 3,
      label: "VENTANAL · TERRAZA",
    },

    // Plantas decorativas en las esquinas superiores.
    {
      zoneId: principal.id,
      kind: "plant",
      x: 20,
      y: 80,
      width: 56,
      height: 56,
      label: null,
    },
    {
      zoneId: principal.id,
      kind: "plant",
      x: 850,
      y: 80,
      width: 56,
      height: 56,
      label: null,
    },

    // Pase de cocina (negro, esquina inferior derecha).
    {
      zoneId: principal.id,
      kind: "kitchen_pass",
      x: 660,
      y: 760,
      width: 240,
      height: 90,
      label: "PASE DE COCINA",
    },

    // Entrada principal y baños — globales al plano.
    {
      zoneId: null,
      kind: "door",
      x: 24,
      y: 860,
      width: 180,
      height: 28,
      label: "ENTRADA PRINCIPAL",
    },
    {
      zoneId: null,
      kind: "restroom",
      x: 824,
      y: 1,
      width: 80,
      height: 62,
      label: "BAÑOS",
    },
  ]);

  console.log("[seed-salon] done.");
}

main()
  .catch((err) => {
    console.error("[seed-salon] FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pgClient.end();
  });
