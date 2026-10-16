"use client";

import { Minus, Plus } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { FloorPlanContent } from "./FloorPlanContent";
import { FullFloorPlanModal } from "./FullFloorPlanModal";
import { Step3Header } from "./Step3Header";
import { Step3Alternatives } from "./Step3Alternatives";
import {
  FLOOR_REF_H,
  FLOOR_REF_W,
  useStep3TableSelection,
} from "../_hooks/useStep3TableSelection";

interface StepZoneAndTableProps {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  zone: ZoneDef;
  reservations: ReservationDTO[];
}

export function StepZoneAndTable({
  draft,
  onChange,
  zone,
  reservations,
}: StepZoneAndTableProps) {
  const {
    suggestionsOn,
    setSuggestionsOn,
    zoom,
    setZoom,
    planOpen,
    setPlanOpen,
    viewportRef,
    effectiveScale,
    recommendation,
    recommended,
    selected,
    selectTable,
    planTables,
    alts,
  } = useStep3TableSelection({ draft, onChange, zone, reservations });

  return (
    <>
      <Step3Header
        draft={draft}
        zone={zone}
        reservations={reservations}
        suggestionsOn={suggestionsOn}
        onToggleSuggestions={() => setSuggestionsOn((v) => !v)}
      />

      <section
        className="animate-r3-up overflow-hidden rounded-2xl border border-[#ede6dc] bg-white"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#ede6dc] px-5 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold text-[#1f1f1f]">
              {zone.name} · vista parcial
            </span>
            <span className="text-[12px] text-[#6b4f3a]">
              Disponibilidad a las {draft.timeSlot}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlanOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#ede6dc] bg-white px-3 py-2 transition-colors hover:bg-[#f7f3ee]"
            >
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#1f1f1f" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M3 8V5a2 2 0 0 1 2-2h3" />
              </svg>
              <span className="text-[12px] font-medium text-[#1f1f1f]">
                Ver plano completo
              </span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))
                }
                disabled={zoom <= 0.5}
                className="flex size-7 items-center justify-center rounded-md bg-[#1f1f1f] disabled:opacity-50"
                aria-label="Reducir zoom"
              >
                <Minus className="size-3.5 text-[#f7f3ee]" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="flex h-7 items-center justify-center rounded-md bg-[#1f1f1f] px-2"
                aria-label="Resetear zoom"
              >
                <span className="text-[11px] font-medium text-[#f7f3ee]">
                  {Math.round(zoom * 100)}%
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))
                }
                disabled={zoom >= 1.5}
                className="flex size-7 items-center justify-center rounded-md bg-[#1f1f1f] disabled:opacity-50"
                aria-label="Aumentar zoom"
              >
                <Plus className="size-3.5 text-[#f7f3ee]" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="relative mx-auto overflow-auto"
          style={{
            width: "100%",
            maxWidth: 720,
            aspectRatio: `${FLOOR_REF_W} / ${FLOOR_REF_H}`,
          }}
        >
          <div
            style={{
              width: Math.max(FLOOR_REF_W * effectiveScale, 1),
              height: Math.max(FLOOR_REF_H * effectiveScale, 1),
            }}
          >
            <div
              className="relative bg-white"
              style={{
                width: FLOOR_REF_W,
                height: FLOOR_REF_H,
                transformOrigin: "top left",
                transform: `scale(${effectiveScale})`,
              }}
            >
              <FloorPlanContent
                planTables={planTables}
                selected={selected}
                recommended={recommended}
                recommendation={recommendation}
                suggestionsOn={suggestionsOn}
                zoneShortName={zone.shortName}
                partySize={draft.partySize}
                onSelect={selectTable}
              />
            </div>
          </div>
        </div>
      </section>

      <Step3Alternatives
        alts={alts}
        zone={zone}
        timeSlot={draft.timeSlot}
        partySize={draft.partySize}
        onSelectTable={selectTable}
      />

      {planOpen && (
        <FullFloorPlanModal
          planTables={planTables}
          selected={selected}
          recommended={recommended}
          recommendation={recommendation}
          suggestionsOn={suggestionsOn}
          zone={zone}
          partySize={draft.partySize}
          timeSlot={draft.timeSlot}
          onSelect={selectTable}
          onClose={() => setPlanOpen(false)}
        />
      )}
    </>
  );
}

