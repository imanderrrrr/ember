import React from "react";
import { PackageX, TriangleAlert, UserX } from "lucide-react";

export function AlertasCard() {
  const items = [
    {
      Icon: TriangleAlert,
      title: "Pedidos demorados · 3",
      sub: "Mesas 04, 09 y 12 superan 18 min",
      action: "Resolver",
    },
    {
      Icon: TriangleAlert,
      title: "Reservas sin confirmar · 2",
      sub: "Daniel Morán · Reserva 20:00",
      action: "Ver",
    },
    {
      Icon: UserX,
      title: "Mesas sin mesero · 1",
      sub: "Mesa 14 — asignar antes del próximo turno",
      action: "Asignar",
    },
    {
      Icon: PackageX,
      title: "Productos bajos · 4",
      sub: "Pollo, Vino tinto reserva, Lima, Brie",
      action: "Ver",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E8B07F] bg-white p-5.5 shadow-[0_4px_16px_rgba(107,79,58,0.08)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          ALERTAS OPERATIVAS
        </span>
        <span className="rounded-full bg-[#c2410c] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-[#FAF5EB]">
          4
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3">
            <it.Icon className="mt-0.5 size-4 shrink-0 text-[#C2410C]" strokeWidth={2} />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-sans text-[13px] font-semibold text-[#1F1F1F]">
                {it.title}
              </span>
              <span className="font-sans text-[11px] text-[#A89D8E]">
                {it.sub}
              </span>
            </div>
            <span className="font-sans text-[11px] font-semibold text-[#C2410C]">
              {it.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
