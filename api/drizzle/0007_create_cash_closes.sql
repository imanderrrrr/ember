-- Cierres de caja. Cada vez que el cajero "cierra caja" se registra una fila
-- con el cuadre del turno: efectivo esperado (apertura + ventas en efectivo),
-- efectivo contado, diferencia, y el resumen de ventas. Montos en CENTAVOS.

CREATE TABLE IF NOT EXISTS "cash_closes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_date" text NOT NULL,
  "opening_cents" integer NOT NULL DEFAULT 0,
  "expected_cash_cents" integer NOT NULL DEFAULT 0,
  "counted_cash_cents" integer NOT NULL DEFAULT 0,
  "difference_cents" integer NOT NULL DEFAULT 0,
  "total_cents" integer NOT NULL DEFAULT 0,
  "sales_count" integer NOT NULL DEFAULT 0,
  "by_method" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "notes" text,
  "cashier" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cash_closes_service_date_idx"
  ON "cash_closes" ("service_date");
