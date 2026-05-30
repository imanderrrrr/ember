-- Tabla de reservaciones del wizard /reservas/nueva.
-- Single-tenant; cuando agreguemos restaurant_id va aquí también.

CREATE TABLE IF NOT EXISTS "reservations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" text NOT NULL,
  "time_slot" text NOT NULL,
  "party_size" integer NOT NULL,
  "zone_name" text NOT NULL,
  "table_label" text NOT NULL,
  "customer_name" text NOT NULL,
  "customer_phone" text,
  "customer_email" text,
  "occasion" text,
  "restrictions" text[] NOT NULL DEFAULT '{}',
  "notes" text,
  "status" text NOT NULL DEFAULT 'confirmed',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Índice por (date, time_slot) — la consulta más frecuente será buscar
-- las reservas de un turno específico.
CREATE INDEX IF NOT EXISTS "reservations_date_time_idx"
  ON "reservations" ("date", "time_slot");
