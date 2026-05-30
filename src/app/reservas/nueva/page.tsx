import { Wizard } from "./wizard";

/**
 * `/reservas/nueva` — wizard de 5 pasos para crear una reserva.
 *
 * El wizard usa el salón real para descubrir zonas/mesas, consulta
 * reservaciones del día para calcular disponibilidad y persiste el paso
 * final en el módulo `/reservations` del backend.
 *
 * Mantenemos render dinámico para que cualquier cambio futuro al usuario
 * autenticado o a las mesas asignables se refleje sin caché.
 */
export const dynamic = "force-dynamic";

export default function NuevaReservaPage() {
  return <Wizard />;
}
