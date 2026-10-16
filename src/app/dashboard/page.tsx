import { PhilosophyCard } from "./philosophy-card";
import { LiveRefresh } from "@/lib/live-refresh";
import { getDashboardData } from "./_lib/dashboard-data";
import { DashboardHeader } from "./_components/DashboardHeader";
import { DashboardKpiGrid } from "./_components/DashboardKpiGrid";
import { HourlySalesChart } from "./_components/HourlySalesChart";
import { SalonCard } from "./_components/SalonCard";
import { CocinaCard } from "./_components/CocinaCard";
import { ServiceMetricsCard } from "./_components/ServiceMetricsCard";
import { InsightGastronomicoCard } from "./_components/InsightGastronomicoCard";
import { HeatmapCard } from "./_components/HeatmapCard";
import { FocusQuoteCard } from "./_components/FocusQuoteCard";
import { ReservasCard } from "./_components/ReservasCard";
import { RecentActivityFeed } from "./_components/RecentActivityFeed";
import { CierreCard } from "./_components/CierreCard";
import { AlertasCard } from "./_components/AlertasCard";
import { EquipoCard } from "./_components/EquipoCard";
import { InsightsAICard } from "./_components/InsightsAICard";
import { MaridajeCard } from "./_components/MaridajeCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowLabel(): string {
  const d = new Date();
  const date = new Intl.DateTimeFormat("es-GT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .toUpperCase()
    .replace(/\./g, "");
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return `${date} · ${time}`;
}

export default async function DashboardPage() {
  const data = await getDashboardData(todayISO());

  return (
    <div className="min-h-screen w-full bg-[#FAF5EB] font-jakarta text-[#1F1F1F]">
      <LiveRefresh intervalMs={5000} />
      <DashboardHeader
        fecha={nowLabel()}
        cuentasPendientes={data.cuentasPendientes}
      />
      <main className="flex flex-col gap-7 px-8 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_480px] gap-7">
          {/* Main Column */}
          <div className="stagger-children flex flex-col gap-6">
            <DashboardKpiGrid ventas={data.ventas} kpis={data.kpis} />
            <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
              <HourlySalesChart hourlySales={data.hourlySales} />
              <SalonCard salon={data.salon} />
            </div>
            <CocinaCard cocina={data.cocina} />
            <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
              <ServiceMetricsCard
                metrics={data.operationalMetrics}
                kpis={data.kpis}
                cocina={data.cocina}
              />
              <InsightGastronomicoCard />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
              <HeatmapCard />
              <FocusQuoteCard />
            </div>
          </div>

          {/* Side Column */}
          <aside className="stagger-children flex flex-col gap-5">
            <ReservasCard
              reservas={data.reservas}
              reservasHoy={data.reservasHoy}
            />
            <RecentActivityFeed events={data.actividad} />
            <CierreCard
              ventas={data.ventas}
              cuentasPendientes={data.cuentasPendientes}
            />
            <AlertasCard />
            <EquipoCard />
            <InsightsAICard />
          </aside>
        </div>

        <div className="stagger-children grid grid-cols-[minmax(0,1fr)_480px] gap-7">
          <PhilosophyCard />
          <MaridajeCard />
        </div>
      </main>
    </div>
  );
}
