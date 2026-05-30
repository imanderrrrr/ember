import { auth } from "@/auth";
import { fetchFloorPlan, fetchReservations } from "@/app/salon/_lib/server-api";
import { fetchKitchenOrders } from "@/app/cocina/_lib/orders-server";
import { buildBillForTable, type Bill } from "@/app/caja/_lib/billing";
import { EmptyState } from "@/app/salon/empty-state";
import { WaiterSalon } from "./waiter-salon";

/**
 * `/mesero` — Ventana principal del mesero.
 *
 * Server Component: trae el mismo plano y reservas que `/salon`, pero lo
 * renderiza con el chrome del mesero (tabs de zona + rail "Tomar pedido").
 * El routing por rol (ver `lib/roles.ts`) aterriza aquí a los meseros.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function MeseroPage() {
  const serviceDate = todayISO();
  const [session, plan, reservations, orders] = await Promise.all([
    auth(),
    fetchFloorPlan(),
    fetchReservations({ date: serviceDate }),
    fetchKitchenOrders().catch(() => []),
  ]);

  if (plan.zones.length === 0) return <EmptyState />;

  // Factura real por mesa (órdenes de cocina reales), para que el rail muestre
  // el mismo pedido/total que cobrará la pantalla de cobro. Solo las mesas con
  // órdenes entran al mapa; el resto se muestra como "sin pedido".
  const zoneMap = new Map(plan.zones.map((z) => [z.id, z.name]));
  const billByTable: Record<string, Bill> = {};
  for (const t of plan.tables) {
    if (orders.some((o) => o.tableId === t.id)) {
      billByTable[t.id] = buildBillForTable(
        t,
        zoneMap.get(t.zoneId) ?? "Salón",
        orders,
      );
    }
  }

  const sessionUser = session?.user
    ? {
        name: session.user.name ?? "Mesero",
        role: (session.user as { role?: string }).role ?? null,
        avatarInitials:
          (session.user as { avatarInitials?: string }).avatarInitials ?? null,
      }
    : null;

  return (
    <WaiterSalon
      plan={plan}
      reservations={reservations}
      user={sessionUser}
      billByTable={billByTable}
    />
  );
}
