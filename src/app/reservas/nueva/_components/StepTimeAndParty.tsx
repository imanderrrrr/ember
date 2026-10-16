"use client";

import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { Step1GuestCard } from "./Step1GuestCard";
import { Step1SlotsCard } from "./Step1SlotsCard";

interface StepTimeAndPartyProps {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  reservations: ReservationDTO[];
  totalOpenTables: number;
  zones: ZoneDef[];
}

export function StepTimeAndParty({
  draft,
  onChange,
  reservations,
  totalOpenTables,
  zones,
}: StepTimeAndPartyProps) {
  return (
    <div className="flex gap-5">
      <Step1SlotsCard
        timeSlot={draft.timeSlot}
        partySize={draft.partySize}
        reservations={reservations}
        totalOpenTables={totalOpenTables}
        onSelectSlot={(slot) => onChange({ ...draft, timeSlot: slot })}
      />
      <Step1GuestCard
        draft={draft}
        onChange={onChange}
        zones={zones}
        reservations={reservations}
      />
    </div>
  );
}
