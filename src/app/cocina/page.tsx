import { auth } from "@/auth";
import { KdsBoard } from "./kds-board";
import { fetchKitchenOrders } from "./_lib/orders-server";
import { ticketFromOrder, type Ticket } from "./_lib/kds-data";

/**
 * `/cocina` — KDS (Kitchen Display System).
 *
 * Server Component: trae el plano para derivar tickets reales de las mesas en
 * "cocina" (lo que el mesero envía) y los combina con los tickets demo del
 * tablero. El routing por rol (`lib/roles.ts`) aterriza aquí a la cocina.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function nowLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dateLabel(): string {
  return new Intl.DateTimeFormat("es-GT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date())
    .toUpperCase();
}

export default async function CocinaPage() {
  // auth() asegura sesión; el usuario se muestra vía UserMenu (sesión cliente).
  // El tablero se alimenta SOLO de órdenes reales (lo que el mesero envió a
  // cocina). Sin datos mock.
  const [, orders] = await Promise.all([
    auth(),
    fetchKitchenOrders(["nueva", "preparacion", "lista"]),
  ]);
  const tickets: Ticket[] = orders.map((o) => ticketFromOrder(o));

  return (
    <KdsBoard
      initialTickets={tickets}
      dateLabel={dateLabel()}
      timeLabel={nowLabel()}
    />
  );
}
