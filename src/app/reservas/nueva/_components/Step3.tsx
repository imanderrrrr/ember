"use client";

import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { StepZoneAndTable } from "./StepZoneAndTable";

interface Step3Props {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}

export function Step3({
  draft,
  onChange,
  reservations,
  zones,
}: Step3Props) {
  if (zones.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-[#ede6dc] bg-white">
        <span className="font-mono text-[13px] text-[#6b4f3a]">
          Cargando plano del salón…
        </span>
      </div>
    );
  }

  const currentZone = zones.find((z) => z.name === draft.zoneName);

  if (!currentZone) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-[#ede6dc] bg-white text-center">
        <span className="font-mono text-[14px] font-semibold text-[#1f1f1f]">
          Zona no disponible
        </span>
        <p className="max-w-md text-[13px] text-[#6b4f3a]">
          La zona seleccionada no existe en el plano del salón o ha sido desactivada.
        </p>
      </div>
    );
  }

  return (
    <StepZoneAndTable
      draft={draft}
      onChange={onChange}
      zone={currentZone}
      reservations={reservations}
    />
  );
}
