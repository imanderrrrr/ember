import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardReserva } from "../_lib/dashboard-data";

interface ReservasCardProps {
  reservas: DashboardReserva[];
  reservasHoy: number;
}

export function ReservasCard({ reservas, reservasHoy }: ReservasCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#EDE6DC] bg-white p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          RESERVAS PRÓXIMAS
        </span>
        <span className="rounded-full bg-[#FBE7D6] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-[#C2410C]">
          {reservasHoy} HOY
        </span>
      </div>
      {reservas.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {reservas.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <span className="flex size-[38px] items-center justify-center rounded-full bg-[#EDE6DC]">
                <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-[#6B4F3A]">
                  {it.ini}
                </span>
              </span>
              <div className="flex flex-1 flex-col">
                <span className="font-sans text-[13px] font-semibold text-[#1F1F1F]">
                  {it.name}
                </span>
                <span className="font-sans text-[11px] text-[#A89D8E]">
                  {it.meta}
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold ${
                  it.tone === "warn"
                    ? "bg-[#FBE7D6] text-[#C2410C]"
                    : "bg-[#EDE6DC] text-[#7C8A6A]"
                }`}
              >
                {it.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="font-sans text-[12px] text-[#A89D8E]">
          Sin reservas para hoy.
        </span>
      )}
      {reservasHoy > 0 && (
        <Link href="/reservas" className="flex items-center gap-1.5 pt-1.5">
          <span className="font-sans text-[12px] font-semibold text-[#C2410C]">
            Ver todas ({reservasHoy})
          </span>
          <ArrowRight className="size-3.5 text-[#C2410C]" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
