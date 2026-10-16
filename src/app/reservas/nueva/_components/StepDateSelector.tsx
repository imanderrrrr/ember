"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReservationDraft } from "../_lib/types";
import { formatDayLong, MONTHS_LONG } from "../_lib/date-utils";
import { TODAY } from "../_lib/wizard-constants";

interface DayCell {
  num: string;
  date: string;
  dot?: "good" | "limited" | "closed";
  past?: boolean;
  today?: boolean;
  empty?: boolean;
}

const TODAY_DATE = new Date();
const CAL_YEAR = TODAY_DATE.getFullYear();
const CAL_MONTH = TODAY_DATE.getMonth();
const CAL_MONTH_LABEL = `${MONTHS_LONG[CAL_MONTH].toUpperCase()} ${CAL_YEAR}`;
const DAYS_IN_MONTH = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();

const MAY_DAYS: DayCell[] = (() => {
  const todayNum = TODAY_DATE.getDate();
  const firstDow = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const leading = (firstDow + 6) % 7;
  const cells: DayCell[] = [];
  for (let i = 0; i < leading; i++) {
    cells.push({ num: "", date: "", empty: true });
  }
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    const date = `${CAL_YEAR}-${String(CAL_MONTH + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      num: String(d).padStart(2, "0"),
      date,
      dot: "good",
      past: d < todayNum,
      today: d === todayNum,
    });
  }
  return cells;
})();

interface StepDateSelectorProps {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
}

export function StepDateSelector({ draft, onChange }: StepDateSelectorProps) {
  return (
    <section className="flex flex-col gap-[18px] rounded-2xl border border-[#ede6dc] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            {CAL_MONTH_LABEL}
          </span>
          <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
            Selecciona un día con disponibilidad
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg border border-[#ede6dc]"
          >
            <ChevronLeft className="size-3.5 text-[#6b4f3a]" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="flex h-8 items-center rounded-lg border border-[#ede6dc] bg-[#f7f3ee] px-3.5"
          >
            <span className="text-[12px] font-semibold text-[#6b4f3a]">
              Hoy
            </span>
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg border border-[#ede6dc]"
          >
            <ChevronRight className="size-3.5 text-[#6b4f3a]" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
          <span
            key={d}
            className="flex h-6 items-center justify-center font-mono text-[10px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.2px" }}
          >
            {d}
          </span>
        ))}
        {MAY_DAYS.map((d, i) => {
          if (d.empty) return <div key={`e${i}`} className="h-14" />;
          const selected = d.date === draft.date;
          const isPast = !!d.past;
          const isToday = !!d.today;
          const isClosed = d.dot === "closed";
          const disabled = isPast || isClosed;
          const dotColor =
            d.dot === "good"
              ? "#7c8a6a"
              : d.dot === "limited"
                ? "#d8a641"
                : isClosed
                  ? "#c95a3d"
                  : null;
          return (
            <button
              key={d.date}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              aria-label={
                isPast
                  ? `${d.num} de ${MONTHS_LONG[CAL_MONTH]} (fecha pasada, no disponible)`
                  : isClosed
                    ? `${d.num} de ${MONTHS_LONG[CAL_MONTH]} (sin disponibilidad)`
                    : `${d.num} de ${MONTHS_LONG[CAL_MONTH]}`
              }
              onClick={() => {
                if (disabled) return;
                onChange({
                  ...draft,
                  date: d.date,
                  dateLabel: formatDayLong(d.date),
                });
              }}
              className="relative flex h-14 flex-col items-center justify-center gap-1 rounded-[10px] transition-colors"
              style={{
                background: selected ? "#e67e22" : "transparent",
                border: selected
                  ? "none"
                  : isPast
                    ? "1px dashed #ede6dc"
                    : "1px solid #ede6dc",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: isPast ? 0.45 : 1,
              }}
            >
              <span
                className="font-mono text-[14px] leading-none"
                style={{
                  fontWeight: selected ? 700 : isPast ? 400 : 600,
                  color: selected
                    ? "#FFFFFF"
                    : isPast
                      ? "#a89d8e"
                      : isClosed
                        ? "#a89d8e"
                        : "#1f1f1f",
                  textDecoration: isPast ? "line-through" : undefined,
                }}
              >
                {d.num}
              </span>
              {isToday ? (
                <span
                  className="font-mono text-[9px] font-bold"
                  style={{
                    letterSpacing: "0.8px",
                    color: selected ? "#fbe7d6" : "#e67e22",
                  }}
                >
                  hoy
                </span>
              ) : !isPast && dotColor && !selected ? (
                <span
                  className="block size-1.5 rounded-full"
                  style={{ background: dotColor }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-[18px] pt-2">
        <LegendDot color="#7c8a6a" label="Buena disponibilidad" />
        <LegendDot color="#d8a641" label="Capacidad limitada" />
        <LegendDot color="#c95a3d" label="Sin disponibilidad / cerrado" />
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="block size-[7px] rounded-full" style={{ background: color }} />
      <span className="text-[11px] text-[#6b4f3a]">{label}</span>
    </span>
  );
}
