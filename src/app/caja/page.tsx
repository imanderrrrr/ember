import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchFloorPlan } from "@/app/salon/_lib/server-api";
import { fetchKitchenOrders } from "@/app/cocina/_lib/orders-server";
import { buildBillForTable } from "./_lib/billing";
import { CajaScreen } from "./caja-screen";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CajaPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role ?? null;

  // Solo gerente / cajero / chef / admin acceden
  const ALLOWED = ["gerente_operativo", "cajero", "chef", "admin"];
  if (!ALLOWED.includes(role ?? "")) redirect("/dashboard");

  const [plan, orders] = await Promise.all([
    fetchFloorPlan().catch(() => ({ zones: [], tables: [], shapes: [] })),
    fetchKitchenOrders().catch(() => []),
  ]);

  const zoneMap = new Map(plan.zones.map((z) => [z.id, z.name]));

  // Mesas esperando cuenta → factura consolidada con sus órdenes reales.
  const bills = plan.tables
    .filter((t) => t.status === "esperando")
    .map((table) =>
      buildBillForTable(table, zoneMap.get(table.zoneId) ?? "Salón", orders),
    );

  const user = session?.user
    ? {
        name: session.user.name ?? "Usuario",
        role: role ?? null,
        avatarInitials:
          (session.user as { avatarInitials?: string }).avatarInitials ??
          null,
      }
    : null;

  return (
    <CajaScreen
      bills={bills}
      totalTables={plan.tables.length}
      user={user}
    />
  );
}
