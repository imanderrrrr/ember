"use client";

import { CalendarClock, Lightbulb, Square, User, Users } from "lucide-react";
import type { ReservationDraft } from "../_lib/types";
import { TOTAL_STEPS } from "../_lib/wizard-constants";
import {
  ShortcutRow,
  SummaryCardConfirmed,
  SummaryCardPending,
} from "./SummaryCardItems";

interface ReservationSummarySidebarProps {
  draft: ReservationDraft;
  step: number;
}

export function ReservationSummarySidebar({
  draft,
  step,
}: ReservationSummarySidebarProps) {
  const tablePrimary = draft.tableLabel ? `Mesa ${draft.tableLabel}` : "Por asignar";
  const tableSecondary = draft.zoneName
    ? draft.zoneName
    : "Se asigna en el paso 3";
  const tableStepLabel = draft.tableLabel ? "Preseleccionada" : "Paso 3";

  return (
    <aside className="flex h-fit w-[440px] shrink-0 flex-col gap-3.5 self-start rounded-2xl border border-[#ede6dc] bg-white p-[18px]">
      {/* Head */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            RESUMEN DE LA RESERVA
          </span>
          <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
            Borrador en curso
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[#ede6dc] px-2.5 py-1">
          <span
            className="font-mono text-[10px] font-bold text-[#6b4f3a]"
            style={{ letterSpacing: "0.8px" }}
          >
            {step} de {TOTAL_STEPS}
          </span>
        </span>
      </div>

      <span className="h-px w-full bg-[#ede6dc]" />

      {/* Fecha y hora — confirmado */}
      <SummaryCardConfirmed
        icon={CalendarClock}
        eyebrow="FECHA Y HORA"
        primary={`${draft.dateLabel} · ${draft.timeSlot}`}
        secondary="Turno cena · duración 90 min"
      />

      {/* Comensales — confirmado */}
      <SummaryCardConfirmed
        icon={Users}
        eyebrow="COMENSALES"
        primary={`${draft.partySize} ${draft.partySize === 1 ? "persona" : "personas"}`}
        secondary="Sugerencia: 1 trona infantil"
      />

      {/* Mesa — pendiente */}
      <SummaryCardPending
        icon={Square}
        eyebrow="MESA"
        primary={tablePrimary}
        secondary={tableSecondary}
        stepLabel={tableStepLabel}
      />

      {/* Cliente — pendiente */}
      <SummaryCardPending
        icon={User}
        eyebrow="CLIENTE"
        primary="Pendiente"
        secondary=""
        stepLabel="Paso 4"
      />

      {/* Tips card — dato del turno */}
      <div className="flex flex-col gap-3 rounded-xl bg-[#1f1f1f] p-4">
        <div className="flex items-center gap-2.5">
          <Lightbulb className="size-3.5 text-[#e8b07f]" strokeWidth={2} />
          <span
            className="font-mono text-[10px] font-bold text-[#e8b07f]"
            style={{ letterSpacing: "1.4px" }}
          >
            DATO DEL TURNO
          </span>
        </div>
        <span
          className="font-mono text-[14px] font-bold leading-[1.3] text-white"
          style={{ letterSpacing: "0px" }}
        >
          {draft.timeSlot} es la franja seleccionada para {draft.dateLabel}
        </span>
        <span className="text-[12px] leading-[1.45] text-[#d8cec2]">
          La disponibilidad se recalcula con el plano del salón y las reservas
          guardadas en backend para evitar dobles asignaciones.
        </span>
      </div>

      {/* Shortcuts */}
      <div className="flex flex-col gap-1.5 px-0.5 pt-1.5">
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          ATAJOS
        </span>
        <ShortcutRow keys="←  →" label="navegar entre días" />
        <ShortcutRow keys="+ / −" label="ajustar comensales" />
        <ShortcutRow keys="⏎" label="continuar a Disponibilidad" />
      </div>
    </aside>
  );
}
