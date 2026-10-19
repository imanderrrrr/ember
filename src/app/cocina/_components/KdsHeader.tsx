"use client";

import Link from "next/link";
import { Bell, Flame, LayoutGrid, Search } from "lucide-react";
import { UserMenu } from "@/app/dashboard/user-menu";

export function KdsHeader({
  dateLabel,
  timeLabel,
}: {
  dateLabel: string;
  timeLabel: string;
}) {
  return (
    <header className="flex h-[97px] shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-10">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3.5">
          <span className="font-jakarta text-[22px] font-bold tracking-[0.18em] text-[#C2410C]">
            EMBER
          </span>
          <span className="h-[18px] w-px bg-[#D8CEC2]" />
          <span className="text-[16px] font-semibold">Casa Olivar</span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#1F1F1F] px-2.5 py-1">
            <Flame className="size-3 text-[#E67E22]" strokeWidth={2} />
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#FAF5EB]">
              COCINA EN VIVO
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] tracking-[0.12em] text-[#6B4F3A]">
            {dateLabel} · {timeLabel}
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="font-mono text-[11px] tracking-[0.12em] text-[#6B4F3A]">
            TURNO CENA · T2
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
            <span className="text-[11px] font-semibold text-[#7c8a6a]">
              Servicio activo · brigada en línea
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex w-[240px] items-center gap-2 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3.5 py-2.5">
          <Search className="size-[13px] text-[#A89D8E]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#A89D8E]">
            Buscar mesa, comanda, platillo...
          </span>
        </div>
        <button
          type="button"
          className="flex size-[38px] items-center justify-center rounded-[10px] border border-[#EDE6DC] bg-white transition-colors hover:bg-[#F7F3EE]"
        >
          <Bell className="size-[15px] text-[#1F1F1F]" strokeWidth={1.8} />
        </button>
        <UserMenu />
        <Link
          href="/salon"
          className="flex items-center gap-2.5 rounded-[10px] bg-[#1F1F1F] px-[18px] py-3 shadow-[0_6px_14px_rgba(31,31,31,0.1)] transition-opacity hover:opacity-90"
        >
          <LayoutGrid className="size-3.5 text-[#FAF5EB]" strokeWidth={1.8} />
          <span className="text-[13px] font-semibold text-[#FAF5EB]">
            Ir al salón en vivo
          </span>
        </Link>
      </div>
    </header>
  );
}
