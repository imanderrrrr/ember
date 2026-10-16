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

function chairsForRect(seats: number): [number, number] {
  if (seats <= 2) return [1, 1];
  if (seats <= 4) return [2, 2];
  if (seats <= 6) return [3, 3];
  return [4, 4];
}

interface TableRectProps {
  table: SalonTable;
  decor: TableDecor;
  reservation: ReservationDTO | null;
  delay?: number;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function TableRect({
  table,
  decor,
  reservation,
  delay = 0,
  selected,
  onClick,
}: TableRectProps) {
  const { x, y, width: w, height: h } = table;
  const status = effectiveStatus(table, reservation);
  const color = STATUS_COLOR[status];
  const chairColor = status === "limpieza" ? "#EDE6DC" : "#D8CEC2";
  const [top, bottom] = chairsForRect(table.seats);

  const chairs = (count: number, atTop: boolean) => {
    const arr: { cx: number; cy: number }[] = [];
    for (let i = 0; i < count; i++) {
      const cx = ((i + 1) * w) / (count + 1);
      const cy = atTop ? -10 : h + 10;
      arr.push({ cx, cy });
    }
    return arr;
  };

  const animStyle = { animationDelay: `${delay}ms` } as React.CSSProperties;
  const sub = subLabelFor(table, decor, reservation);
  const wide = w >= 140;

  return (
    <>
      {[...chairs(top, true), ...chairs(bottom, false)].map((p, i) => (
        <div
          key={i}
          className="animate-salon-table pointer-events-none absolute"
          style={{
            ...animStyle,
            left: x + p.cx - 7,
            top: y + p.cy - 7,
            width: 14,
            height: 14,
            background: chairColor,
            borderRadius: 3,
          }}
        />
      ))}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Mesa ${table.label}`}
        aria-pressed={selected ?? false}
        className="animate-salon-table absolute flex items-center bg-white transition-shadow hover:shadow-[0_4px_12px_rgba(31,31,31,0.12)] focus:outline-none"
        style={{
          ...animStyle,
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 8,
          border: `${selected ? 2.5 : 2}px solid ${color}`,
          boxShadow: selected
            ? `0 0 0 3px ${color}33, 0 4px 14px ${color}33`
            : "0 2px 8px rgba(31,31,31,0.07)",
          cursor: "pointer",
          paddingLeft: wide ? 14 : 0,
          paddingRight: wide ? 14 : 0,
          justifyContent: wide ? "flex-start" : "center",
        }}
      >
        <span
          className="font-mono font-semibold leading-none text-[#1F1F1F]"
          style={{ fontSize: 20 }}
        >
          {table.label}
        </span>
        {wide ? (
          <div className="ml-3 flex flex-col text-left">
            <span
              className="font-mono text-[10px] font-semibold leading-tight tracking-[0.05em]"
              style={{ color }}
            >
              {table.seats}p · {status.toUpperCase()}
            </span>
            {sub && (
              <span className="font-mono text-[9px] text-[#6B6660]">
                {sub}
              </span>
            )}
          </div>
        ) : (
          sub && (
            <span
              className="mt-0.5 block font-mono text-[9px] leading-none tracking-[0.04em]"
              style={{ color }}
            >
              {sub}
            </span>
          )
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
