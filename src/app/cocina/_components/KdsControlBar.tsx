"use client";

import { ArrowDownUp, ChevronDown } from "lucide-react";
import { STATION_TABS, type Station } from "../_lib/kds-data";

export function KdsControlBar({
  activeStation,
  onStation,
  avgDelay,
  criticas,
}: {
  activeStation: Station | "todos";
  onStation: (s: Station | "todos") => void;
  avgDelay: string;
  criticas: number;
}) {
  return (
    <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-10">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[9px] font-semibold tracking-[0.15em] text-[#A89D8E]">
          ESTACIÓN
        </span>
        <div className="flex items-center gap-1 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] p-1">
          {STATION_TABS.map((tab) => {
            const active = tab.key === activeStation;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStation(tab.key)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-[#1F1F1F] text-[#FAF5EB]"
                    : "text-[#6B4F3A] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#A89D8E]">
            DEMORA PROM.
          </span>
          <div className="flex items-end gap-1">
            <span className="text-[18px] font-bold leading-none">{avgDelay}</span>
            <span className="text-[11px] font-medium text-[#A89D8E]">min</span>
          </div>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#c2410c]">
            CRÍTICAS
          </span>
          <div className="flex items-end gap-1">
            <span className="text-[18px] font-bold leading-none text-[#C2410C]">
              {criticas}
            </span>
            <span className="text-[11px] font-medium text-[#c2410c]">órdenes</span>
          </div>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[10px] border border-[#EDE6DC] bg-white px-3 py-2 transition-colors hover:bg-[#F7F3EE]"
        >
          <ArrowDownUp className="size-[13px] text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] font-semibold">Tiempo de ingreso</span>
          <ChevronDown className="size-3 text-[#A89D8E]" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
