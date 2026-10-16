"use client";

import React from "react";
import { Moon } from "lucide-react";
import type { SalonTable, TableStatus, Zone } from "../_lib/types";
import { ZonesPanel } from "../zones-panel";
import { SalonStatusFilterBar } from "./SalonStatusFilterBar";

interface SalonLeftSidebarProps {
  zones: Zone[];
  tables: SalonTable[];
  activeZoneId: string | null;
  activeFilter?: TableStatus | "todos";
  onSelectFilter?: (status: TableStatus | "todos") => void;
}

const LEGEND = [
  { color: "#7c8a6a", label: "Libre" },
  { color: "#C95A3D", label: "Ocupada" },
  { color: "#D8A641", label: "Reservada" },
  { color: "#4E7DA6", label: "En cocina" },
  { color: "#7D5BA6", label: "Esp. cuenta" },
  { color: "#a89d8e", label: "Limpieza" },
];

export function SalonLeftSidebar({
  zones,
  tables,
  activeZoneId,
  activeFilter = "todos",
  onSelectFilter,
}: SalonLeftSidebarProps) {
  return (
    <aside className="animate-salon-sidebar stagger-children flex w-[286px] flex-col border-r border-[#EDE6DC] bg-[#F7F3EE]">
      {/* Brand Block */}
      <div className="flex items-center gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <span className="block size-9 rounded-full bg-[#E67E22]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold leading-tight">
            Casa Olivar
          </span>
          <span className="text-[11px] text-[#6B6660]">Gestión de salón</span>
        </div>
      </div>

      {/* Zonas */}
      <ZonesPanel zones={zones} tables={tables} activeZoneId={activeZoneId} />

      {/* Filtros por estado */}
      <SalonStatusFilterBar
        tables={tables}
        activeFilter={activeFilter}
        onSelectFilter={onSelectFilter}
      />

      {/* Leyenda */}
      <section className="flex flex-col gap-3 border-b border-[#EDE6DC] p-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          LEYENDA
        </span>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span
                className="block size-2.5 rounded-sm"
                style={{ background: l.color }}
              />
              <span className="text-[11px]">{l.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />

      {/* Turno bottom */}
      <div className="flex items-center gap-2 px-6 pb-5 pt-4">
        <Moon className="size-3 text-[#7C8A6A]" strokeWidth={2} />
        <span className="font-mono text-[10px] text-[#6B6660]">
          Turno Cena · 18:30—23:00
        </span>
      </div>
    </aside>
  );
}
