"use client";

import { PlanTableNode, type PlanTable } from "./PlanTableNode";
import { FloatingSuggestionCard } from "./FloatingSuggestionCard";

interface FloorPlanContentProps {
  planTables: PlanTable[];
  selected: string | null;
  recommended: string | null;
  recommendation: {
    tableId: string | null;
    reasons: string[];
    noFit?: boolean;
  };
  suggestionsOn: boolean;
  zoneShortName: string;
  partySize: number;
  onSelect: (id: string) => void;
}

export function FloorPlanContent({
  planTables,
  selected,
  recommended,
  recommendation,
  suggestionsOn,
  zoneShortName,
  partySize,
  onSelect,
}: FloorPlanContentProps) {
  return (
    <>
      {/* Top line + entrada label */}
      <div
        className="animate-r3-up absolute left-0 right-0 flex items-center justify-center gap-1.5"
        style={{ top: 6, animationDelay: "380ms" }}
      >
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="none"
          stroke="#6b4f3a"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m7 6 5 5 5-5" />
          <path d="m7 13 5 5 5-5" />
        </svg>
        <span
          className="text-[9px] font-semibold text-[#6b4f3a]"
          style={{ letterSpacing: "1.8px" }}
        >
          ENTRADA PRINCIPAL
        </span>
      </div>
      <div
        className="absolute h-px bg-[#a89d8e]"
        style={{ left: 30, right: 30, top: 30 }}
      />

      {/* Zone labels */}
      <span
        className="absolute font-mono text-[11px] font-medium italic text-[#a89d8e]"
        style={{ left: 24, top: 80, letterSpacing: "2px" }}
      >
        Z &nbsp;VENTANAL
      </span>
      <span
        className="absolute font-mono text-[11px] font-medium italic text-[#a89d8e]"
        style={{ right: 24, top: 80, letterSpacing: "2px" }}
      >
        Z &nbsp;INTERIOR
      </span>

      {/* Halo bajo la mesa recomendada */}
      {recommended &&
        (() => {
          const recT = planTables.find((t) => t.id === recommended);
          if (!recT) return null;
          const haloSize = Math.max(recT.w, recT.h) * 1.5;
          const innerSize = Math.max(recT.w, recT.h) * 1.18;
          const haloOffsetX = (haloSize - recT.w) / 2;
          const haloOffsetY = (haloSize - recT.h) / 2;
          const innerOffsetX = (innerSize - recT.w) / 2;
          const innerOffsetY = (innerSize - recT.h) / 2;
          return (
            <>
              <span
                className="animate-r3-halo absolute rounded-full bg-[#e67e22]"
                style={{
                  left: recT.x - haloOffsetX,
                  top: recT.y - haloOffsetY,
                  width: haloSize,
                  height: haloSize,
                  animationDelay: "560ms",
                }}
              />
              <span
                className="animate-r3-halo-inner absolute rounded-full bg-[#e67e22]"
                style={{
                  left: recT.x - innerOffsetX,
                  top: recT.y - innerOffsetY,
                  width: innerSize,
                  height: innerSize,
                  animationDelay: "640ms",
                }}
              />
            </>
          );
        })()}

      {/* Tables */}
      {planTables.map((t) => (
        <PlanTableNode
          key={t.id}
          table={t}
          selectedId={selected ?? ""}
          recommendedId={recommended ?? ""}
          onSelect={onSelect}
        />
      ))}

      {/* Suggestion card flotante */}
      {suggestionsOn && (
        <FloatingSuggestionCard
          recommendation={recommendation}
          zoneShortName={zoneShortName}
          partySize={partySize}
        />
      )}

      {/* Bottom line + pase de cocina */}
      <div
        className="absolute h-px bg-[#1f1f1f]"
        style={{ left: 30, right: 30, bottom: 20 }}
      />
      <div
        className="animate-r3-up absolute left-0 right-0 flex items-center justify-center gap-1.5"
        style={{ bottom: 6, animationDelay: "840ms" }}
      >
        <svg
          viewBox="0 0 24 24"
          width={11}
          height={11}
          fill="none"
          stroke="#1f1f1f"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 11v-1a5 5 0 0 0-10 0v1" />
          <path d="M3 17a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-1H3z" />
          <path d="M12 8V5" />
        </svg>
        <span
          className="text-[9px] font-semibold text-[#1f1f1f]"
          style={{ letterSpacing: "1.8px" }}
        >
          PASE DE COCINA
        </span>
      </div>
    </>
  );
}
