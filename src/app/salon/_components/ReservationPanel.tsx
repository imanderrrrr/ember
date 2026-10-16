"use client";

import React from "react";
import { Clock } from "lucide-react";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { RESERVATION_STATUS_LABEL } from "../_lib/table-utils";

interface ReservationPanelProps {
  title: string;
  reservation: ReservationDTO | null;
  emptyText: string;
  featured?: boolean;
}

export function ReservationPanel({
  title,
  reservation,
  emptyText,
  featured,
}: ReservationPanelProps) {
  return (
    <section className="flex min-h-[152px] flex-col gap-3 rounded-lg border border-[#EDE6DC] bg-white p-4">
      <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
        {title.toUpperCase()}
      </span>
      {reservation ? (
        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`flex shrink-0 items-center justify-center rounded-lg ${
                featured ? "size-12 bg-[#D8A6411f]" : "size-10 bg-[#F7F3EE]"
              }`}
            >
              <Clock
                className={
                  featured ? "size-5 text-[#D8A641]" : "size-4 text-[#6B4F3A]"
                }
                strokeWidth={1.8}
              />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-[20px] font-semibold leading-none text-[#1F1F1F]">
                {reservation.timeSlot}
              </span>
              <span className="truncate text-[14px] font-semibold text-[#1F1F1F]">
                {reservation.customerName}
              </span>
              <span className="text-[12px] text-[#6B6660]">
                {reservation.partySize} personas ·{" "}
                {RESERVATION_STATUS_LABEL[reservation.status]}
              </span>
            </div>
          </div>
          {(reservation.occasion || reservation.notes) && (
            <span className="line-clamp-2 text-[12px] leading-[1.4] text-[#6B4F3A]">
              {reservation.occasion ?? reservation.notes}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center rounded-lg bg-[#F7F3EE] px-3 py-3 text-[12px] text-[#6B6660]">
          {emptyText}
        </div>
      )}
    </section>
  );
}
