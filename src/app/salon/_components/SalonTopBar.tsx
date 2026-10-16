"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Plus } from "lucide-react";
import type { SalonTable, Zone } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { SalonSearchBox } from "./SalonSearchBox";

interface SalonTopBarProps {
  tables: SalonTable[];
  zones: Zone[];
  reservations: ReservationDTO[];
  onPickResult: (tableId: string, zoneId: string) => void;
}

export function SalonTopBar({
  tables,
  zones,
  reservations,
  onPickResult,
}: SalonTopBarProps) {
  return (
    <header className="animate-salon-topbar flex h-[72px] w-full items-center justify-between border-b border-[#EDE6DC] bg-white px-7">
      {/* Left */}
      <div className="flex items-center gap-[18px]">
        <Link
          href="/dashboard"
          className="group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[#6B4F3A] transition-colors hover:bg-[#F7F3EE]"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft
            className="size-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={1.8}
          />
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em]">
            DASHBOARD
          </span>
        </Link>
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2.5">
          <span className="block size-[30px] rounded-full bg-[#1F1F1F]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#1F1F1F]">
              CASA OLIVAR
            </span>
            <span className="text-[18px] font-semibold leading-tight">Salón en vivo</span>
          </div>
        </div>
        <span className="h-9 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-[#6B6660]">Sáb, 02 mayo 2026</span>
            <span className="font-mono text-[14px] font-semibold text-[#1F1F1F]">21:48</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">TURNO</span>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
              <span className="text-[13px] font-medium text-[#1F1F1F]">
                Cena · 18:30—23:00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3.5">
        <SalonSearchBox
          tables={tables}
          zones={zones}
          reservations={reservations}
          onPickResult={onPickResult}
        />
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <Link
          href="/salon/edit"
          className="flex items-center gap-2 rounded-[10px] border border-[#1F1F1F] bg-white px-4 py-2.5 hover:bg-[#F7F3EE]"
        >
          <LayoutGrid className="size-3.5 text-[#1F1F1F]" strokeWidth={1.8} />
          <span className="text-[13px] font-medium">Modo edición</span>
        </Link>
        <Link
          href="/reservas/nueva"
          className="flex items-center gap-2 rounded-[10px] bg-[#E67E22] px-[18px] py-2.5 transition-colors hover:bg-[#c2410c]"
        >
          <Plus className="size-3.5 text-white" strokeWidth={2.2} />
          <span className="text-[13px] font-semibold text-white">Nueva reserva</span>
        </Link>
      </div>
    </header>
  );
}
