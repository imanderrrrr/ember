"use client";

import React from "react";
import { MoreVertical } from "lucide-react";
import type { SalonTable, TableStatus } from "../_lib/types";
import { STATUS_LABEL } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";

interface DrawerHeaderProps {
  table: SalonTable;
  displayStatus: TableStatus;
  statusColor: string;
  nextReservation: ReservationDTO | null;
  onClose: () => void;
}

export function DrawerHeader({
  table,
  displayStatus,
  statusColor,
  nextReservation,
  onClose,
}: DrawerHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
              MESA
            </span>
            <span className="font-mono text-[42px] font-medium leading-none text-[#1F1F1F]">
              {table.label}
            </span>
            <div
              className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px]"
              style={{ background: statusColor }}
            >
              <span className="size-1.5 rounded-full bg-[#F7F3EE]" />
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#F7F3EE]">
                {STATUS_LABEL[displayStatus].toUpperCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha"
            className="flex size-8 items-center justify-center rounded-lg border border-[#EDE6DC] hover:bg-white"
          >
            <MoreVertical className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 border-b border-[#EDE6DC] px-6 py-4">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">CAPACIDAD</span>
          <span className="text-[12px] font-medium">{table.seats} {table.seats === 1 ? "persona" : "personas"}</span>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">RESERVA</span>
          <span className="font-mono text-[12px] font-medium">{nextReservation?.timeSlot ?? "—"}</span>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">MESERO</span>
          <div className="flex items-center gap-1.5">
            <span className="block size-[18px] rounded-full bg-[#7C8A6A]" />
            <span className="text-[12px] font-medium">Andrés López</span>
          </div>
        </div>
      </div>
    </>
  );
}
