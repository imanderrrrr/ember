-- Mesero responsable de la reserva (nombre, igual que kitchen_orders.mesero).
-- Se elige en el wizard de reserva desde el roster de meseros.

ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "mesero" text;
