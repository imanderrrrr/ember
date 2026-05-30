CREATE TABLE IF NOT EXISTS "zones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "ord" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "salon_tables" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "zone_id" uuid NOT NULL REFERENCES "zones"("id") ON DELETE CASCADE,
  "label" text NOT NULL,
  "shape" text DEFAULT 'round' NOT NULL,
  "x" integer NOT NULL,
  "y" integer NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "seats" integer DEFAULT 4 NOT NULL,
  "rotation" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'libre' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "salon_tables_zone_id_idx" ON "salon_tables" ("zone_id");

CREATE TABLE IF NOT EXISTS "shapes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "zone_id" uuid REFERENCES "zones"("id") ON DELETE SET NULL,
  "kind" text NOT NULL,
  "x" integer NOT NULL,
  "y" integer NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "rotation" integer DEFAULT 0 NOT NULL,
  "label" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "shapes_zone_id_idx" ON "shapes" ("zone_id");
