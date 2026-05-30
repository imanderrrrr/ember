import { auth } from "@/auth";
import { RestaurantManager } from "./restaurant-manager";
import { SkeletonLoading } from "./skeleton-loading";
import { EmptyState } from "./empty-state";
import { PartiallyConfigured } from "./partially-configured";
import { fetchFloorPlan, fetchReservations } from "./_lib/server-api";
import { fetchKitchenOrders } from "@/app/cocina/_lib/orders-server";
import { buildBillForTable, type Bill } from "@/app/caja/_lib/billing";

/**
 * Forzamos render dinámico: el plano puede cambiar en cualquier momento
 * desde el editor, y queremos que cada visita a /salon traiga el estado
 * fresco. Combinado con `router.refresh()` desde el editor, esto invalida
 * el router cache del cliente al volver.
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

/**
 * `/salon` — Salón en vivo.
 *
 * Server Component: fetches el plano del backend y elige cuál de las cuatro
 * variantes renderizar.
 *
 *   - `?state=skeleton`  → versión esqueleto (UI loading)
 *   - `?state=empty`     → estado vacío (placeholder de configuración)
 *   - `?state=partial`   → distribución parcialmente configurada
 *   - sin param + 0 zones → empty state automáticamente
 *   - default            → RestaurantManager con datos reales
 */
export default async function SalonPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; zone?: string }>;
}) {
  const { state, zone } = await searchParams;

  // Estados explícitos (para QA/diseño). No tocan el backend.
  if (state === "skeleton") return <SkeletonLoading />;
  if (state === "empty") return <EmptyState />;
  if (state === "partial") return <PartiallyConfigured />;

  const serviceDate = todayISO();
  const [session, plan, reservations, orders] = await Promise.all([
    auth(),
    fetchFloorPlan(),
    fetchReservations({ date: serviceDate }),
    fetchKitchenOrders().catch(() => []),
  ]);
  if (plan.zones.length === 0) return <EmptyState />;

  // Pedido real por mesa (órdenes de cocina). Solo las mesas con órdenes
  // entran al mapa; una mesa libre / sin pedido no aparece aquí, así que su
  // ficha no mostrará "Pedido actual".
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

  // Zona activa = `?zone=<id>` si existe y es válida, sino la primera del plan.
  // Sirve para que el sidebar pueda cambiar de zona vía router.push().
  const activeZoneId =
    plan.zones.find((z) => z.id === zone)?.id ?? plan.zones[0].id;

  // Usuario real de la sesión — alimenta el TopBar (antes hardcodeado).
  const sessionUser = session?.user
    ? {
        name: session.user.name ?? "Usuario",
        role: (session.user as { role?: string }).role ?? null,
        avatarInitials:
          (session.user as { avatarInitials?: string }).avatarInitials ?? null,
      }
    : null;

  return (
    <RestaurantManager
      plan={plan}
      activeZoneId={activeZoneId}
      reservations={reservations}
      serviceDate={serviceDate}
      user={sessionUser}
      billByTable={billByTable}
    />
  );
}
