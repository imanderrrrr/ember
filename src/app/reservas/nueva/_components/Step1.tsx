"use client";

import { Calendar } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { StepDateSelector } from "./StepDateSelector";
import { StepTimeAndParty } from "./StepTimeAndParty";

interface Step1Props {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  reservations: ReservationDTO[];
  totalOpenTables: number;
  zones: ZoneDef[];
}

export function Step1({
  draft,
  onChange,
  reservations,
  totalOpenTables,
  zones,
}: Step1Props) {
  return (
    <>
      {/* Step header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            PASO 01 · TEMPORALIDAD
          </span>
          <h1
            className="font-mono text-[24px] font-bold leading-tight text-[#1f1f1f]"
            style={{ letterSpacing: "-0.3px" }}
          >
            Define cuándo y para cuántos
          </h1>
          <p className="max-w-[640px] text-[13px] leading-[1.45] text-[#6b4f3a]">
            Selecciona fecha, horario y cantidad de comensales. La disponibilidad
            se valida con el plan de sala del día.
          </p>
        </div>
        <span
          className="flex items-center gap-2 rounded-full bg-[#fbe7d6] py-2 pl-3.5 pr-4"
          style={{ border: "1px solid #e8b07f" }}
        >
          <Calendar className="size-3.5 text-[#7a2e14]" strokeWidth={1.8} />
          <span className="text-[12px] font-semibold text-[#7a2e14]">
            Servicio · Cena
          </span>
        </span>
      </div>

      <StepDateSelector draft={draft} onChange={onChange} />

      <StepTimeAndParty
        draft={draft}
        onChange={onChange}
        reservations={reservations}
        totalOpenTables={totalOpenTables}
        zones={zones}
      />
    </>
  );
}
