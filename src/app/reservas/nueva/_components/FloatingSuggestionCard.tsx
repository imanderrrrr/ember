"use client";

import { ArrowRight, Check, Star, TriangleAlert } from "lucide-react";

interface FloatingSuggestionCardProps {
  recommendation: {
    tableId: string | null;
    reasons: string[];
    noFit?: boolean;
  };
  zoneShortName: string;
  partySize: number;
}

export function FloatingSuggestionCard({
  recommendation,
  zoneShortName,
  partySize,
}: FloatingSuggestionCardProps) {
  return (
    <div
      className="animate-r3-pop absolute flex flex-col gap-2.5 rounded-xl border bg-white p-3.5"
      style={{
        right: 16,
        bottom: 40,
        width: "32%",
        maxWidth: 320,
        borderColor: recommendation.noFit ? "#C95A3D" : "#e67e22",
        boxShadow: "0 6px 18px rgba(31,27,22,0.10)",
        animationDelay: "900ms",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex size-[22px] items-center justify-center rounded-full"
          style={{
            background: recommendation.noFit ? "#C95A3D14" : "#fbe7d6",
          }}
        >
          {recommendation.noFit ? (
            <TriangleAlert
              className="size-3 text-[#C95A3D]"
              strokeWidth={2}
            />
          ) : (
            <Star className="size-3 text-[#e67e22]" strokeWidth={2} />
          )}
        </span>
        <span className="text-[13px] font-bold text-[#1f1f1f]">
          {recommendation.noFit
            ? `Sin mesa individual para ${partySize} personas`
            : `Mejor sugerencia · Mesa ${recommendation.tableId}`}
        </span>
      </div>
      <span className="h-px w-full bg-[#fbe7d6]" />
      <div className="flex flex-col gap-2">
        {recommendation.reasons.map((r) => (
          <div key={r} className="flex items-center gap-2">
            {recommendation.noFit ? (
              <span
                className="block size-1.5 shrink-0 rounded-full"
                style={{ background: "#C95A3D" }}
              />
            ) : (
              <Check
                className="size-3 shrink-0 text-[#7c8a6a]"
                strokeWidth={2.4}
              />
            )}
            <span className="text-[11px] font-medium text-[#1f1f1f]">
              {r}
            </span>
          </div>
        ))}
      </div>
      <span className="h-px w-full bg-[#fbe7d6]" />
      <button
        type="button"
        className="flex items-center gap-1 self-start"
      >
        <span
          className="text-[11px] font-semibold"
          style={{
            color: recommendation.noFit ? "#C95A3D" : "#e67e22",
          }}
        >
          {recommendation.noFit
            ? "Considera otro sector"
            : `Ver alternativas en ${zoneShortName.toLowerCase()}`}
        </span>
        <ArrowRight
          className="size-3"
          strokeWidth={2.4}
          style={{
            color: recommendation.noFit ? "#C95A3D" : "#e67e22",
          }}
        />
      </button>
    </div>
  );
}
