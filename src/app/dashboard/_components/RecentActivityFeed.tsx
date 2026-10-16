import React from "react";
import {
  ArrowRight,
  CalendarCheck,
  CircleCheck,
  Flame,
  Utensils,
} from "lucide-react";
import type { DashboardActivity } from "../_lib/dashboard-data";

const ACTIVITY_ICON: Record<
  DashboardActivity["kind"],
  { Icon: typeof Utensils; color: string }
> = {
  pedido: { Icon: Utensils, color: "#E67E22" },
  preparacion: { Icon: Flame, color: "#E67E22" },
  lista: { Icon: CircleCheck, color: "#7C8A6A" },
  entregada: { Icon: ArrowRight, color: "#A89D8E" },
  reserva: { Icon: CalendarCheck, color: "#E8B07F" },
};

interface RecentActivityFeedProps {
  events: DashboardActivity[];
}

export function RecentActivityFeed({ events }: RecentActivityFeedProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] bg-[#1F1F1F] p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      <div className="flex items-center gap-2.5">
        <span className="block size-2 rounded-full bg-[#7C8A6A] shadow-[0_0_6px_#7C8A6A]" />
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#A89D8E]">
          EN VIVO · ACTIVIDAD
        </span>
      </div>
      {events.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {events.map((e) => {
            const { Icon, color } = ACTIVITY_ICON[e.kind];
            return (
              <div key={e.id} className="flex items-start gap-2.5">
                <Icon
                  className="mt-0.5 size-3.5 shrink-0"
                  style={{ color }}
                  strokeWidth={2}
                />
                <span className="font-sans text-[12px] leading-snug text-[#FAF5EB]">
                  <span className="text-[#A89D8E]">{e.when} — </span>
                  {e.text}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <span className="font-sans text-[12px] text-[#A89D8E]">
          Sin actividad reciente en el servicio.
        </span>
      )}
    </div>
  );
}
