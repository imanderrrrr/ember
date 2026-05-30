-- Ventas y objetivo del turno.
-- Cada cobro completado (la mesa pasa a "limpieza") inserta una fila en
-- "sales" con el desglose real de la cuenta. "shift_goals" guarda la meta de
-- ventas que el gerente fija por fecha de turno (yyyy-mm-dd).
-- Montos en CENTAVOS (enteros) para evitar imprecisión de punto flotante.

CREATE TABLE IF NOT EXISTS "sales" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_id" uuid REFERENCES "salon_tables" ("id") ON DELETE SET NULL,
  "table_label" text NOT NULL,
  "zone_name" text NOT NULL,
  "mesero" text,
  "cashier" text,
  "method" text NOT NULL DEFAULT 'efectivo',
  "subtotal_cents" integer NOT NULL DEFAULT 0,
  "iva_cents" integer NOT NULL DEFAULT 0,
  "total_cents" integer NOT NULL,
  "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "service_date" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sales_service_date_idx"
  ON "sales" ("service_date");

CREATE INDEX IF NOT EXISTS "sales_created_idx"
  ON "sales" ("created_at");

CREATE TABLE IF NOT EXISTS "shift_goals" (
  "service_date" text PRIMARY KEY,
  "goal_cents" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
