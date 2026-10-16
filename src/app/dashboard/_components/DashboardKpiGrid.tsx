import React from "react";
import { CalendarCheck, Flame, LayoutGrid, TrendingUp, Users } from "lucide-react";
import { ShiftGoalControl } from "../shift-goal-control";
import type { DashboardKpis, DashboardVentas } from "../_lib/dashboard-data";

interface DashboardKpiGridProps {
  ventas: DashboardVentas;
  kpis: DashboardKpis;
}

export function DashboardKpiGrid({ ventas, kpis }: DashboardKpiGridProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* VENTAS DEL TURNO + OBJETIVO */}
      <section className="flex items-center justify-between gap-8 rounded-[18px] bg-[#1F1F1F] p-8 shadow-[0_8px_24px_rgba(31,31,31,0.1)]">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#A89D8E]">
              VENTAS DEL TURNO
            </span>
            <span className="size-1 rounded-full bg-[#E67E22]" />
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#E67E22]">
              EN VIVO
            </span>
          </div>
          <div className="flex items-end gap-3.5">
            <span className="font-jakarta text-[54px] font-bold leading-none tracking-[-0.015em] text-[#FAF5EB]">
              {ventas.totalLabel}
            </span>
            <span className="pb-2.5 font-mono text-[11px] tracking-[0.14em] text-[#A89D8E]">
              GTQ
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A8C18B33] px-2.5 py-1">
              <TrendingUp className="size-3 text-[#A8C18B]" strokeWidth={2.5} />
              <span className="font-mono text-[11px] font-bold tracking-[0.03em] text-[#A8C18B]">
                {ventas.count}
              </span>
            </span>
            <span className="font-jakarta text-[12px] text-[#A89D8E]">
              {ventas.count === 1 ? "cobro registrado" : "cobros registrados"} en el turno
            </span>
          </div>
        </div>

        <ShiftGoalControl
          ventasQ={ventas.totalQ}
          goalQ={ventas.goalQ}
          serviceDate={ventas.serviceDate}
        />
      </section>

      {/* KPI STRIP */}
      <div className="stagger-children grid grid-cols-4 gap-4">
        <KpiCard
          icon={<LayoutGrid className="size-[13px]" strokeWidth={2} />}
          label="MESAS ACTIVAS"
          value={`${kpis.mesasActivas} / ${kpis.mesasTotal}`}
          foot={`${kpis.ocupadoPct}% del salón ocupado`}
        />
        <KpiCard
          icon={<CalendarCheck className="size-[13px]" strokeWidth={2} />}
          label="RESERVAS HOY"
          value={String(kpis.reservasHoy)}
          foot={
            kpis.reservasProximas > 0
              ? `${kpis.reservasProximas} próximas en la siguiente hora`
              : "Sin reservas en la próxima hora"
          }
        />
        <KpiCard
          icon={<Flame className="size-[13px]" strokeWidth={2} />}
          label="PEDIDOS COCINA"
          value={String(kpis.pedidosCocina)}
          foot={kpis.pedidosBreakdown}
          accent
        />
        <KpiCard
          icon={<Users className="size-[13px]" strokeWidth={2} />}
          label="AFORO ACTUAL"
          value={`${kpis.aforoPct}%`}
          foot={`${kpis.comensales} / ${kpis.aforoTotal} comensales`}
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  foot,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[14px] border p-5 ${
        accent ? "border-[#E8B07F] bg-[#FBE7D6]" : "border-[#EDE6DC] bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          accent ? "text-[#C2410C]" : "text-[#6B4F3A]"
        }`}
      >
        {icon}
        <span className="font-mono text-[10px] font-bold tracking-[0.14em]">
          {label}
        </span>
      </div>
      <span
        className={`font-jakarta text-[34px] font-bold leading-none tracking-[-0.015em] ${
          accent ? "text-[#C2410C]" : "text-[#1F1F1F]"
        }`}
      >
        {value}
      </span>
      <span
        className={`font-jakarta text-[11px] ${
          accent ? "font-medium text-[#C2410C]" : "text-[#6B4F3A]"
        }`}
      >
        {foot}
      </span>
    </div>
  );
}
