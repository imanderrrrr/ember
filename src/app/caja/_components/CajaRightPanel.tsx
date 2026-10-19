"use client";

import Link from "next/link";
import { LayoutGrid, Printer } from "lucide-react";
import { formatQ, type Bill } from "../_lib/billing";
import { BillRow } from "./CajaLeftPanel";

export function CajaRightPanel({
  bill,
  bills,
  totalTables,
  homeHref,
}: {
  bill: Bill | null;
  bills: Bill[];
  totalTables: number;
  homeHref: string;
}) {
  const grandTotal = bills.reduce((a, b) => a + b.total, 0);
  const pendingCount = bills.length;

  return (
    <aside className="animate-salon-detail stagger-children flex flex-col gap-0 overflow-y-auto border-l border-[#d8cec2] bg-white">
      {/* Header */}
      <div className="border-b border-[#d8cec2] px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
            VISTA GENERAL
          </span>
          <span className="font-mono text-[10px] text-[#A89D8E]">
            {pendingCount} / {totalTables} mesas
          </span>
        </div>
      </div>

      {/* Dark total card */}
      <div className="mx-5 mt-5 rounded-[16px] bg-[#1F1F1F] p-5">
        <span className="font-mono text-[9px] font-semibold tracking-[0.18em] text-[#A89D8E]">
          TOTAL PENDIENTE DE COBRO
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-[16px] font-bold text-[#E8B07F]">
            Q
          </span>
          <span className="font-mono text-[38px] font-bold leading-none tracking-[-0.02em] text-[#FAF5EB]">
            {grandTotal.toFixed(2)}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#6B6660]">
              MESAS EN ESPERA
            </span>
            <span className="font-mono text-[11px] font-bold text-[#FAF5EB]">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#6B6660]">
              COMENSALES TOTALES
            </span>
            <span className="font-mono text-[11px] font-bold text-[#FAF5EB]">
              {bills.reduce((a, b) => a + b.partySize, 0)}p
            </span>
          </div>
        </div>
      </div>

      {/* Desglose de la mesa seleccionada */}
      {bill && (
        <div className="mx-5 mt-4 rounded-[14px] border border-[#EDE6DC] p-4">
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            DESGLOSE · MESA {bill.tableLabel}
          </span>
          <div className="mt-3 flex flex-col gap-2">
            <BillRow label="Subtotal" value={formatQ(bill.subtotal)} />
            <BillRow label="IVA (12%)" value={formatQ(bill.iva)} accent />
            <div className="h-px bg-[#EDE6DC]" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold">Total</span>
              <span className="font-mono text-[14px] font-bold">
                {bill.totalLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de todas las mesas pendientes */}
      {bills.length > 0 && (
        <div className="mx-5 mt-4 flex flex-col gap-2">
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            CUENTAS PENDIENTES
          </span>
          {bills.map((b) => (
            <div
              key={b.tableId}
              className={`flex items-center justify-between rounded-[10px] px-4 py-3 ${
                b.tableId === bill?.tableId
                  ? "border border-[#E67E22] bg-[#FBE7D6]"
                  : "border border-[#EDE6DC] bg-[#FAF5EB]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex size-7 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                    b.tableId === bill?.tableId
                      ? "bg-[#E67E22] text-white"
                      : "bg-[#EDE6DC] text-[#6B4F3A]"
                  }`}
                >
                  {b.tableLabel}
                </span>
                <span className="text-[12px] font-medium">{b.zoneName}</span>
              </div>
              <span className="font-mono text-[12px] font-bold">
                {b.totalLabel}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-auto flex flex-col gap-2 p-5">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-white py-2.5 text-[12.5px] font-medium text-[#1F1F1F] transition-colors hover:bg-[#F7F3EE]"
        >
          <Printer className="size-3.5" strokeWidth={1.8} />
          Imprimir pre-cuenta
        </button>
        <Link
          href={homeHref}
          className="flex items-center justify-center gap-2 rounded-[10px] bg-[#1F1F1F] py-3 text-[12.5px] font-semibold text-[#FAF5EB] transition-colors hover:bg-[#3a322c]"
        >
          <LayoutGrid className="size-3.5" strokeWidth={1.8} />
          Ver salón en vivo
        </Link>
      </div>
    </aside>
  );
}
