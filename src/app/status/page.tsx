import type { Metadata } from "next";
import { getStatus } from "./_lib/status";
import { StatusClient } from "./status-client";

/**
 * Página PÚBLICA de estatus del sistema (`/status`), al estilo de las status
 * pages clásicas: banner global + un reporte por componente (Frontend, Backend
 * y Base de datos) con barras de disponibilidad de 90 días.
 *
 * No requiere sesión (no hay middleware global y esta página no llama a auth()).
 * El estado inicial se renderiza en el servidor y el cliente lo refresca cada
 * 60s contra `/api/status`.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Estatus del sistema · EMBER",
  description: "Disponibilidad en vivo de los componentes de EMBER Restaurant OS.",
};

export default async function StatusPage() {
  const initial = await getStatus();
  return <StatusClient initial={initial} />;
}
