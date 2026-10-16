"use client";

import React from "react";
import { Calendar, Clock, Info } from "lucide-react";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { formatReservationDate, RESERVATION_STATUS_LABEL } from "../_lib/table-utils";

interface DrawerReservationsSectionProps {
  nextReservation: ReservationDTO | null;
  serviceDate: string;
  onOpenModal: () => void;
}

export function DrawerReservationsSection({
  nextReservation,
  serviceDate,
  onOpenModal,
}: DrawerReservationsSectionProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          RESERVAS DE MESA
        </span>
        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-center gap-1.5 rounded-md border border-[#EDE6DC] bg-white px-2.5 py-1.5 text-[11px] hover:bg-[#F7F3EE]"
        >
          <Calendar className="size-3 text-[#E67E22]" strokeWidth={1.8} />
          Ver
        </button>
      </div>
      {nextReservation ? (
        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-start gap-3 rounded-lg border border-[#D8A64166] bg-[#D8A64112] px-3.5 py-3 text-left hover:bg-[#D8A6411f]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white">
            <Clock className="size-4 text-[#D8A641]" strokeWidth={1.8} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-[13px] font-semibold text-[#1F1F1F]">
              {nextReservation.timeSlot} · {nextReservation.customerName}
            </span>
            <span className="text-[11.5px] leading-[1.35] text-[#6B6660]">
              {nextReservation.partySize} personas ·{" "}
              {RESERVATION_STATUS_LABEL[nextReservation.status]}
            </span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-start gap-3 rounded-lg border border-[#EDE6DC] bg-white px-3.5 py-3 text-left hover:bg-[#F7F3EE]"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] leading-[1.45] text-[#6B6660]">
            Sin reservas activas para esta mesa en {formatReservationDate(serviceDate)}.
          </span>
        </button>
      )}
    </div>
  );
}
