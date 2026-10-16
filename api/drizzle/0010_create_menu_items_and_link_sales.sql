-- Prioridad 2: Integridad Financiera y Catálogo Oficial
-- El frontend nunca dicta los precios. menu_items almacena los precios oficiales
-- en centavos enteros con su tasa de IVA respectiva.
-- Además se vincula la tabla sales con kitchen_orders mediante order_id para trazabilidad estricta.

CREATE TABLE IF NOT EXISTS "menu_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"ord" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"category" text NOT NULL,
	"category_id" text REFERENCES "menu_categories"("id") ON DELETE set null,
	"is_active" boolean DEFAULT true NOT NULL,
	"iva_rate" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "order_id" uuid REFERENCES "kitchen_orders"("id") ON DELETE set null;
