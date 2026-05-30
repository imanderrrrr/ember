-- Añade los campos de "ficha rápida" a salon_tables:
--   customer_name → cliente/anfitrión asignado a la mesa
--   party_size    → comensales actuales (independiente de `seats`/capacidad)
--   notes         → observaciones (alergias, aniversario, etc.)
-- Los tres son nullables: una mesa libre no tiene cliente ni notas.

ALTER TABLE "salon_tables"
  ADD COLUMN IF NOT EXISTS "customer_name" text,
  ADD COLUMN IF NOT EXISTS "party_size" integer,
  ADD COLUMN IF NOT EXISTS "notes" text;
