import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchFloorPlan } from "@/app/salon/_lib/server-api";
import { fetchKitchenOrders } from "@/app/cocina/_lib/orders-server";
import { buildBillForTable } from "@/app/caja/_lib/billing";
import { CajaScreen } from "@/app/caja/caja-screen";

/**
 * `/mesero/mesa/[tableId]/cobrar` — Cobro de cuenta desde el perfil del mesero.
 *
 * El mesero toca una mesa en estado "esperando" en su mapa y pulsa "Cobrar".
 * Reusamos la misma pantalla de Caja (diseño "Caja - Cobro de cuenta") con la
 * mesa preseleccionada y los enlaces de vuelta apuntando a `/mesero`.
 *
 * Datos reales: la factura se arma con las órdenes de cocina reales de la mesa
 * (ver `buildBillForTable`), nunca con datos mock.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Roles que pueden cobrar. Añadimos "mesero" al set de caja para este flujo.
const ALLOWED = ["mesero", "gerente_operativo", "cajero", "chef", "admin"];

export default async function MeseroCobrarPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string })?.role ?? null;
  if (!ALLOWED.includes(role ?? "")) redirect("/dashboard");

  const [plan, orders] = await Promise.all([
    fetchFloorPlan().catch(() => ({ zones: [], tables: [], shapes: [] })),
    fetchKitchenOrders().catch(() => []),
  ]);

  // La mesa pedida debe existir y estar esperando cuenta; si no, al mapa.
  const target = plan.tables.find((t) => t.id === tableId);
  if (!target || target.status !== "esperando") redirect("/mesero");

  const zoneMap = new Map(plan.zones.map((z) => [z.id, z.name]));

  // Todas las mesas en cobro (para la vista general del panel derecho), con la
  // tocada por el mesero preseleccionada.
  const bills = plan.tables
    .filter((t) => t.status === "esperando")
    .map((table) =>
      buildBillForTable(table, zoneMap.get(table.zoneId) ?? "Salón", orders),
    );

  const user = session?.user
    ? {
        name: session.user.name ?? "Mesero",
        role: role ?? null,
        avatarInitials:
          (session.user as { avatarInitials?: string }).avatarInitials ?? null,
      }
    : null;

  return (
    <CajaScreen
      bills={bills}
      totalTables={plan.tables.length}
      user={user}
      initialTableId={tableId}
      backHref="/mesero"
      backLabel="Volver al salón"
      homeHref="/mesero"
      showStaffLinks={false}
      showTableSelector={false}
    />
  );
}
