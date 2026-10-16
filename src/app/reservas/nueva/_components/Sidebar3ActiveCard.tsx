"use client";

import { Star } from "lucide-react";
import type { ZoneDef } from "../_lib/types";

interface Sidebar3ActiveCardProps {
  zone: ZoneDef;
  tableId: string;
  partySize: number;
  isRecommended: boolean;
}

export function Sidebar3ActiveCard({
  zone,
  tableId,
  partySize,
  isRecommended,
}: Sidebar3ActiveCardProps) {
  return (
    <div
      className="animate-r3-up flex flex-col gap-2.5 rounded-xl bg-[#fbe7d6] p-3.5"
      style={{
        border: "1.5px solid #e67e22",
        animationDelay: "500ms",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center rounded-full bg-[#e67e22]">
            <span className="block size-1.5 rounded-full bg-white" />
          </span>
          <span
            className="font-mono text-[10px] font-bold text-[#7a2e14]"
            style={{ letterSpacing: "1.4px" }}
          >
            PASO 3 · MESA Y ZONA
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#e67e22] px-2 py-0.5">
          <span className="block size-1.5 rounded-full bg-white" />
          <span className="text-[10px] font-semibold text-white">
            Editando ahora
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="#7a2e14"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx={12} cy={10} r={3} />
        </svg>
        <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
          {zone.name} · Mesa {tableId}
        </span>
      </div>
      <span className="text-[11px] text-[#6b4f3a]">
        Para {partySize} {partySize === 1 ? "persona" : "personas"} · Aforo total{" "}
        {zone.totalSeats}
      </span>
      {isRecommended && (
        <div className="flex">
          <span className="flex items-center gap-1 rounded-full bg-[#e67e22] px-2 py-1">
            <Star className="size-2.5 text-white" strokeWidth={2.4} fill="white" />
            <span className="text-[10px] font-semibold text-white">
              Recomendada
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
