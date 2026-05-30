import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchFloorPlan } from "@/app/salon/_lib/server-api";
import { MesaActiva } from "./mesa-activa";

/**
 * `/mesero/mesa/[tableId]` — Mesa activa (toma de pedido a pantalla completa).
 *
 * El mesero llega aquí al tocar "Tomar pedido" en su mapa (`/mesero`). Trae
 * la mesa real del plano y la zona a la que pertenece; el menú y la comanda
 * viven en el cliente (reusan el catálogo del OrderModal) hasta que exista el
 * módulo de órdenes en el backend.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayLabel(): string {
  const d = new Date();
  return new Intl.DateTimeFormat("es-GT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function nowLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function MesaActivaPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const [session, plan] = await Promise.all([auth(), fetchFloorPlan()]);

  const table = plan.tables.find((t) => t.id === tableId) ?? null;
  if (!table) redirect("/mesero");

  const zoneName =
    plan.zones.find((z) => z.id === table.zoneId)?.name ?? "Salón";

  const waiter = session?.user
    ? {
        name: session.user.name ?? "Mesero",
        avatarInitials:
          (session.user as { avatarInitials?: string }).avatarInitials ?? null,
      }
    : null;

  return (
    <MesaActiva
      table={table}
      zoneName={zoneName}
      waiter={waiter}
      dateLabel={todayLabel()}
      timeLabel={nowLabel()}
    />
  );
}
