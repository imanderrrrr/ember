"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import type { ReservationDraft } from "../_lib/types";

interface SuccessScreenProps {
  draft: ReservationDraft;
}

export function SuccessScreen({ draft }: SuccessScreenProps) {
  return (
    <div className="flex min-h-screen w-full min-w-[1600px] flex-col items-center justify-center bg-[#faf5eb] text-[#1f1f1f]">
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#7c8a6a] shadow-[0_8px_24px_rgba(124,138,106,0.35)]">
          <Check className="size-7 text-white" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="font-mono text-[10px] font-bold text-[#7c8a6a]"
            style={{ letterSpacing: "1.8px" }}
          >
            RESERVA CONFIRMADA
          </span>
          <h1 className="text-[28px] font-bold leading-tight">
            ¡Lista, {draft.customerName.split(" ")[0]} ya tiene mesa!
          </h1>
          <p className="max-w-[400px] text-[13.5px] leading-[1.5] text-[#6b4f3a]">
            {draft.dateLabel} · {draft.timeSlot}. Volvemos al salón en unos segundos.
          </p>
        </div>
        <Link
          href="/salon"
          className="mt-3 rounded-[10px] bg-[#1f1f1f] px-5 py-2.5 text-[13px] font-semibold text-white"
        >
          Volver al salón ahora
        </Link>
      </div>
    </div>
  );
}
