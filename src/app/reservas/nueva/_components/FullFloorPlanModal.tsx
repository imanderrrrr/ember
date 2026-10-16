"use client";

import { useEffect, useRef, useState } from "react";
import { Star, X } from "lucide-react";
import type { ZoneDef } from "../_lib/types";
import { FloorPlanContent } from "./FloorPlanContent";
import type { PlanTable } from "./PlanTableNode";

const FLOOR_REF_W = 920;
const FLOOR_REF_H = 900;

interface FullFloorPlanModalProps {
  planTables: PlanTable[];
  selected: string | null;
  recommended: string | null;
  recommendation: {
    tableId: string | null;
    reasons: string[];
    noFit?: boolean;
  };
  suggestionsOn: boolean;
  zone: ZoneDef;
  partySize: number;
  timeSlot: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function FullFloorPlanModal({
  planTables,
  selected,
  recommended,
  recommendation,
  suggestionsOn,
  zone,
  partySize,
  timeSlot,
  onSelect,
  onClose,
}: FullFloorPlanModalProps) {
  const modalViewportRef = useRef<HTMLDivElement>(null);
  const [modalScale, setModalScale] = useState(1);

  useEffect(() => {
    const el = modalViewportRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const sx = rect.width / FLOOR_REF_W;
      const sy = rect.height / FLOOR_REF_H;
      setModalScale(Math.min(sx, sy));
    };
    compute();
    const obs = new ResizeObserver(compute);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(31,27,22,0.55)" }}
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-h-[92vh] max-w-[1280px] flex-col overflow-hidden rounded-2xl border border-[#ede6dc] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between gap-4 border-b border-[#ede6dc] px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#6b4f3a]">
              PLANO COMPLETO
            </span>
            <span className="font-mono text-[18px] font-semibold text-[#1f1f1f]">
              {zone.name}
            </span>
            <span className="text-[12px] text-[#6b4f3a]">
              Disponibilidad a las {timeSlot} · {zone.total}{" "}
              {zone.total === 1 ? "mesa total" : "mesas totales"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg border border-[#ede6dc] bg-white transition-colors hover:bg-[#f7f3ee]"
            aria-label="Cerrar plano completo"
          >
            <X className="size-4 text-[#1f1f1f]" strokeWidth={2} />
          </button>
        </div>

        {/* Canvas grande */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#faf5eb] p-6">
          <div
            ref={modalViewportRef}
            className="relative flex h-full w-full items-center justify-center"
          >
            <div
              className="relative overflow-hidden rounded-xl border border-[#ede6dc] bg-white"
              style={{
                width: FLOOR_REF_W * modalScale,
                height: FLOOR_REF_H * modalScale,
              }}
            >
              <div
                className="relative bg-white"
                style={{
                  width: FLOOR_REF_W,
                  height: FLOOR_REF_H,
                  transformOrigin: "top left",
                  transform: `scale(${modalScale})`,
                }}
              >
                <FloorPlanContent
                  planTables={planTables}
                  selected={selected}
                  recommended={recommended}
                  recommendation={recommendation}
                  suggestionsOn={suggestionsOn}
                  zoneShortName={zone.shortName}
                  partySize={partySize}
                  onSelect={onSelect}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer del modal con leyenda y selección actual */}
        <div className="flex items-center justify-between gap-4 border-t border-[#ede6dc] bg-white px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-[#7c8a6a] bg-white" />
              <span className="text-[11px] text-[#6b4f3a]">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-[#e67e22] bg-[#fbe7d6]" />
              <span className="text-[11px] text-[#6b4f3a]">Seleccionada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-[#ede6dc] bg-[#ede6dc]" />
              <span className="text-[11px] text-[#6b4f3a]">Reservada</span>
            </div>
            <div className="flex items-center gap-2">
              <Star
                className="size-3 text-[#d8a641]"
                strokeWidth={2}
                fill="#d8a641"
              />
              <span className="text-[11px] text-[#6b4f3a]">Recomendada</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#6b4f3a]">
              Mesa seleccionada:
            </span>
            <span className="rounded-full bg-[#fbe7d6] px-3 py-1 font-mono text-[12px] font-bold text-[#7a2e14]">
              {selected ? `Mesa ${selected}` : "Sin selección"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#1f1f1f] px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Aceptar y cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
