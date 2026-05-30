-- Órdenes de cocina (KDS). El mesero crea una fila al "Enviar a cocina";
-- la cocina la avanza por estados (nueva → preparacion → lista → entregada).

CREATE TABLE IF NOT EXISTS "kitchen_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_id" uuid REFERENCES "salon_tables" ("id") ON DELETE SET NULL,
  "table_label" text NOT NULL,
  "zone_name" text NOT NULL,
  "party_size" integer NOT NULL DEFAULT 1,
  "mesero" text,
  "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "station" text NOT NULL DEFAULT 'platos',
  "status" text NOT NULL DEFAULT 'nueva',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "kitchen_orders_status_idx"
  ON "kitchen_orders" ("status");

CREATE INDEX IF NOT EXISTS "kitchen_orders_created_idx"
  ON "kitchen_orders" ("created_at");
