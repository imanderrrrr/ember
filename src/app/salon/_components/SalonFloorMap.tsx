"use client";

import React from "react";
import Link from "next/link";
import { Minus, Move, Plus } from "lucide-react";
import type { SalonTable, Shape } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { SalonTableItem } from "./SalonTableItem";
import { SalonLiveShapes } from "./SalonLiveShapes";
import { nextReservationForTable, TABLE_DECOR } from "../_lib/table-utils";

interface SalonFloorMapProps {
  tables: SalonTable[];
  shapes: Shape[];
  reservations: ReservationDTO[];
  zoneNameById: Map<string, string>;
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function SalonFloorMap({
  tables,
  shapes,
  reservations,
  zoneNameById,
  selectedTableId,
  onSelectTable,
  zoom = 100,
  onZoomIn,
  onZoomOut,
}: SalonFloorMapProps) {
  return (
    <div
      className="relative h-[900px] w-[920px] overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#F7F3EE]"
      onClick={() => onSelectTable(null)}
    >
      {/* Grid lines */}
      {[120, 240, 360, 480, 600, 720, 840].map((x) => (
        <div
          key={`v${x}`}
          className="absolute top-0 h-[920px] w-px bg-[#EDE6DC] opacity-50"
          style={{ left: x }}
        />
      ))}
      {[120, 240, 360, 480, 600, 720, 840].map((y) => (
        <div
          key={`h${y}`}
          className="absolute left-0 h-px w-[920px] bg-[#EDE6DC] opacity-50"
          style={{ top: y }}
        />
      ))}

      {/* Walls */}
      <div className="absolute left-0 top-0 h-[3px] w-[920px] bg-[#6B4F3A]" />
      <div className="absolute bottom-[3px] left-0 h-[3px] w-[920px] bg-[#6B4F3A]" />
      <div className="absolute left-0 top-0 h-[900px] w-[3px] bg-[#6B4F3A]" />
      <div className="absolute right-0 top-0 h-[900px] w-[3px] bg-[#6B4F3A]" />

      {/* Window strips */}
      <div className="absolute top-0 h-[3px] w-[200px] bg-[#7C8A6A]" style={{ left: 60 }} />
      <div className="absolute top-0 h-[3px] w-[200px] bg-[#7C8A6A]" style={{ left: 320 }} />
      <div className="absolute top-0 h-[3px] w-[200px] bg-[#7C8A6A]" style={{ left: 580 }} />
      <span
        className="absolute font-mono text-[9px] tracking-[0.16em] text-[#7C8A6A]"
        style={{ left: 60, top: 14 }}
      >
        VENTANAL · TERRAZA
      </span>

      {/* Zone labels */}
      <span
        className="absolute font-mono text-[9px] tracking-[0.18em] text-[#a89d8e] opacity-70"
        style={{ left: 24, top: 42 }}
      >
        ZONA VENTANAL
      </span>
      <span
        className="absolute font-mono text-[9px] tracking-[0.18em] text-[#a89d8e] opacity-70"
        style={{ left: 430, top: 42 }}
      >
        ZONA INTERIOR
      </span>

      {/* Decorative shapes */}
      {shapes.map((s) => (
        <SalonLiveShapes key={s.id} shape={s} />
      ))}

      {/* Tables */}
      {tables.map((t, i) => {
        const delay = 460 + i * 40;
        const selected = t.id === selectedTableId;
        const decor = TABLE_DECOR[t.label] ?? {};
        const reservation = nextReservationForTable(
          reservations,
          t,
          zoneNameById.get(t.zoneId),
        );
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onSelectTable(selected ? null : t.id);
        };
        return (
          <SalonTableItem
            key={t.id}
            table={t}
            decor={decor}
            reservation={reservation}
            delay={delay}
            selected={selected}
            onClick={handleClick}
          />
        );
      })}

      {/* Empty zone hint */}
      {tables.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-lg border border-[#EDE6DC] bg-white/80 px-4 py-2 text-[12px] text-[#6B6660]">
            Esta zona aún no tiene mesas.{" "}
            <Link href="/salon/edit" className="font-medium text-[#C2410C]">
              Configurar
            </Link>
          </span>
        </div>
      )}

      {/* Edit Hint */}
      <Link
        href="/salon/edit"
        className="absolute flex h-9 items-center gap-2.5 rounded-full border border-[#EDE6DC] bg-white pl-3.5 pr-[18px] shadow-[0_2px_8px_rgba(31,31,31,0.07)] hover:bg-[#F7F3EE]"
        style={{ left: 170, top: 772, width: 280 }}
      >
        <Move className="size-[13px] text-[#E67E22]" strokeWidth={2} />
        <span className="text-[11px]">Activa modo edición para mover mesas</span>
        <span className="ml-auto rounded bg-[#f7f3ee] px-1.5 py-0.5 font-mono text-[9px] font-semibold">
          E
        </span>
      </Link>

      {/* Zoom Controls */}
      <div
        className="absolute flex flex-col items-center rounded-lg border border-[#EDE6DC] bg-white shadow-[0_4px_12px_rgba(31,31,31,0.09)]"
        style={{ left: 854, top: 736, width: 36, height: 130 }}
      >
        <button
          type="button"
          aria-label="Acercar plano"
          onClick={onZoomIn}
          className="flex flex-1 items-center justify-center text-[#1F1F1F] hover:bg-[#F7F3EE]"
        >
          <Plus className="size-3.5" strokeWidth={2} />
        </button>
        <div className="h-px w-6 bg-[#EDE6DC]" />
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-[10px] font-semibold">{zoom}</span>
        </div>
        <div className="h-px w-6 bg-[#EDE6DC]" />
        <button
          type="button"
          aria-label="Alejar plano"
          onClick={onZoomOut}
          className="flex flex-1 items-center justify-center text-[#1F1F1F] hover:bg-[#F7F3EE]"
        >
          <Minus className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
