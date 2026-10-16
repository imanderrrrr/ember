"use client";

import { Lightbulb } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { formatDayShort } from "../_lib/date-utils";
import { reservationsInZone } from "../_lib/zone-utils";

function incHours(hhmm: string, hours: number, minutes = 0): string {
  const [h, m] = hhmm.split(":").map(Number);
  let nh = h + hours;
  let nm = m + minutes;
  if (nm >= 60) {
    nh += Math.floor(nm / 60);
    nm = nm % 60;
  }
  nh = nh % 24;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

interface Step3HeaderProps {
  draft: ReservationDraft;
  zone: ZoneDef;
  reservations: ReservationDTO[];
  suggestionsOn: boolean;
  onToggleSuggestions: () => void;
}

export function Step3Header({
  draft,
  zone,
  reservations,
  suggestionsOn,
  onToggleSuggestions,
}: Step3HeaderProps) {
  const subtitle = `${zone.name} · ${formatDayShort(draft.date)} · ${draft.timeSlot} — ${incHours(draft.timeSlot, 3, 30)} · ${draft.partySize} personas`;
  const freeCount = Math.max(
    0,
    zone.total - reservationsInZone(reservations, zone.name).length,
  );

  return (
    <>
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <span
            className="animate-r3-up font-sans text-[11px] font-semibold text-[#6b4f3a]"
            style={{ letterSpacing: "2.4px", animationDelay: "0ms" }}
          >
            PASO 3 DE 5
          </span>
          <h1
            className="animate-r3-up font-mono text-[36px] font-semibold leading-[1.15] text-[#1f1f1f]"
            style={{ animationDelay: "80ms" }}
          >
            Asigna una mesa
          </h1>
          <p
            className="animate-r3-up text-[13px] text-[#6b4f3a]"
            style={{ animationDelay: "160ms" }}
          >
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleSuggestions}
          className="animate-r3-pop flex items-center gap-2.5 rounded-full border border-[#ede6dc] bg-[#f7f3ee] py-3.5 pl-[18px] pr-[18px]"
          style={{ animationDelay: "240ms" }}
        >
          <Lightbulb className="size-4 text-[#e67e22]" strokeWidth={1.8} />
          <span className="text-[13px] font-medium text-[#1f1f1f]">
            Sugerencias inteligentes activadas
          </span>
          <span
            className="flex h-[22px] w-[38px] items-center rounded-full p-[3px] transition-colors"
            style={{
              background: suggestionsOn ? "#e67e22" : "#a89d8e",
              justifyContent: suggestionsOn ? "flex-end" : "flex-start",
            }}
          >
            <span className="block size-4 rounded-full bg-white" />
          </span>
        </button>
      </div>

      <div
        className="animate-r3-up flex items-center gap-3 self-start rounded-full border border-[#e67e22] bg-[#fbe7d6] py-2 pl-3.5 pr-4"
        style={{ animationDelay: "300ms" }}
      >
        <span className="block size-2 rounded-full bg-[#e67e22]" />
        <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#7a2e14]">
          ZONA ELEGIDA
        </span>
        <span className="text-[12px] font-semibold text-[#1f1f1f]">
          {zone.name} · {freeCount} {freeCount === 1 ? "mesa libre" : "mesas libres"}
        </span>
        <span className="text-[11px] text-[#6b4f3a]">
          (para cambiar, vuelve al paso anterior)
        </span>
      </div>
    </>
  );
}
