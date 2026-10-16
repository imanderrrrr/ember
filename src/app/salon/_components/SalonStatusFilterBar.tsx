"use client";

import React from "react";
import type { SalonTable, TableStatus } from "../_lib/types";
import { STATUS_COLOR, TABLE_STATUSES } from "../_lib/types";

interface SalonStatusFilterBarProps {
  tables: SalonTable[];
  activeFilter?: TableStatus | "todos";
  onSelectFilter?: (status: TableStatus | "todos") => void;
}

const FILTER_ITEMS: { status: TableStatus; label: string }[] = [
  { status: "ocupada", label: "Ocupadas" },
  { status: "libre", label: "Libres" },
  { status: "reservada", label: "Reservadas" },
  { status: "cocina", label: "En cocina" },
  { status: "esperando", label: "Esperando cuenta" },
  { status: "limpieza", label: "Limpieza pendiente" },
];

export function SalonStatusFilterBar({
  tables,
  activeFilter = "todos",
  onSelectFilter,
}: SalonStatusFilterBarProps) {
  const totals: Record<TableStatus, number> = {
    libre: 0,
    ocupada: 0,
    reservada: 0,
    cocina: 0,
    esperando: 0,
    limpieza: 0,
  };
  for (const t of tables) {
    if (totals[t.status] !== undefined) {
      totals[t.status] = (totals[t.status] ?? 0) + 1;
    }
  }

  return (
    <section className="flex flex-col gap-2.5 border-b border-[#EDE6DC] p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          FILTROS POR ESTADO
        </span>
        {activeFilter !== "todos" && (
          <button
            type="button"
            onClick={() => onSelectFilter?.("todos")}
            className="font-mono text-[9px] text-[#C2410C] hover:underline"
          >
            Ver todos
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        {FILTER_ITEMS.map((f) => {
          const isSelected = activeFilter === f.status;
          return (
            <button
              key={f.status}
              type="button"
              onClick={() =>
                onSelectFilter?.(isSelected ? "todos" : f.status)
              }
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors ${
                isSelected
                  ? "bg-[#EDE6DC] font-medium"
                  : "hover:bg-[#EDE6DC]/40"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: STATUS_COLOR[f.status] }}
              />
              <span className="flex-1 text-left text-[12px] text-[#1F1F1F]">
                {f.label}
              </span>
              <span className="font-mono text-[11px] text-[#6B6660]">
                {String(totals[f.status]).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
