"use client";

import { Check, Clock, X } from "lucide-react";
import type { ZoneAlt } from "../_lib/types";

export interface AltCard extends ZoneAlt {
  delay: number;
}

interface AltTableCardProps {
  card: AltCard;
  onSelect: () => void;
}

export function AltTableCard({ card, onSelect }: AltTableCardProps) {
  const chipBg =
    card.chip.tone === "good"
      ? "#ede6dc"
      : card.chip.tone === "warn"
        ? "#faf5eb"
        : card.chip.tone === "muted"
          ? "#ede6dc"
          : "#ede6dc";
  const chipFg =
    card.chip.tone === "good"
      ? "#7c8a6a"
      : card.chip.tone === "warn"
        ? "#6b4f3a"
        : card.chip.tone === "muted"
          ? "#7a2e14"
          : "#7a2e14";
  const ChipIcon =
    card.chip.icon === "check"
      ? Check
      : card.chip.icon === "clock"
        ? Clock
        : card.chip.icon === "x"
          ? X
          : null;

  return (
    <div
      className="animate-r3-card flex flex-1 flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
      style={{
        opacity: card.muted ? 0.85 : 1,
        animationDelay: `${card.delay}ms`,
      }}
    >
      <span
        className="font-mono text-[28px] font-semibold leading-none"
        style={{ color: card.labelColor ?? (card.muted ? "#a89d8e" : "#1f1f1f") }}
      >
        {card.label}
      </span>
      <span
        className="text-[11px]"
        style={{ color: card.muted ? "#a89d8e" : "#6b4f3a" }}
      >
        {card.meta}
      </span>
      <div className="flex">
        <span
          className="flex items-center gap-1 rounded-full px-2 py-1"
          style={{
            background: chipBg,
            border: card.chip.tone === "warn" ? "1px solid #ede6dc" : undefined,
          }}
        >
          {ChipIcon && (
            <ChipIcon
              className="size-2.5"
              strokeWidth={2.4}
              style={{ color: chipFg }}
            />
          )}
          <span
            className="text-[10px] font-semibold"
            style={{ color: chipFg }}
          >
            {card.chip.text}
          </span>
        </span>
      </div>
      <div
        className="relative h-[54px] w-full rounded-md border border-[#ede6dc]"
        style={{
          background: "#faf5eb",
          opacity: card.muted ? 0.6 : 1,
        }}
      >
        <span
          className="absolute block size-[18px] rounded-full"
          style={{
            background: card.dotColor,
            left: card.dotX,
            top: 18,
          }}
        />
      </div>
      <button
        type="button"
        onClick={onSelect}
        disabled={card.muted}
        className="flex items-center justify-center rounded-lg border border-[#ede6dc] py-2"
        style={{
          background: card.muted ? "#faf5eb" : "#FFFFFF",
          cursor: card.muted ? "default" : "pointer",
        }}
      >
        <span
          className="text-[12px] font-semibold"
          style={{ color: card.muted ? "#a89d8e" : "#1f1f1f" }}
        >
          Seleccionar
        </span>
      </button>
    </div>
  );
}
