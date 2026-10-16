"use client";

import { Info } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { recommendedTableForDraft } from "../_lib/zone-utils";
import { incHours, pct, timelineRowsFor } from "../_lib/timeline-utils";

interface Step2TimelineProps {
  draft: ReservationDraft;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}

export function Step2Timeline({ draft, reservations, zones }: Step2TimelineProps) {
  const timelineRows = timelineRowsFor(zones, draft);
  const assignment = recommendedTableForDraft(zones, draft, reservations);
  const assignmentLabel = assignment
    ? `${assignment.table.id} · ${assignment.zone.shortName}`
    : "mesa por asignar";
  const reservationEnd = incHours(draft.timeSlot, 1, 30);

  return (
    <section
      className="animate-r2-up flex flex-col gap-4 rounded-2xl border border-[#ede6dc] bg-white p-5"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex items-end justify-between">
        <div
          className="animate-r2-up flex flex-col gap-1"
          style={{ animationDelay: "360ms" }}
        >
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            TIMELINE DEL TURNO · CENA
          </span>
          <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
            Reservas confirmadas vs tu propuesta
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <LegendChip color="#7c8a6a" label="Confirmadas" delay="420ms" />
          <LegendChip color="#e67e22" label="Tu reserva" delay="480ms" />
          <LegendChip
            color="#f4daba"
            border="#e8b07f"
            label="Buffer"
            delay="540ms"
          />
        </div>
      </div>

      <div className="flex">
        <div className="w-[120px] shrink-0" />
        <div className="ml-3.5 flex flex-1">
          {["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"].map((h, i) => {
            const isCurrent = h === "19:00";
            return (
              <span
                key={h}
                className="animate-r2-up flex flex-1 items-center justify-center font-mono text-[10px]"
                style={{
                  animationDelay: `${580 + i * 30}ms`,
                  color: isCurrent ? "#1f1f1f" : "#a89d8e",
                  fontWeight: isCurrent ? 700 : 600,
                  letterSpacing: "0.6px",
                }}
              >
                {h}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {timelineRows.map((row, rowIdx) => {
          const labelDelay = 720 + rowIdx * 80;
          return (
            <div key={row.label} className="flex items-center gap-3.5">
              <span
                className="animate-r2-left w-[120px] shrink-0 font-mono text-[10px] font-bold"
                style={{
                  letterSpacing: "1.2px",
                  color: row.active ? "#1f1f1f" : "#a89d8e",
                  animationDelay: `${labelDelay}ms`,
                }}
              >
                {row.label}
              </span>
              <div
                className="relative h-9 flex-1 rounded-md border border-[#ede6dc] bg-[#f7f3ee]"
                style={{ overflow: "hidden" }}
              >
                {row.bars.map((bar, barIdx) => {
                  const barDelay = labelDelay + 40 + barIdx * 60;
                  const isOrange = bar.kind === "orange";
                  return (
                    <span
                      key={barIdx}
                      className={`animate-r2-bar absolute top-0 h-full rounded-md ${
                        isOrange ? "animate-r2-pulse" : ""
                      }`}
                      style={{
                        left: pct(bar.x),
                        width: pct(bar.w),
                        background:
                          bar.kind === "green"
                            ? "#7c8a6a"
                            : bar.kind === "orange"
                              ? "#e67e22"
                              : "#f4daba",
                        border:
                          bar.kind === "buffer"
                            ? "1px solid #e8b07f"
                            : undefined,
                        animationDelay: `${barDelay}ms`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="animate-r2-up flex items-start gap-2.5 rounded-lg border border-[#e8b07f] bg-[#fbe7d6] px-3.5 py-2.5"
        style={{ animationDelay: "1180ms" }}
      >
        <Info className="mt-0.5 size-3.5 shrink-0 text-[#7a2e14]" strokeWidth={2} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-bold text-[#7a2e14]">
            Tu reserva ({assignmentLabel} · {draft.timeSlot} - {reservationEnd}) tiene buffer libre antes y después
          </span>
          <span className="text-[11px] leading-[1.4] text-[#6b4f3a]">
            30 min de buffer permite preparar la mesa y limpia transición
            entre reservas. Sin conflictos detectados.
          </span>
        </div>
      </div>
    </section>
  );
}

function LegendChip({
  color,
  border,
  label,
  delay,
}: {
  color: string;
  border?: string;
  label: string;
  delay: string;
}) {
  return (
    <span className="animate-r2-pop flex items-center gap-1.5" style={{ animationDelay: delay }}>
      <span
        className="block size-3 rounded-[3px]"
        style={{
          background: color,
          border: border ? `1px solid ${border}` : undefined,
        }}
      />
      <span className="text-[11px] text-[#6b4f3a]">{label}</span>
    </span>
  );
}
