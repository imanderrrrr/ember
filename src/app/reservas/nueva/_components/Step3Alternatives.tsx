"use client";

import { ChevronRight } from "lucide-react";
import type { ZoneDef } from "../_lib/types";
import { AltTableCard, type AltCard } from "./AltTableCard";

interface Step3AlternativesProps {
  alts: AltCard[];
  zone: ZoneDef;
  timeSlot: string;
  partySize: number;
  onSelectTable: (label: string) => void;
}

export function Step3Alternatives({
  alts,
  zone,
  timeSlot,
  partySize,
  onSelectTable,
}: Step3AlternativesProps) {
  if (alts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3.5">
      <div
        className="animate-r3-up flex items-center justify-between gap-3"
        style={{ animationDelay: "1040ms" }}
      >
        <span className="text-[14px] font-semibold text-[#1f1f1f]">
          Otras mesas en {zone.shortName.toLowerCase()} a las {timeSlot}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-[#ede6dc] bg-white py-1.5 pl-3.5 pr-2.5 text-[11px] text-[#1f1f1f]">
            Capacidad ≥ {partySize}
            <ChevronRight className="size-3 rotate-90 text-[#6b4f3a]" strokeWidth={2} />
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#ede6dc] bg-white py-1.5 pl-3.5 pr-2.5 text-[11px] text-[#1f1f1f]">
            Esta zona
            <ChevronRight className="size-3 rotate-90 text-[#6b4f3a]" strokeWidth={2} />
          </span>
        </div>
      </div>
      <div className="flex gap-3.5">
        {alts.map((c) => (
          <AltTableCard
            key={c.label}
            card={c}
            onSelect={() => {
              if (c.muted) return;
              onSelectTable(c.label);
            }}
          />
        ))}
      </div>
    </section>
  );
}
