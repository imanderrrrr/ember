"use client";

import React from "react";
import Link from "next/link";
import { Layers, LayoutDashboard, List, Users } from "lucide-react";
import type { SalonTable, Zone } from "../_lib/types";

interface SalonZoneTabsProps {
  zone: Zone | null;
  allZones?: Zone[];
  tables: SalonTable[];
  view: "plano" | "lista";
  onChangeView: (view: "plano" | "lista") => void;
  onSelectZone?: (zoneId: string) => void;
}

export function SalonZoneTabs({
  zone,
  allZones = [],
  tables,
  view,
  onChangeView,
  onSelectZone,
}: SalonZoneTabsProps) {
  const totalSeats = tables.reduce((acc, t) => acc + t.seats, 0);
  const occupiedSeats = tables
    .filter(
      (t) =>
        t.status === "ocupada" ||
        t.status === "cocina" ||
        t.status === "esperando",
    )
    .reduce((acc, t) => acc + t.seats, 0);

  return (
    <div className="flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-[#F7F3EE] px-7">
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[15px] font-semibold">
            {zone?.name ?? "Sin zona"}
          </span>
          <span className="text-[13px] text-[#6B6660]">
            · {tables.length} mesas
          </span>
        </div>
        <span className="h-6 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2 rounded-full border border-[#EDE6DC] bg-white px-3 py-1.5">
          <span className="block size-1.5 rounded-full bg-[#7C8A6A]" />
          <span className="text-[11px]">En vivo · sincronizado hace 2s</span>
        </div>

        {/* Quick zone navigation chips */}
        {allZones.length > 1 && (
          <>
            <span className="h-6 w-px bg-[#EDE6DC]" />
            <div className="flex items-center gap-1.5">
              {allZones.map((z) => {
                const isActive = z.id === zone?.id;
                return (
                  <Link
                    key={z.id}
                    href={`/salon?zone=${z.id}`}
                    onClick={(e) => {
                      if (onSelectZone) {
                        e.preventDefault();
                        onSelectZone(z.id);
                      }
                    }}
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
                      isActive
                        ? "bg-[#1F1F1F] text-[#FAF5EB]"
                        : "border border-[#EDE6DC] bg-white text-[#6B4F3A] hover:bg-[#FAF5EB]"
                    }`}
                  >
                    {z.name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-2">
          <Users className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#6B6660]">Aforo</span>
          <span className="font-mono text-[13px] font-semibold">
            {occupiedSeats} / {totalSeats}
          </span>
        </div>
        <div
          className="flex items-center gap-0.5 rounded-lg border border-[#EDE6DC] bg-white p-[3px]"
          role="tablist"
          aria-label="Vista del salón"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "plano"}
            onClick={() => onChangeView("plano")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              view === "plano"
                ? "bg-[#1F1F1F] text-[#FAF5EB]"
                : "text-[#6B4F3A] hover:bg-[#F7F3EE]"
            }`}
          >
            <LayoutDashboard className="size-3" strokeWidth={2} />
            Plano
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "lista"}
            onClick={() => onChangeView("lista")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              view === "lista"
                ? "bg-[#1F1F1F] text-[#FAF5EB]"
                : "text-[#6B4F3A] hover:bg-[#F7F3EE]"
            }`}
          >
            <List className="size-3" strokeWidth={2} />
            Lista
          </button>
        </div>
      </div>
    </div>
  );
}
