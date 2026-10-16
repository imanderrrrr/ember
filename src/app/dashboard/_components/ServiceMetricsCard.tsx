import React from "react";
import type { OperationalMetricsData } from "../_lib/sales-server";
import type { DashboardCocina, DashboardKpis } from "../_lib/dashboard-data";

interface ServiceMetricsCardProps {
  metrics: OperationalMetricsData;
  kpis: DashboardKpis;
  cocina: DashboardCocina;
}

export function ServiceMetricsCard({
  metrics,
  kpis,
  cocina,
}: ServiceMetricsCardProps) {
  const hasSales = metrics.totalTickets > 0;

  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#EDE6DC] bg-white p-6 shadow-[0_6px_18px_rgba(31,31,31,0.06)]">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
          RENDIMIENTO DEL SERVICIO
        </span>
        <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
          Métricas operativas del turno
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {/* TIEMPO PROM. DE SERVICIO */}
        <MetricCell
          label="TIEMPO PROM. SERVICIO"
          value={hasSales ? metrics.avgServiceLabel : "00:00"}
          unit={hasSales ? "min" : undefined}
          delta={
            metrics.avgServiceSeconds !== null
              ? "Apertura en cocina a cobro"
              : "Sin actividad en este horario"
          }
          deltaTone={metrics.avgServiceSeconds !== null ? "good" : undefined}
        />

        {/* TIEMPO EN COCINA */}
        <MetricCell
          label="TIEMPO EN COCINA"
          value={cocina.total > 0 ? cocina.avgLabel : "00:00"}
          unit={cocina.total > 0 ? "min" : undefined}
          delta={
            cocina.demoras > 0
              ? `${cocina.demoras} demoras activas`
              : cocina.total > 0
              ? "Pase al día"
              : "Sin comandas activas"
          }
          deltaTone={cocina.demoras > 0 ? "warn" : "good"}
        />

        {/* ROTACIÓN DE MESAS */}
        <MetricCell
          label="ROTACIÓN DE MESAS"
          value={metrics.tableTurnover > 0 ? `${metrics.tableTurnover}` : "0"}
          unit="x"
          delta={
            metrics.totalConfiguredTables > 0
              ? `${metrics.finishedSessionsCount} cuentas / ${metrics.totalConfiguredTables} mesas`
              : "Sin mesas configuradas"
          }
        />

        {/* TICKET PROMEDIO */}
        <MetricCell
          label="TICKET PROMEDIO"
          value={hasSales ? metrics.ticketAverageLabel : "Q0"}
          delta={
            hasSales
              ? `${metrics.totalTickets} ${
                  metrics.totalTickets === 1 ? "ticket cobrado" : "tickets cobrados"
                }`
              : "Sin cobros registrados"
          }
          deltaTone={hasSales ? "good" : undefined}
        />

        {/* AFORO ACTUAL */}
        <MetricCell
          label="AFORO ACTUAL"
          value={`${kpis.aforoPct}%`}
          delta={`${kpis.comensales} / ${kpis.aforoTotal} comensales`}
        />

        {/* NIVEL DE OCUPACIÓN */}
        <MetricCell
          label="NIVEL DE OCUPACIÓN"
          value={`${kpis.ocupadoPct}%`}
          delta={`${kpis.mesasActivas} de ${kpis.mesasTotal} mesas activas`}
          deltaTone={kpis.ocupadoPct > 70 ? "warn" : "good"}
          accent
        />
      </div>
    </section>
  );
}

function MetricCell({
  label,
  value,
  unit,
  delta,
  deltaTone,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  deltaTone?: "good" | "warn";
  accent?: boolean;
}) {
  const deltaColor =
    deltaTone === "good"
      ? "text-[#7C8A6A]"
      : deltaTone === "warn"
      ? "text-[#C2410C]"
      : "text-[#6B4F3A]";
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-[12px] border px-4 py-3.5 ${
        accent ? "border-[#E8B07F] bg-[#FBE7D6]" : "border-[#EDE6DC] bg-[#FAF5EB]"
      }`}
    >
      <span
        className={`font-mono text-[9px] font-bold tracking-[0.14em] ${
          accent ? "text-[#C2410C]" : "text-[#6B4F3A]"
        }`}
      >
        {label}
      </span>
      <div className="flex items-end gap-1.5">
        <span className="font-jakarta text-[28px] font-bold leading-none tracking-[-0.015em]">
          {value}
        </span>
        {unit && (
          <span className="pb-1 font-mono text-[11px] text-[#A89D8E]">
            {unit}
          </span>
        )}
      </div>
      <span className={`font-jakarta text-[11px] font-medium ${deltaColor}`}>
        {delta}
      </span>
    </div>
  );
}
