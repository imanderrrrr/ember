"use client";

import { Calendar } from "lucide-react";
import { ShortcutBtn } from "./SideStepItems";

interface Sidebar3PreviewProps {
  timeSlot: string;
  partySize: number;
  zoneShortName: string;
  tableId: string;
}

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

export function Sidebar3Preview({
  timeSlot,
  partySize,
  zoneShortName,
  tableId,
}: Sidebar3PreviewProps) {
  return (
    <>
      <div
        className="animate-r3-up flex flex-col gap-2"
        style={{ animationDelay: "680ms" }}
      >
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          VISTA PREVIA EN EL CALENDARIO
        </span>
        <div className="flex overflow-hidden rounded-xl border border-[#ede6dc] bg-[#fbe7d6]">
          <span className="block w-1 self-stretch bg-[#e67e22]" />
          <div className="flex flex-1 flex-col gap-1 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] font-semibold text-[#1f1f1f]">
                {timeSlot} — {incHours(timeSlot, 3, 30)} · {partySize}p
              </span>
              <Calendar className="size-3 text-[#7a2e14]" strokeWidth={1.8} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#6b4f3a]">
                {zoneShortName} · {tableId}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-[#a89d8e]">
          Así se verá en el calendario semanal
        </span>
      </div>

      <div
        className="animate-r3-up flex flex-col gap-2 pt-1"
        style={{ animationDelay: "760ms" }}
      >
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          ATAJOS DEL PASO
        </span>
        <ShortcutBtn icon="refresh" label="Reasignar mesa automáticamente" />
        <ShortcutBtn icon="user" label="Usar última mesa de este cliente" />
        <ShortcutBtn icon="cake" label="Aplicar plantilla de aniversario" />
      </div>
    </>
  );
}
