"use client";

import { Check, Star, Users } from "lucide-react";
import type { ZoneTable } from "../_lib/types";
import { chairPositionsRect, chairPositionsRound } from "./ChairPositions";

export interface PlanTable extends ZoneTable {
  label: string;
  delay: number;
}

interface PlanTableNodeProps {
  table: PlanTable;
  selectedId: string;
  recommendedId: string;
  onSelect: (id: string) => void;
}

export function PlanTableNode({
  table,
  selectedId,
  recommendedId,
  onSelect,
}: PlanTableNodeProps) {
  const reserved = !!table.reservedBy;
  const isSelected = table.label === selectedId;
  const isRecommended = table.label === recommendedId && !reserved;
  const isRound = table.shape === "round";
  const accent = isSelected;

  const chairs = isRound
    ? chairPositionsRound(
        table.x + table.w / 2,
        table.y + table.h / 2,
        Math.min(table.w, table.h),
        table.seats,
      )
    : chairPositionsRect(table.x, table.y, table.w, table.h, table.seats);
  const chairSize = isRound ? 14 : 12;
  const chairColor = reserved ? "#ede6dc" : "#D8CEC2";

  return (
    <>
      {chairs.map((c, i) => (
        <span
          key={i}
          className="animate-r3-table pointer-events-none absolute"
          style={{
            left: c.x,
            top: c.y,
            width: chairSize,
            height: chairSize,
            background: chairColor,
            borderRadius: isRound ? "9999px" : "3px",
            animationDelay: `${table.delay + 30}ms`,
          }}
        />
      ))}

      <button
        type="button"
        onClick={() => !reserved && onSelect(table.label)}
        disabled={reserved}
        className="animate-r3-table absolute flex flex-col items-center justify-center bg-white transition-shadow"
        style={{
          left: table.x,
          top: table.y,
          width: table.w,
          height: table.h,
          borderRadius: isRound ? 9999 : 8,
          background: accent ? "#fbe7d6" : reserved ? "#ede6dc" : "#FFFFFF",
          border: accent
            ? "2px solid #e67e22"
            : `1px solid ${reserved ? "#ede6dc" : "#7c8a6a"}`,
          opacity: reserved ? 0.75 : 1,
          gap: 2,
          cursor: reserved ? "default" : "pointer",
          animationDelay: `${table.delay}ms`,
          boxShadow: accent ? "0 0 0 4px rgba(230,126,34,0.10)" : undefined,
        }}
      >
        <span
          className="text-[#1f1f1f]"
          style={{
            fontFamily: "Geist, system-ui, sans-serif",
            fontSize: accent ? 16 : table.fontSize ?? 13,
            fontWeight: accent ? 700 : 600,
            color: reserved ? "#6b4f3a" : "#1f1f1f",
          }}
        >
          {table.label}
        </span>
        {table.seatsLabel && (
          <span
            className="font-sans text-[8px] font-semibold"
            style={{
              letterSpacing: "1.2px",
              color: accent ? "#e67e22" : "#6b4f3a",
            }}
          >
            {table.seatsLabel}
          </span>
        )}
        {reserved && !table.seatsLabel && (
          <Users className="size-2.5 text-[#6b4f3a]" strokeWidth={1.8} />
        )}
      </button>

      {isRecommended && (
        <Star
          className="animate-r3-pop pointer-events-none absolute size-3.5 text-[#d8a641]"
          strokeWidth={2}
          fill="#d8a641"
          style={{
            left: table.x + 4,
            top: table.y + 4,
            animationDelay: `${table.delay + 80}ms`,
          }}
        />
      )}

      {isSelected && (
        <span
          className="animate-r3-pop absolute flex size-[18px] items-center justify-center rounded-full bg-[#e67e22]"
          style={{
            left: table.x + table.w - 14,
            top: table.y - 9,
            animationDelay: `${table.delay + 120}ms`,
          }}
        >
          <Check className="size-2.5 text-white" strokeWidth={3} />
        </span>
      )}

      {isRecommended && (
        <span
          className="animate-r3-pop absolute flex items-center gap-1 rounded-full bg-[#e67e22] px-2 py-1"
          style={{
            left: table.x + table.w / 2 - 50,
            top: table.y + table.h + 6,
            animationDelay: `${table.delay + 200}ms`,
            whiteSpace: "nowrap",
          }}
        >
          <Star className="size-2.5 text-white" strokeWidth={2.4} fill="white" />
          <span className="text-[10px] font-semibold text-white">
            Recomendada
          </span>
        </span>
      )}

      {reserved && (
        <span
          className="pointer-events-none absolute"
          style={{
            left: table.x + 4,
            top: table.y + 4,
            width: table.w - 8,
            height: table.h - 8,
          }}
        >
          <svg
            viewBox={`0 0 ${table.w - 8} ${table.h - 8}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            <line
              x1={0}
              y1={0}
              x2={table.w - 8}
              y2={table.h - 8}
              stroke="#6b4f3a"
              strokeWidth={1}
            />
          </svg>
        </span>
      )}

      {table.reservedBy && (
        <span
          className="animate-r3-up pointer-events-none absolute text-[9px] font-medium text-[#6b4f3a]"
          style={{
            left: table.x - 16,
            top: table.y + table.h + 4,
            width: table.w + 32,
            textAlign: "center",
            animationDelay: `${table.delay + 80}ms`,
          }}
        >
          {table.reservedBy}
        </span>
      )}
    </>
  );
}
