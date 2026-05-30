import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchFloorPlan } from "@/app/salon/_lib/server-api";
import { fetchCierre } from "../_lib/cierre-server";
import { CierreScreen } from "./cierre-screen";

/**
 * `/caja/cierre` — Cierre de caja del turno.
 *
 * Muestra el cuadre real del turno (ventas, desglose por método, efectivo
 * esperado vs contado) y permite cerrar caja. Solo gerente/cajero/chef/admin.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = ["gerente_operativo", "cajero", "chef", "admin"];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function nowLabel(): string {
  const d = new Date();
  const date = new Intl.DateTimeFormat("es-GT", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  })
    .format(d)
    .replace(/\./g, "");
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return `${date} · ${time}`;
}

export default async function CierreCajaPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role ?? null;
  if (!ALLOWED.includes(role ?? "")) redirect("/dashboard");

  const serviceDate = todayISO();
  const [cierre, plan] = await Promise.all([
    fetchCierre(serviceDate),
    fetchFloorPlan().catch(() => ({ zones: [], tables: [], shapes: [] })),
  ]);

  const cuentasPendientes = plan.tables.filter(
    (t) => t.status === "esperando",
  ).length;

  const user = session?.user
    ? {
        name: session.user.name ?? "Cajero",
        role: role ?? null,
      }
    : null;

  return (
    <CierreScreen
      cierre={cierre}
      cuentasPendientes={cuentasPendientes}
      cashierName={user?.name ?? "Cajero"}
      dateLabel={nowLabel()}
    />
  );
}
