"use client";

import React from "react";
import { Calendar, Check, Sparkles, Square, Users } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import {
  findZone,
  recommendedTableForDraft,
  reservationsInZone,
} from "../_lib/zone-utils";
import { Sidebar2CapacityCard } from "./Sidebar2CapacityCard";

interface Sidebar2Props {
  draft: ReservationDraft;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}

export function Sidebar2({ draft, reservations, zones }: Sidebar2Props) {
  const fallbackZone = zones.find((z) => !z.disabled) ?? zones[0];
  const assignment = recommendedTableForDraft(zones, draft, reservations);
  const assignmentText = assignment
    ? `Mesa ${assignment.table.id} preasignada`
    : "Mesa por asignar";

  return (
    <aside className="flex h-fit w-[440px] shrink-0 flex-col gap-3.5 self-start rounded-2xl border border-[#ede6dc] bg-white p-[18px]">
      <div
        className="animate-r2-up flex items-end justify-between"
        style={{ animationDelay: "280ms" }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            RESUMEN DE LA RESERVA
          </span>
          <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
            Validando capacidad
          </span>
        </div>
        <span className="rounded-full border border-[#ede6dc] px-2.5 py-1">
          <span
            className="font-mono text-[10px] font-bold text-[#6b4f3a]"
            style={{ letterSpacing: "0.8px" }}
          >
            2 de 5
          </span>
        </span>
      </div>

      <span
        className="animate-r2-up h-px w-full bg-[#ede6dc]"
        style={{ animationDelay: "320ms" }}
      />

      {/* FECHA */}
      <div
        className="animate-r2-up flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
        style={{ animationDelay: "380ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="size-3.5 text-[#5b6e48]" strokeWidth={1.8} />
          <span
            className="font-mono text-[10px] font-bold text-[#5b6e48]"
            style={{ letterSpacing: "1.4px" }}
          >
            FECHA Y HORA
          </span>
          <span className="flex-1" />
          <span className="flex size-[18px] items-center justify-center rounded-full bg-[#7c8a6a]">
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </span>
        </div>
        <span
          className="font-mono text-[16px] font-bold text-[#1f1f1f]"
          style={{ letterSpacing: "-0.2px" }}
        >
          {draft.dateLabel} · {draft.timeSlot}
        </span>
        <span className="text-[12px] text-[#6b4f3a]">
          Duración 90 min · buffer 30 min
        </span>
      </div>

      {/* COMENSALES */}
      <div
        className="animate-r2-up flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
        style={{ animationDelay: "440ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Users className="size-3.5 text-[#5b6e48]" strokeWidth={1.8} />
          <span
            className="font-mono text-[10px] font-bold text-[#5b6e48]"
            style={{ letterSpacing: "1.4px" }}
          >
            COMENSALES
          </span>
          <span className="flex-1" />
          <span className="flex size-[18px] items-center justify-center rounded-full bg-[#7c8a6a]">
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </span>
        </div>
        <span
          className="font-mono text-[16px] font-bold text-[#1f1f1f]"
          style={{ letterSpacing: "-0.2px" }}
        >
          {draft.partySize} personas
        </span>
        <span className="text-[12px] text-[#6b4f3a]">
          Sugerencia: 1 trona infantil
        </span>
      </div>

      {/* CAPACIDAD */}
      {fallbackZone && (() => {
        const z = findZone(zones, draft.zoneName) ?? fallbackZone;
        const occupied = z.disabled
          ? z.total
          : reservationsInZone(reservations, z.name).length;
        const free = Math.max(0, z.total - occupied);
        const occupancyPct = z.total === 0 ? 0 : Math.round((occupied / z.total) * 100);
        return (
          <Sidebar2CapacityCard
            zone={z}
            free={free}
            occupancyPct={occupancyPct}
          />
        );
      })()}

      {/* MESA */}
      <div
        className="animate-r2-up flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
        style={{ animationDelay: "560ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Square className="size-3.5 text-[#a89d8e]" strokeWidth={1.8} />
          <span
            className="font-mono text-[10px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.4px" }}
          >
            MESA
          </span>
          <span className="flex-1" />
          <span
            className="font-mono text-[10px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "0.8px" }}
          >
            Paso 3
          </span>
        </div>
        <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
          {assignmentText}
        </span>
        <span className="text-[11px] text-[#6b4f3a]">
          Confirmar o cambiar en el paso 3
        </span>
      </div>

      {/* INSIGHT DEL DÍA */}
      <div
        className="animate-r2-up flex flex-col gap-3 rounded-xl bg-[#1f1f1f] p-4"
        style={{ animationDelay: "620ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-3.5 text-[#e8b07f]" strokeWidth={2} />
          <span
            className="font-mono text-[10px] font-bold text-[#e8b07f]"
            style={{ letterSpacing: "1.4px" }}
          >
            INSIGHT DEL DÍA
          </span>
        </div>
        <span className="font-mono text-[14px] font-bold leading-[1.3] text-white">
          La reserva entra en el turno de {draft.timeSlot}
        </span>
        <span className="text-[12px] leading-[1.45] text-[#d8cec2]">
          Se valida contra reservas existentes y capacidad real antes de confirmar
          la mesa.
        </span>
      </div>
    </aside>
  );
}
