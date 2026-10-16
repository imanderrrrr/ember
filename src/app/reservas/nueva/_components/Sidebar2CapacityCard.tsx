"use client";

import React from "react";
import { Square } from "lucide-react";
import type { ZoneDef } from "../_lib/types";

interface Sidebar2CapacityCardProps {
  zone: ZoneDef;
  free: number;
  occupancyPct: number;
}

export function Sidebar2CapacityCard({
  zone,
  free,
  occupancyPct,
}: Sidebar2CapacityCardProps) {
  return (
    <div
      key={`${zone.key}-${occupancyPct}`}
      className="animate-r2-up flex flex-col gap-2.5 rounded-xl bg-[#fbe7d6] p-3.5"
      style={{
        border: "1.5px solid #e67e22",
        animationDelay: "500ms",
      }}
    >
      <div className="flex items-center gap-2.5">
        <Square className="size-3.5 text-[#7a2e14]" strokeWidth={1.8} />
        <span
          className="font-mono text-[10px] font-bold text-[#7a2e14]"
          style={{ letterSpacing: "1.4px" }}
        >
          CAPACIDAD · {zone.shortName.toUpperCase()}
        </span>
        <span className="flex-1" />
        <span
          className="font-mono text-[10px] font-bold text-[#7a2e14]"
          style={{ letterSpacing: "0.8px" }}
        >
          En curso
        </span>
      </div>
      <span
        className="font-mono text-[18px] font-bold text-[#1f1f1f]"
        style={{ letterSpacing: "-0.2px" }}
      >
        {occupancyPct}% ocupación de {zone.shortName.toLowerCase()}
      </span>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-[#e8b07f] bg-white">
        <span
          className="animate-r2-progress absolute left-0 top-0 block h-full rounded-full bg-[#e67e22]"
          style={
            {
              animationDelay: "300ms",
              ["--r2-progress-target" as string]: `${occupancyPct}%`,
            } as React.CSSProperties
          }
        />
      </div>
      <span className="text-[12px] text-[#6b4f3a]">
        {free} / {zone.total} mesas libres ·{" "}
        {zone.disabled ? "Sector cerrado" : "Sin conflictos"}
      </span>
    </div>
  );
}
