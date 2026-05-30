-- Link reservaciones to the stable salon table when the table exists.
-- Keep zone_name/table_label as display snapshots for historical records.

ALTER TABLE "reservations"
  ADD COLUMN IF NOT EXISTS "table_id" uuid
    REFERENCES "salon_tables" ("id") ON DELETE SET NULL;

UPDATE "reservations" AS r
SET "table_id" = t."id"
FROM "salon_tables" AS t
JOIN "zones" AS z ON z."id" = t."zone_id"
WHERE r."table_id" IS NULL
  AND r."zone_name" = z."name"
  AND r."table_label" = t."label";

CREATE INDEX IF NOT EXISTS "reservations_table_date_time_idx"
  ON "reservations" ("table_id", "date", "time_slot");
