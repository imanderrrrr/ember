"use client";

import { Minus, Plus, Users } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { recommendedTableForDraft } from "../_lib/zone-utils";

interface Step1GuestCardProps {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  zones: ZoneDef[];
  reservations: ReservationDTO[];
}

export function Step1GuestCard({
  draft,
  onChange,
  zones,
  reservations,
}: Step1GuestCardProps) {
  const suggested = recommendedTableForDraft(zones, draft, reservations);

  return (
    <section className="flex w-[480px] flex-col gap-[18px] rounded-2xl border border-[#ede6dc] bg-white p-5">
      <div className="flex flex-col gap-1">
        <span
          className="font-mono text-[11px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.6px" }}
        >
          COMENSALES
        </span>
        <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
          ¿Cuántos esperas en la mesa?
        </span>
      </div>

      <div className="flex items-center justify-center gap-6 py-3.5">
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              partySize: Math.max(1, draft.partySize - 1),
            })
          }
          className="flex size-12 items-center justify-center rounded-full border border-[#ede6dc]"
        >
          <Minus className="size-4 text-[#6b4f3a]" strokeWidth={2} />
        </button>
        <div className="flex w-[120px] flex-col items-center justify-center gap-1">
          <span
            className="font-mono text-[56px] font-bold leading-none text-[#1f1f1f]"
            style={{ letterSpacing: "-2px" }}
          >
            {draft.partySize}
          </span>
          <span
            className="font-mono text-[10px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            PERSONAS
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              partySize: Math.min(20, draft.partySize + 1),
            })
          }
          className="flex size-12 items-center justify-center rounded-full bg-[#e67e22]"
        >
          <Plus className="size-4 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="flex gap-2">
        {[2, 4, 6, 8].map((n) => {
          const active = n === draft.partySize;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...draft, partySize: n })}
              className="flex h-9 flex-1 items-center justify-center rounded-full"
              style={{
                background: active ? "#fbe7d6" : "transparent",
                border: active ? "1px solid #e8b07f" : "1px solid #ede6dc",
              }}
            >
              <span
                className="text-[13px]"
                style={{
                  color: active ? "#7a2e14" : "#6b4f3a",
                  fontWeight: active ? 700 : 600,
                }}
              >
                {n}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange({ ...draft, partySize: 10 })}
          className="flex h-9 flex-1 items-center justify-center rounded-full border border-[#ede6dc]"
        >
          <span className="text-[13px] font-semibold text-[#6b4f3a]">
            10+
          </span>
        </button>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-[#ede6dc] bg-[#f7f3ee] px-3.5 py-2.5">
        <Users
          className="mt-0.5 size-3.5 shrink-0 text-[#7d5ba6]"
          strokeWidth={1.8}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-semibold text-[#1f1f1f]">
            {suggested
              ? `Mesa sugerida: ${suggested.table.id} · ${suggested.zone.shortName}`
              : "Mesa sugerida: se calculará con el plano del salón"}
          </span>
          <span className="text-[11px] leading-[1.4] text-[#6b4f3a]">
            Para {draft.partySize} personas, capacidad ideal{" "}
            {suggested
              ? `${suggested.table.seats} personas`
              : "según disponibilidad real"}
            . Asignable en paso 3.
          </span>
        </div>
      </div>
    </section>
  );
}
