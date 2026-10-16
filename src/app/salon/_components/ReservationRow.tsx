"use client";

import React from "react";
import { Info } from "lucide-react";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { RESERVATION_STATUS_LABEL } from "../_lib/table-utils";

interface ReservationRowProps {
  reservation: ReservationDTO;
}

export function ReservationRow({ reservation }: ReservationRowProps) {
  return (
    <div className="grid grid-cols-[88px_1fr_108px] items-center gap-3 border-b border-[#EDE6DC] px-4 py-3 last:border-b-0">
      <span className="font-mono text-[14px] font-semibold text-[#1F1F1F]">
        {reservation.timeSlot}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-[#1F1F1F]">
          {reservation.customerName}
        </span>
        <span className="truncate text-[11.5px] text-[#6B6660]">
          {reservation.partySize} personas
          {reservation.occasion ? ` · ${reservation.occasion}` : ""}
        </span>
      </span>
      <span className="justify-self-end rounded-full bg-[#F7F3EE] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#6B4F3A]">
        {RESERVATION_STATUS_LABEL[reservation.status]}
      </span>
    </div>
  );
}

export function EmptyReservationRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-4 text-[12px] text-[#6B6660]">
      <Info className="size-3.5 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
      <span>{text}</span>
    </div>
  );
}
