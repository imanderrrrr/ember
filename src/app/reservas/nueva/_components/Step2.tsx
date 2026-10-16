"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { findZone, reservationsInZone } from "../_lib/zone-utils";
import { Step2Timeline } from "./Step2Timeline";
import { Step2ZonesAndRules } from "./Step2ZonesAndRules";

interface Step2Props {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}

export function Step2({
  draft,
  onChange,
  reservations,
  zones,
}: Step2Props) {
  useEffect(() => {
    if (draft.zoneName === null && zones.length > 0) {
      const first = zones.find((z) => !z.disabled) ?? zones[0];
      onChange({ ...draft, zoneName: first.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  const selectedZone = findZone(zones, draft.zoneName);

  if (zones.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-[#ede6dc] bg-white">
        <span className="font-mono text-[13px] text-[#6b4f3a]">
          Cargando disponibilidad…
        </span>
      </div>
    );
  }

  const selectedOccupancyPct = (() => {
    if (!selectedZone || selectedZone.total === 0) return 0;
    const occupied = reservationsInZone(reservations, selectedZone.name).length;
    return Math.round((occupied / selectedZone.total) * 100);
  })();

  const pickZone = (z: ZoneDef) => {
    if (z.disabled) return;
    onChange({ ...draft, zoneName: z.name, tableId: null, tableLabel: null });
  };

  return (
    <>
      {/* Step header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span
            className="animate-r2-up font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px", animationDelay: "0ms" }}
          >
            PASO 02 · CAPACIDAD
          </span>
          <h1
            className="animate-r2-up font-mono text-[24px] font-bold leading-tight text-[#1f1f1f]"
            style={{ letterSpacing: "-0.3px", animationDelay: "80ms" }}
          >
            Verifica disponibilidad del turno
          </h1>
          <p
            className="animate-r2-up max-w-[760px] text-[13px] leading-[1.45] text-[#6b4f3a]"
            style={{ animationDelay: "160ms" }}
          >
            Revisa cómo encaja tu reserva en el plan de sala del{" "}
            {draft.dateLabel} · {draft.timeSlot}. Si hay
            conflictos, sugerimos franjas alternativas.
          </p>
        </div>
        <span
          className="animate-r2-pop flex items-center gap-2 rounded-full bg-[#dfe8d9] py-2 pl-3.5 pr-4"
          style={{ border: "1px solid #a8c18b", animationDelay: "240ms" }}
        >
          <Check className="size-3.5 text-[#5b6e48]" strokeWidth={2.4} />
          <span className="text-[12px] font-semibold text-[#5b6e48]">
            Capacidad confirmada · {selectedOccupancyPct}% ocupado
          </span>
        </span>
      </div>

      <Step2Timeline
        draft={draft}
        reservations={reservations}
        zones={zones}
      />

      <Step2ZonesAndRules
        draft={draft}
        zones={zones}
        reservations={reservations}
        onPickZone={pickZone}
      />
    </>
  );
}
