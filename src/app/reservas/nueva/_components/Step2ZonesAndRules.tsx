"use client";

import React from "react";
import { Check } from "lucide-react";
import type { ReservationDraft, ZoneBadge, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { badgeFor, reservationsInZone } from "../_lib/zone-utils";
import { Step2RulesCard } from "./Step2RulesCard";

const BADGE_COLOR: Record<ZoneBadge, string> = {
  PREFERIDA: "#7a2e14",
  DISPONIBLE: "#5b6e48",
  LIMITADA: "#7a2e14",
  CERRADA: "#7a2e14",
};

interface Step2ZonesAndRulesProps {
  draft: ReservationDraft;
  zones: ZoneDef[];
  reservations: ReservationDTO[];
  onPickZone: (z: ZoneDef) => void;
}

export function Step2ZonesAndRules({
  draft,
  zones,
  reservations,
  onPickZone,
}: Step2ZonesAndRulesProps) {
  const selectedZone = zones.find((z) => z.name === draft.zoneName);

  const availabilityFor = (z: ZoneDef) => {
    if (z.disabled) return { free: 0, occupied: z.total };
    const occupied = reservationsInZone(reservations, z.name).length;
    return { free: Math.max(0, z.total - occupied), occupied };
  };

  return (
    <div className="flex gap-5">
      {/* Zonas card */}
      <section
        className="animate-r2-up flex flex-1 flex-col gap-3.5 rounded-2xl border border-[#ede6dc] bg-white p-5"
        style={{ animationDelay: "1240ms" }}
      >
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span
              className="font-mono text-[11px] font-bold text-[#a89d8e]"
              style={{ letterSpacing: "1.6px" }}
            >
              ZONAS DISPONIBLES
            </span>
            <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
              Elige el sector
            </span>
          </div>
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.4px" }}
          >
            {zones.filter((z) => !z.disabled).length} / {zones.length} abiertas
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {zones.map((z, i) => {
            const isSelected = z.name === draft.zoneName;
            const isDisabled = !!z.disabled;
            const { occupied } = availabilityFor(z);
            const dynamicBadge = badgeFor(z, occupied);
            return (
              <button
                key={z.name}
                type="button"
                onClick={() => onPickZone(z)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                aria-disabled={isDisabled}
                className="animate-r2-up flex items-center gap-3.5 rounded-[10px] px-3.5 py-3 text-left transition-colors"
                style={{
                  background: isSelected
                    ? "#fbe7d6"
                    : isDisabled
                      ? "#FFFFFF"
                      : z.sectorBg,
                  border: isSelected
                    ? "1.5px solid #e67e22"
                    : "1px solid #ede6dc",
                  opacity: isDisabled ? 0.6 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  animationDelay: `${1320 + i * 60}ms`,
                }}
              >
                <span
                  className="block size-2.5 shrink-0 rounded-full"
                  style={{ background: z.dotColor }}
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span
                    className="font-mono text-[13px]"
                    style={{
                      color: isDisabled ? "#a89d8e" : "#1f1f1f",
                      fontWeight: isDisabled ? 500 : 700,
                    }}
                  >
                    {z.name}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: isDisabled ? "#a89d8e" : "#6b4f3a" }}
                  >
                    {isDisabled
                      ? z.subline
                      : `${availabilityFor(z).free} ${availabilityFor(z).free === 1 ? "mesa libre" : "mesas libres"} · capacidad ${z.totalSeats}`}
                  </span>
                </div>
                {isSelected && (
                  <span className="flex items-center gap-1 rounded-full bg-[#e67e22] px-2 py-0.5">
                    <Check className="size-2.5 text-white" strokeWidth={3} />
                    <span className="text-[9px] font-bold tracking-[0.1em] text-white">
                      ELEGIDA
                    </span>
                  </span>
                )}
                {!isSelected && (
                  <span
                    className="font-mono text-[9px] font-bold"
                    style={{
                      color: BADGE_COLOR[dynamicBadge],
                      letterSpacing: "1.2px",
                    }}
                  >
                    {dynamicBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedZone && (
          <div
            className="animate-r2-up flex items-start gap-2.5 rounded-[10px] border border-[#7c8a6a33] bg-[#7c8a6a14] px-3.5 py-2.5"
            style={{ animationDelay: "1620ms" }}
            key={selectedZone.name}
          >
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-[#5b6e48]"
              strokeWidth={2.4}
            />
            <span className="text-[12px] leading-[1.5] text-[#1f1f1f]">
              <strong className="font-semibold">{selectedZone.name}</strong>{" "}
              tiene{" "}
              <strong className="font-semibold">
                {availabilityFor(selectedZone).free}{" "}
                {availabilityFor(selectedZone).free === 1
                  ? "mesa libre"
                  : "mesas libres"}
              </strong>{" "}
              a las {draft.timeSlot}. Asignarás la mesa específica en el
              siguiente paso.
            </span>
          </div>
        )}
      </section>

      {/* Reglas card */}
      <Step2RulesCard />
    </div>
  );
}
