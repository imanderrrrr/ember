"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { SalonTable } from "../_lib/types";
import { STATUS_COLOR } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import {
  effectiveStatus,
  subLabelFor,
  type TableDecor,
} from "../_lib/table-utils";

function chairLayoutRound(size: number, chairs: number) {
  if (chairs === 4) {
    return [
      { cx: size / 2, cy: -6 },
      { cx: size + 6, cy: size / 2 },
      { cx: size / 2, cy: size + 6 },
      { cx: -6, cy: size / 2 },
    ];
  }
  return [
    { cx: size * 0.27, cy: -6 },
    { cx: size * 0.77, cy: -6 },
    { cx: size + 6, cy: size / 2 },
    { cx: size * 0.77, cy: size + 6 },
    { cx: size * 0.27, cy: size + 6 },
    { cx: -6, cy: size / 2 },
  ];
}

interface TableRoundProps {
  table: SalonTable;
  decor: TableDecor;
  reservation: ReservationDTO | null;
  delay?: number;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function TableRound({
  table,
  decor,
  reservation,
  delay = 0,
  selected,
  onClick,
}: TableRoundProps) {
  const size = Math.min(table.width, table.height);
  const status = effectiveStatus(table, reservation);
  const color = STATUS_COLOR[status];
  const chairColor = status === "limpieza" ? "#EDE6DC" : "#D8CEC2";
  const positions = chairLayoutRound(size, table.seats);
  const animStyle = { animationDelay: `${delay}ms` } as React.CSSProperties;
  const sub = subLabelFor(table, decor, reservation);

  return (
    <>
      {positions.map((p, i) => (
        <div
          key={i}
          className="animate-salon-table pointer-events-none absolute rounded-full"
          style={{
            ...animStyle,
            left: table.x + p.cx - 8,
            top: table.y + p.cy - 8,
            width: 16,
            height: 16,
            background: chairColor,
          }}
        />
      ))}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Mesa ${table.label}`}
        aria-pressed={selected ?? false}
        className="animate-salon-table absolute flex flex-col items-center justify-center bg-white transition-shadow hover:shadow-[0_4px_12px_rgba(31,31,31,0.12)] focus:outline-none"
        style={{
          ...animStyle,
          left: table.x,
          top: table.y,
          width: size,
          height: size,
          borderRadius: "9999px",
          border: `${selected ? 2.5 : 2}px solid ${color}`,
          boxShadow: selected
            ? `0 0 0 3px ${color}33, 0 4px 14px ${color}33`
            : "0 2px 8px rgba(31,31,31,0.07)",
          cursor: "pointer",
        }}
      >
        <span
          className="font-mono font-semibold leading-none text-[#1F1F1F]"
          style={{ fontSize: size >= 90 ? 20 : 18 }}
        >
          {table.label}
        </span>
        {sub && (
          <span
            className="mt-0.5 font-mono leading-none tracking-[0.04em]"
            style={{ fontSize: 9, color }}
          >
            {sub}
          </span>
        )}
        {decor.star && (
          <Sparkles
            className="absolute -right-1 -top-1 size-3.5"
            strokeWidth={2}
            style={{ color: "#E67E22" }}
          />
        )}
      </button>
    </>
  );
}
