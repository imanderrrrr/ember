import React from "react";
import { Clock } from "lucide-react";
import type { HourlySalesData } from "../_lib/sales-server";

interface HourlySalesChartProps {
  hourlySales: HourlySalesData;
}

export function HourlySalesChart({ hourlySales }: HourlySalesChartProps) {
  const hasData = hourlySales.items.length > 0;
  const maxCents = hasData
    ? Math.max(...hourlySales.items.map((it) => it.totalCents), 1)
    : 1;

  const totalFormatted = "Q" + hourlySales.totalQ.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section className="flex flex-col gap-5 rounded-[16px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
            VENTAS POR HORA
          </span>
          <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
            Distribución del servicio
          </h3>
        </div>
        {hourlySales.peakHourLabel ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
            <span className="size-1.5 rounded-full bg-[#C2410C]" />
            <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#6B4F3A]">
              PICO {hourlySales.peakHourLabel}
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
            <span className="size-1.5 rounded-full bg-[#A89D8E]" />
            <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#A89D8E]">
              Sin actividad en este horario
            </span>
          </span>
        )}
      </div>

      {hasData ? (
        <>
          <div className="flex h-[200px] items-end gap-3.5">
            {hourlySales.items.map((b) => {
              const isPeak = b.hour === hourlySales.peakHour;
              const heightPct = Math.max(12, Math.round((b.totalCents / maxCents) * 180));
              const bg = isPeak
                ? "#1F1F1F"
                : "linear-gradient(180deg, #E67E22 0%, #C2410C 100%)";

              return (
                <div
                  key={b.hour}
                  className="group relative flex-1"
                  style={{ height: `${heightPct}px` }}
                >
                  <div
                    className="h-full w-full rounded-t-[6px] rounded-b-[2px] transition-transform hover:scale-y-[1.02]"
                    style={{ background: bg }}
                  />
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="whitespace-nowrap rounded bg-[#1F1F1F] px-1.5 py-0.5 font-mono text-[9px] text-[#FAF5EB]">
                      Q{b.totalQ.toFixed(0)} · {b.ticketCount}t
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between px-1">
            {hourlySales.items.map((b) => (
              <span
                key={b.hour}
                className={`font-mono text-[10px] tracking-[0.05em] ${
                  b.hour === hourlySales.peakHour
                    ? "font-bold text-[#1F1F1F]"
                    : "text-[#A89D8E]"
                }`}
              >
                {b.formattedHour}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#EDE6DC] bg-[#FAF5EB]/50 text-center">
          <Clock className="size-6 text-[#A89D8E]" strokeWidth={1.5} />
          <span className="font-jakarta text-[13px] font-medium text-[#A89D8E]">
            Sin actividad en este horario
          </span>
          <span className="font-mono text-[10px] text-[#6B4F3A]">
            Los cobros del turno se reflejarán aquí en tiempo real
          </span>
        </div>
      )}

      <div className="flex items-center gap-5 border-t border-[#EDE6DC] pt-3.5">
        <Legend dot="bg-[#1F1F1F]" label="Pico actual" />
        <Legend dot="bg-[#C2410C]" label="Servicio en curso" />
        <span className="ml-auto font-mono text-[11px] font-semibold tracking-[0.08em] text-[#1F1F1F]">
          TOTAL DEL TURNO · {totalFormatted}
        </span>
      </div>
    </section>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`block size-2 rounded-[2px] ${dot}`} />
      <span className="font-jakarta text-[11px] text-[#6B4F3A]">{label}</span>
    </span>
  );
}
