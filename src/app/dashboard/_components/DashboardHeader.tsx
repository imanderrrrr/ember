"use client";

import Link from "next/link";
import { ArrowRight, Bell, MapPin, Search, Wallet } from "lucide-react";
import { UserMenu } from "../user-menu";

interface DashboardHeaderProps {
  fecha: string;
  cuentasPendientes: number;
}

export function DashboardHeader({
  fecha,
  cuentasPendientes,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-6 border-b border-[#EDE6DC] bg-white px-10 py-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3.5">
          <span className="font-jakarta text-[22px] font-bold tracking-[0.14em] text-[#C2410C]">
            EMBER
          </span>
          <span className="h-[18px] w-px bg-[#D8CEC2]" />
          <span className="font-jakarta text-[16px] font-semibold text-[#1F1F1F]">
            Casa Olivar
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
            <MapPin className="size-3 text-[#6B4F3A]" strokeWidth={2} />
            <span className="font-jakarta text-[11px] font-medium text-[#6B4F3A]">
              CDMX · Polanco
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#6B4F3A]">
            {fecha}
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#6B4F3A]">
            TURNO CENA · T2
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="flex items-center gap-1.5">
            <span className="block size-1.5 rounded-full bg-[#7C8A6A] shadow-[0_0_8px_rgba(124,138,106,0.7)]" />
            <span className="font-mono text-[11px] tracking-[0.1em] text-[#7C8A6A]">
              SERVICIO EN VIVO
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-end gap-3.5">
        <div className="flex h-[38px] items-center gap-2 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3.5">
          <Search className="size-[13px] text-[#A89D8E]" strokeWidth={2} />
          <span className="font-jakarta text-[12px] text-[#A89D8E]">
            Buscar mesa, reserva, ticket...
          </span>
        </div>

        <button
          type="button"
          aria-label="Notificaciones"
          className="flex size-[38px] items-center justify-center rounded-[10px] border border-[#EDE6DC] bg-white text-[#1F1F1F] hover:bg-[#F7F3EE]"
        >
          <Bell className="size-[15px]" strokeWidth={1.8} />
        </button>

        <UserMenu />

        <div className="flex flex-col items-end gap-1.5">
          <Link
            href="/caja"
            className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#C2410C] bg-white px-4 py-2.5 hover:bg-[#FBE7D6]"
          >
            <Wallet className="size-[13px] text-[#C2410C]" strokeWidth={2} />
            <span className="font-jakarta text-[12px] font-semibold text-[#C2410C]">
              Cobrar cuentas
            </span>
          </Link>
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.12em] text-[#C2410C]">
            {cuentasPendientes}{" "}
            {cuentasPendientes === 1 ? "CUENTA PENDIENTE" : "CUENTAS PENDIENTES"}
          </span>
        </div>

        <Link
          href="/salon"
          className="flex items-center gap-2.5 rounded-[10px] bg-[#1F1F1F] px-4.5 py-3 shadow-[0_6px_14px_rgba(31,31,31,0.1)] hover:bg-[#0e0a08]"
        >
          <span className="block size-1.5 rounded-full bg-[#E67E22]" />
          <span className="font-jakarta text-[13px] font-semibold text-[#FAF5EB]">
            Ir al salón en vivo
          </span>
          <ArrowRight className="size-[14px] text-[#FAF5EB]" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
