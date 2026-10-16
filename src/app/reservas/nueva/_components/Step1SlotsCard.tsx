"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { reservationsAtSlot } from "../_lib/zone-utils";
import type { ReservationDTO } from "../_lib/client-api";
import { SlotCell } from "./SlotCell";

const SLOT_TIMES = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
];

interface Step1SlotsCardProps {
  timeSlot: string;
  partySize: number;
  reservations: ReservationDTO[];
  totalOpenTables: number;
  onSelectSlot: (slot: string) => void;
}

export function Step1SlotsCard({
  timeSlot,
  partySize,
  reservations,
  totalOpenTables,
  onSelectSlot,
}: Step1SlotsCardProps) {
  const [shift, setShift] = useState<"almuerzo" | "cena">("cena");

  const slots = SLOT_TIMES.map((time) => {
    const occupied = reservationsAtSlot(reservations, time).length;
    const free = Math.max(0, totalOpenTables - occupied);
    const tone: "good" | "limited" | "closed" =
      totalOpenTables === 0
        ? "good"
        : free === 0
          ? "closed"
          : free <= 4
            ? "limited"
            : "good";
    const note =
      totalOpenTables === 0
        ? "Cargando…"
        : free === 0
          ? "Sin disponibilidad"
          : `${free} ${free === 1 ? "mesa libre" : "mesas libres"}`;
    return { time, note, tone };
  });

  return (
    <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-[#ede6dc] bg-white p-5">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            HORARIO DEL TURNO
          </span>
          <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
            Selecciona la franja de entrada
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShift("almuerzo")}
            className="rounded-full px-3 py-1.5"
            style={{
              background: shift === "almuerzo" ? "#1f1f1f" : "#FFFFFF",
              border: shift === "almuerzo" ? "none" : "1px solid #ede6dc",
            }}
          >
            <span
              className="text-[12px] font-semibold"
              style={{
                color: shift === "almuerzo" ? "#FFFFFF" : "#a89d8e",
              }}
            >
              Almuerzo
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShift("cena")}
            className="rounded-full px-3 py-1.5"
            style={{
              background: shift === "cena" ? "#1f1f1f" : "#FFFFFF",
              border: shift === "cena" ? "none" : "1px solid #ede6dc",
            }}
          >
            <span
              className="text-[12px] font-semibold"
              style={{
                color: shift === "cena" ? "#FFFFFF" : "#a89d8e",
              }}
            >
              Cena
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2.5">
          {slots.slice(0, 5).map((s) => (
            <SlotCell
              key={s.time}
              time={s.time}
              note={s.note}
              tone={s.tone}
              selected={s.time === timeSlot}
              onClick={() => onSelectSlot(s.time)}
            />
          ))}
        </div>
        <div className="flex gap-2.5">
          {slots.slice(5).map((s) => (
            <SlotCell
              key={s.time}
              time={s.time}
              note={s.note}
              tone={s.tone}
              selected={s.time === timeSlot}
              onClick={() => onSelectSlot(s.time)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-lg border border-[#ede6dc] bg-[#f7f3ee] px-3.5 py-2.5">
        <Info className="size-3.5 text-[#7c8a6a]" strokeWidth={1.8} />
        <span className="text-[12px] text-[#6b4f3a]">
          La duración del turno se ajusta automáticamente a 90 min para{" "}
          {partySize} comensales. Puedes pedir extensión en el paso 4.
        </span>
      </div>
    </section>
  );
}
