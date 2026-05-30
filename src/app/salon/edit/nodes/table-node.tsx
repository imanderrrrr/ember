"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import type { SalonTable } from "../../_lib/types";
import { STATUS_COLOR } from "../../_lib/types";

/**
 * Renderiza una mesa en el canvas. La posición efectiva puede venir del
 * `position` override (durante drag) — esto evita un re-fetch en cada frame.
 */
export function TableNode({
  table,
  position,
  selected,
  onPointerDown,
}: {
  table: SalonTable;
  position: { x: number; y: number } | null;
  selected: boolean;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const x = position?.x ?? table.x;
  const y = position?.y ?? table.y;
  const color = STATUS_COLOR[table.status];
  const isRound = table.shape === "round";

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={onPointerDown}
      className={`absolute flex cursor-grab touch-none select-none items-center justify-center bg-white active:cursor-grabbing ${
        selected ? "ring-2 ring-[#E67E22] ring-offset-2 ring-offset-[#F7F3EE]" : ""
      }`}
      style={{
        left: x,
        top: y,
        width: table.width,
        height: table.height,
        borderRadius: isRound ? "9999px" : 8,
        border: `2px solid ${color}`,
        boxShadow: selected
          ? `0 4px 14px ${color}40`
          : "0 2px 8px rgba(31,31,31,0.07)",
      }}
    >
      <span className="font-mono text-[18px] font-semibold leading-none">
        {table.label}
      </span>
    </div>
  );
}
