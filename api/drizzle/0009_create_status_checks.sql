-- Sondeos de disponibilidad para la página pública de estatus (/status).
-- Cada chequeo en vivo de un componente (frontend | api | database) inserta
-- una fila aquí. La página agrupa por día para dibujar las barras de los
-- últimos 90 días y calcular el % de disponibilidad real (días sin incidentes
-- registrados se muestran operativos). La escritura está throttle-ada a ~1/min
-- por componente en la capa de servicio, así que la tabla crece de forma acotada.

CREATE TABLE IF NOT EXISTS "status_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "component" text NOT NULL,        -- 'frontend' | 'api' | 'database'
  "ok" boolean NOT NULL,
  "latency_ms" integer,
  "detail" text,
  "checked_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "status_checks_component_checked_at_idx"
  ON "status_checks" ("component", "checked_at");
