import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * `users` — Fase 2 mínima. `role` queda como string simple por ahora.
 * Cuando agreguemos RBAC vamos a mover a tablas separadas y este campo
 * se vuelve slug del rol primario o se deprecia.
 *
 * `password_hash` y `pin_hash` usan argon2id (vía @node-rs/argon2).
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  pinHash: text("pin_hash"),
  name: text("name").notNull(),
  role: text("role").notNull().default("gerente_operativo"),
  avatarInitials: text("avatar_initials").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/* ─── Salón ──────────────────────────────────────────────────────────────
 * Single-tenant por ahora — Casa Olivar es el único restaurant. Cuando
 * agreguemos multi-tenant, las tres tablas reciben `restaurant_id` FK.
 *
 * Coordenadas en el canvas se guardan en píxeles del plano lógico (920×900).
 * El render front-end aplica zoom/escala según viewport.
 */

export const zones = pgTable("zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  // Orden de aparición en el sidebar.
  ord: integer("ord").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * `salon_tables` — nombre prefijado para evitar choque con keyword SQL y
 * con el nombre interno `tables` que usaría Drizzle.
 */
export const salonTables = pgTable("salon_tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id")
    .notNull()
    .references(() => zones.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  shape: text("shape").notNull().default("round"), // 'round' | 'rect'
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  seats: integer("seats").notNull().default(4),
  rotation: integer("rotation").notNull().default(0),
  status: text("status").notNull().default("libre"),
  // Ficha rápida de la mesa — visible en el panel derecho del salón en vivo.
  // Nullables porque una mesa libre no tiene cliente, comensales ni notas.
  customerName: text("customer_name"),
  partySize: integer("party_size"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * `shapes` — elementos decorativos del plano (paredes, puertas, ventanales,
 * plantas, columnas, baños, barra, pase de cocina). `zone_id` es opcional
 * — algunos elementos (entrada principal, baños) son globales al plano.
 */
export const shapes = pgTable("shapes", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").references(() => zones.id, { onDelete: "set null" }),
  kind: text("kind").notNull(), // 'wall'|'door'|'window'|'plant'|'column'|'restroom'|'bar'|'kitchen_pass'|'divider'
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  rotation: integer("rotation").notNull().default(0),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const zonesRelations = relations(zones, ({ many }) => ({
  tables: many(salonTables),
  shapes: many(shapes),
}));

export const salonTablesRelations = relations(salonTables, ({ one }) => ({
  zone: one(zones, { fields: [salonTables.zoneId], references: [zones.id] }),
}));

export const shapesRelations = relations(shapes, ({ one }) => ({
  zone: one(zones, { fields: [shapes.zoneId], references: [zones.id] }),
}));

/* ─── Reservaciones ──────────────────────────────────────────────────────
 * Single-tenant todavía. `tableLabel` y `zoneName` son texto libre porque
 * el wizard puede reservar mesas que no existen aún en `salon_tables` (las
 * zonas del wizard son mock independiente del salón en vivo). Cuando el
 * salón y las reservas compartan modelo, esto se vuelve FK opcional.
 *
 * `restrictions` lo guardamos como `text[]` de Postgres — más natural que
 * una tabla puente para algo tan ligero. Si crece la lista de restricciones
 * a un catálogo cerrado, lo movemos a join table.
 *
 * `status` es un enum implícito: pending | confirmed | cancelled | seated |
 * completed | no_show. El wizard siempre crea con "confirmed".
 */
export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").references(() => salonTables.id, { onDelete: "set null" }),
  // Fecha y hora del servicio.
  date: text("date").notNull(),         // ISO yyyy-mm-dd
  timeSlot: text("time_slot").notNull(), // "HH:MM"
  // Detalles del grupo.
  partySize: integer("party_size").notNull(),
  zoneName: text("zone_name").notNull(),
  tableLabel: text("table_label").notNull(),
  // Cliente.
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  // Detalles del servicio.
  occasion: text("occasion"),
  restrictions: text("restrictions").array().notNull().default([]),
  notes: text("notes"),
  // Mesero responsable de la mesa (nombre). Elegido en el wizard.
  mesero: text("mesero"),
  // Ciclo de vida.
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

/* ─── Órdenes de cocina (KDS) ─────────────────────────────────────────────
 * Cada vez que el mesero envía una comanda a cocina se crea una fila aquí.
 * El KDS la lee y la avanza por estados. `items` es JSONB (cantidad + nombre
 * + modificadores) — todavía no hay catálogo normalizado de productos.
 *
 * `status`: nueva | preparacion | lista | entregada
 */
export interface KitchenOrderItem {
  qty: number;
  name: string;
  mods?: string;
}

export const kitchenOrders = pgTable("kitchen_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").references(() => salonTables.id, {
    onDelete: "set null",
  }),
  tableLabel: text("table_label").notNull(),
  zoneName: text("zone_name").notNull(),
  partySize: integer("party_size").notNull().default(1),
  mesero: text("mesero"),
  items: jsonb("items").$type<KitchenOrderItem[]>().notNull().default([]),
  station: text("station").notNull().default("platos"),
  status: text("status").notNull().default("nueva"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KitchenOrder = typeof kitchenOrders.$inferSelect;
export type NewKitchenOrder = typeof kitchenOrders.$inferInsert;

/* ─── Ventas / Cobros ─────────────────────────────────────────────────────
 * Cada cobro completado (la mesa pasa a "limpieza") inserta una venta aquí
 * con el desglose real de la cuenta. Es la fuente de verdad de "ventas del
 * turno" en el dashboard. Montos en CENTAVOS (enteros) para evitar drift de
 * punto flotante. `serviceDate` (yyyy-mm-dd) agrupa las ventas por turno.
 */
export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").references(() => salonTables.id, {
    onDelete: "set null",
  }),
  tableLabel: text("table_label").notNull(),
  zoneName: text("zone_name").notNull(),
  mesero: text("mesero"),
  cashier: text("cashier"),
  method: text("method").notNull().default("efectivo"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  ivaCents: integer("iva_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  items: jsonb("items").$type<KitchenOrderItem[]>().notNull().default([]),
  serviceDate: text("service_date").notNull(), // yyyy-mm-dd del turno
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

/**
 * `shift_goals` — meta de ventas del turno fijada por el gerente, por fecha.
 * El dashboard la usa para mostrar el % de avance hacia el objetivo.
 */
export const shiftGoals = pgTable("shift_goals", {
  serviceDate: text("service_date").primaryKey(), // yyyy-mm-dd
  goalCents: integer("goal_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShiftGoal = typeof shiftGoals.$inferSelect;
export type NewShiftGoal = typeof shiftGoals.$inferInsert;

/**
 * `cash_closes` — cierre de caja del turno. Registra el cuadre (efectivo
 * esperado vs contado, diferencia) y el resumen de ventas al cerrar. Montos
 * en centavos. `byMethod` guarda el desglose por método { metodo: {cents,count} }.
 */
export const cashCloses = pgTable("cash_closes", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceDate: text("service_date").notNull(),
  openingCents: integer("opening_cents").notNull().default(0),
  expectedCashCents: integer("expected_cash_cents").notNull().default(0),
  countedCashCents: integer("counted_cash_cents").notNull().default(0),
  differenceCents: integer("difference_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  salesCount: integer("sales_count").notNull().default(0),
  byMethod: jsonb("by_method").$type<Record<string, { cents: number; count: number }>>().notNull().default({}),
  notes: text("notes"),
  cashier: text("cashier"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CashClose = typeof cashCloses.$inferSelect;
export type NewCashClose = typeof cashCloses.$inferInsert;

/* ─── Estatus / disponibilidad ────────────────────────────────────────────
 * `status_checks` — sondeos de salud de cada componente del sistema usados
 * por la página pública `/status`. Un componente es 'frontend' | 'api' |
 * 'database'. Cada sondeo registra si respondió (`ok`), cuánto tardó
 * (`latencyMs`) y un detalle opcional (mensaje de error, versión, etc.).
 * La página agrupa por día para las barras de 90 días y el % real.
 */
export const statusChecks = pgTable("status_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  component: text("component").notNull(), // 'frontend' | 'api' | 'database'
  ok: boolean("ok").notNull(),
  latencyMs: integer("latency_ms"),
  detail: text("detail"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StatusCheck = typeof statusChecks.$inferSelect;
export type NewStatusCheck = typeof statusChecks.$inferInsert;

export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type SalonTable = typeof salonTables.$inferSelect;
export type NewSalonTable = typeof salonTables.$inferInsert;
export type Shape = typeof shapes.$inferSelect;
export type NewShape = typeof shapes.$inferInsert;
