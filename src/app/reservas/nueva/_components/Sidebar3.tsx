"use client";

import React from "react";
import { Bell, Calendar, Clock, Square, Users } from "lucide-react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { findZone, reservationsInZone } from "../_lib/zone-utils";
import { SideStepConfirmed, SideStepPending } from "./SideStepItems";
import { Sidebar3ActiveCard } from "./Sidebar3ActiveCard";
import { Sidebar3Preview } from "./Sidebar3Preview";

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

interface Sidebar3Props {
  draft: ReservationDraft;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}

export function Sidebar3({ draft, reservations, zones }: Sidebar3Props) {
  const fallbackZone = zones.find((z) => !z.disabled) ?? zones[0];
  if (!fallbackZone) return null;

  const z = findZone(zones, draft.zoneName) ?? fallbackZone;
  const tableId = draft.tableLabel ?? z.recommendation?.tableId ?? "—";
  const isRecommended =
    z.recommendation?.tableId === draft.tableLabel ||
    (draft.tableLabel === null && z.recommendation !== null);

  const occupied = z.disabled
    ? z.total
    : reservationsInZone(reservations, z.name).length;
  const free = Math.max(0, z.total - occupied);
  const pct = z.total === 0 ? 0 : Math.round((occupied / z.total) * 100);

  return (
    <aside className="flex h-fit w-[440px] shrink-0 flex-col gap-3.5 self-start rounded-2xl border border-[#ede6dc] bg-white p-[18px]">
      <div
        className="animate-r3-up flex flex-col gap-2"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            RESUMEN DE LA RESERVA
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#e67e22] px-2.5 py-1">
            <span className="block size-1.5 rounded-full bg-white" />
            <span className="text-[10px] font-semibold text-white">
              Construyendo · 60% completado
            </span>
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#fbe7d6]">
          <span
            className="animate-r2-progress absolute left-0 top-0 block h-full rounded-full bg-[#e67e22]"
            style={
              {
                animationDelay: "800ms",
                ["--r2-progress-target" as string]: "60%",
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/* PASO 1 — FECHA Y HORA */}
      <SideStepConfirmed
        delay="380ms"
        eyebrow="PASO 1 · FECHA Y HORA"
        actionLabel="Cambiar"
        rows={[
          { icon: Calendar, text: `${draft.dateLabel} 2026` },
          { icon: Clock, text: `${draft.timeSlot} — ${incHours(draft.timeSlot, 3, 30)} (estimado)` },
          { icon: Users, text: `${draft.partySize} personas` },
        ]}
      />

      {/* PASO 2 — DISPONIBILIDAD */}
      <SideStepConfirmed
        delay="440ms"
        eyebrow="PASO 2 · DISPONIBILIDAD"
        actionLabel="Cambiar"
        rows={[
          { icon: Square, text: `${z.name} · ${free} libres de ${z.total}` },
          { icon: Bell, text: `${pct}% ocupación · sin conflictos` },
        ]}
      />

      {/* PASO 3 — MESA Y ZONA */}
      <Sidebar3ActiveCard
        zone={z}
        tableId={tableId}
        partySize={draft.partySize}
        isRecommended={isRecommended}
      />

      {/* PASO 4 — CLIENTE */}
      <SideStepPending
        delay="560ms"
        eyebrow="PASO 4 · CLIENTE"
        primary="Cliente sin asignar"
        secondary="Se pide en el paso 4 del wizard"
        rows={["Sin nombre aún", "Sin contacto registrado"]}
      />

      {/* PASO 5 — CONFIRMACIÓN */}
      <SideStepPending
        delay="620ms"
        eyebrow="PASO 5 · CONFIRMACIÓN"
        primary="Notificación pendiente"
        secondary="Configurarás canal y mensaje en el paso final"
        rows={[]}
      />

      {/* Calendar preview + Shortcuts */}
      <Sidebar3Preview
        timeSlot={draft.timeSlot}
        partySize={draft.partySize}
        zoneShortName={z.shortName}
        tableId={tableId}
      />
    </aside>
  );
}
