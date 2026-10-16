import React from "react";
import Link from "next/link";
import { ArrowRight, Info, Wallet } from "lucide-react";
import type { DashboardVentas } from "../_lib/dashboard-data";

interface CierreCardProps {
  ventas: DashboardVentas;
  cuentasPendientes: number;
}

export function CierreCard({ ventas, cuentasPendientes }: CierreCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#EDE6DC] bg-white p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="size-3.5 text-[#C2410C]" strokeWidth={2} />
          <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
            CIERRE DE CAJA
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBE7D6] px-2.5 py-1">
          <span className="block size-1.5 rounded-full bg-[#C2410C] shadow-[0_0_5px_rgba(194,65,12,0.4)]" />
          <span className="font-sans text-[10px] font-semibold text-[#C2410C]">
            Turno en curso
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <KeyValRow label="Ventas del turno" value={ventas.totalLabel} />
        <KeyValRow label="Pagos registrados" value={String(ventas.count)} />
        <KeyValRow
          label="Cuentas pendientes"
          value={String(cuentasPendientes)}
          valueColor={cuentasPendientes > 0 ? "#C2410C" : undefined}
        />
        <div className="flex items-center justify-between">
          <span className="font-sans text-[12.5px] text-[#6B4F3A]">
            Diferencia preliminar
          </span>
          <span className="font-sans text-[11.5px] font-medium italic text-[#A89D8E]">
            Pendiente de conteo
          </span>
        </div>
      </div>

      <div className="h-px bg-[#EDE6DC]" />

      <p className="font-sans text-[11.5px] leading-snug text-[#A89D8E]">
        Revisa ventas, pagos y efectivo antes de finalizar.
      </p>

      <Link
        href="/caja/cierre"
        className="flex items-center justify-center gap-2.5 rounded-[10px] bg-[#1F1F1F] px-4.5 py-3.5 shadow-[0_6px_14px_rgba(31,31,31,0.1)] hover:bg-[#0e0a08]"
      >
        <span className="block size-1.5 rounded-full bg-[#E67E22]" />
        <span className="font-jakarta text-[13.5px] font-semibold text-[#FAF5EB]">
          Cerrar caja
        </span>
        <ArrowRight className="size-3.5 text-[#FAF5EB]" strokeWidth={2} />
      </Link>

      {cuentasPendientes > 0 && (
        <div className="flex items-center gap-1.5">
          <Info className="size-2.5 text-[#C2410C]" strokeWidth={2.5} />
          <span className="font-sans text-[11px] font-medium text-[#6B4F3A]">
            Hay cuentas pendientes
          </span>
        </div>
      )}
    </div>
  );
}

function KeyValRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-[12.5px] text-[#6B4F3A]">{label}</span>
      <span
        className="font-mono text-[13.5px] font-semibold"
        style={{ color: valueColor || "#1F1F1F" }}
      >
        {value}
      </span>
    </div>
  );
}
