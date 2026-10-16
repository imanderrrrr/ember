import React from "react";
import { Banknote, ChefHat, DoorOpen } from "lucide-react";

export function EquipoCard() {
  const staff = [
    { ini: "CR", name: "Carla R.", role: "Mesera · Mesas 04, 09, 12", fill: 86, color: "#C2410C" },
    { ini: "JL", name: "Julián L.", role: "Mesero · Mesas 02, 06", fill: 60, color: "#E67E22" },
    { ini: "AS", name: "Andrea S.", role: "Mesera · Mesas 07, 11, 14", fill: 94, color: "#c2410c" },
    { ini: "PE", name: "Pablo E.", role: "Mesero · Mesas 03, 08, 13", fill: 75, color: "#E67E22" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#EDE6DC] bg-white p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          EQUIPO ACTIVO · 8 PERSONAS
        </span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#FBE7D6] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-[#C2410C]">
            T1
          </span>
          <span className="rounded-full bg-[#EDE6DC] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-[#6B4F3A]">
            T2
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {staff.map((s) => (
          <div key={s.ini} className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#EDE6DC]">
              <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-[#6B4F3A]">
                {s.ini}
              </span>
            </span>
            <div className="flex flex-1 flex-col">
              <span className="font-sans text-[13px] font-semibold">{s.name}</span>
              <span className="font-sans text-[11px] text-[#A89D8E]">{s.role}</span>
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#EDE6DC]">
              <div
                className="h-full rounded-full"
                style={{ width: `${s.fill}%`, background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2.5">
        <RoleChip Icon={ChefHat} label="Cocina · 2" />
        <RoleChip Icon={DoorOpen} label="Anfitrión · 1" />
        <RoleChip Icon={Banknote} label="Caja · 1" />
      </div>

      <div className="flex items-center gap-1.5 pt-1.5">
        <span className="font-sans text-[12px] font-semibold text-[#C2410C]">
          Ver staff
        </span>
      </div>
    </div>
  );
}

function RoleChip({
  Icon,
  label,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#FAF5EB] px-3 py-1.5">
      <Icon className="size-3 text-[#6B4F3A]" strokeWidth={2} />
      <span className="font-sans text-[11px] font-semibold text-[#1F1F1F]">
        {label}
      </span>
    </span>
  );
}
