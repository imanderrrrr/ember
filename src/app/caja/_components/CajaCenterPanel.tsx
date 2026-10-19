"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Delete,
  Receipt,
  Smartphone,
  Split,
  Wallet,
} from "lucide-react";
import { formatQ, type Bill } from "../_lib/billing";
import type { SplitPart } from "../split-bill-modal";
import type { PayMethod } from "../_hooks/useCajaScreen";

export const METHOD_LABELS: Record<PayMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  mixto: "Mixto",
};

export const METHOD_ICONS: Record<PayMethod, React.ReactNode> = {
  efectivo: <Banknote className="size-5" strokeWidth={1.8} />,
  tarjeta: <CreditCard className="size-5" strokeWidth={1.8} />,
  transferencia: <Smartphone className="size-5" strokeWidth={1.8} />,
  mixto: <Wallet className="size-5" strokeWidth={1.8} />,
};

export const QUICK_AMOUNTS = ["Q50", "Q100", "Q200", "Q500", "Exacto"];

export const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "←"],
];

export function CajaCenterPanel({
  bill,
  method,
  onMethod,
  amount,
  exactAmount,
  onKey,
  onQuick,
  onConfirm,
  onSplit,
  cancelHref,
  split,
  paying,
  payError,
}: {
  bill: Bill | null;
  method: PayMethod;
  onMethod: (m: PayMethod) => void;
  amount: string;
  exactAmount: string;
  onKey: (k: string) => void;
  onQuick: (v: string) => void;
  onConfirm: () => void;
  onSplit: () => void;
  cancelHref: string;
  split: { parts: SplitPart[]; paidCount: number } | null;
  paying?: boolean;
  payError?: string | null;
}) {
  const displayAmount = amount || exactAmount;
  const partNo = split ? split.paidCount + 1 : 0;
  const confirmLabel = !bill
    ? "Confirmar cobro"
    : split
      ? `Cobrar parte ${partNo} de ${split.parts.length} · ${formatQ(Number(displayAmount))}`
      : `Confirmar cobro ${formatQ(Number(displayAmount))}`;

  return (
    <section className="animate-salon-main flex flex-col gap-0 overflow-y-auto bg-[#F2F3F0]">
      {/* Title strip */}
      <div className="flex items-center justify-between border-b border-[#d8cec2] bg-white px-7 py-5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            {split ? "COBRO DIVIDIDO" : "PROCESAR PAGO"}
          </span>
          <span className="text-[20px] font-bold leading-tight">
            {!bill
              ? "Selecciona una mesa"
              : split
                ? `Cobrar parte ${partNo} de ${split.parts.length} · Mesa ${bill.tableLabel}`
                : `Mesa ${bill.tableLabel} · ${bill.zoneName}`}
          </span>
        </div>
        {bill && (
          <span className="rounded-full bg-[#FBE7D6] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-[#C2410C]">
            {split
              ? `${split.parts[split.paidCount]?.label ?? "Parte"} · ${partNo}/${split.parts.length}`
              : "ESPERANDO CUENTA"}
          </span>
        )}
      </div>

      <div className="stagger-children flex flex-1 flex-col gap-5 p-7">
        {/* Payment methods */}
        <div className="grid grid-cols-4 gap-2.5">
          {(["efectivo", "tarjeta", "transferencia", "mixto"] as PayMethod[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => onMethod(m)}
                className={`flex flex-col items-center justify-center gap-2 rounded-[14px] py-4 transition-colors ${
                  method === m
                    ? "bg-[#1F1F1F] text-[#FAF5EB]"
                    : "border border-[#d8cec2] bg-white text-[#6B4F3A] hover:bg-[#F7F3EE]"
                }`}
              >
                <span
                  className={
                    method === m ? "text-[#E67E22]" : "text-[#6B4F3A]"
                  }
                >
                  {METHOD_ICONS[m]}
                </span>
                <span className="text-[11.5px] font-medium">
                  {METHOD_LABELS[m]}
                </span>
              </button>
            ),
          )}
        </div>

        {/* Amount display */}
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#d8cec2] bg-white py-7">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B6660]">
            MONTO A COBRAR
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-bold text-[#6B4F3A]">
              Q
            </span>
            <span className="font-mono text-[52px] font-bold leading-none tracking-[-0.02em]">
              {displayAmount}
            </span>
          </div>
          {amount && Number(amount) > Number(exactAmount) && (
            <span className="font-mono text-[11px] text-[#7C8A6A]">
              Vuelto: {formatQ(Number(amount) - Number(exactAmount))}
            </span>
          )}
          {!amount && (
            <span className="font-mono text-[11px] text-[#A89D8E]">
              Monto exacto · toca un número para cambiar
            </span>
          )}
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-5 gap-2">
          {QUICK_AMOUNTS.map((q) => {
            const isExacto = q === "Exacto";
            const val = isExacto
              ? exactAmount
              : q.replace("Q", "").replace(",", "");
            const isActive =
              (isExacto && !amount) || (!isExacto && amount === val);
            return (
              <button
                key={q}
                onClick={() => (isExacto ? onQuick("") : onQuick(val))}
                className={`rounded-[10px] py-2.5 font-mono text-[12px] font-medium transition-colors ${
                  isActive
                    ? "bg-[#1F1F1F] text-white"
                    : "border border-[#d8cec2] bg-white text-[#1F1F1F] hover:bg-[#F7F3EE]"
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>

        {/* Numpad */}
        <div className="flex flex-col gap-2">
          {NUMPAD_KEYS.map((row, ri) => (
            <div key={ri} className="grid grid-cols-3 gap-2">
              {row.map((k) => (
                <button
                  key={k}
                  onClick={() => onKey(k)}
                  className={`flex items-center justify-center rounded-[12px] py-4 font-mono text-[20px] font-semibold transition-colors ${
                    k === "←"
                      ? "border border-[#d8cec2] bg-white text-[#6B4F3A] hover:bg-[#F2F3F0]"
                      : "border border-[#d8cec2] bg-white hover:bg-[#F2F3F0]"
                  }`}
                >
                  {k === "←" ? (
                    <Delete className="size-5" strokeWidth={1.8} />
                  ) : (
                    k
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {payError && (
          <div className="flex items-center gap-2 rounded-[10px] border border-[#F87171] bg-[#FEF2F2] px-4 py-2.5 text-[12px] text-[#B91C1C]">
            <AlertCircle className="size-4 shrink-0 text-[#DC2626]" />
            <span>{payError}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => onKey("C")}
            className="rounded-[10px] border border-[#d8cec2] bg-white px-5 py-3 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
          >
            Limpiar
          </button>
          <button
            onClick={onSplit}
            disabled={!bill || paying}
            className="flex items-center gap-2 rounded-[10px] border border-[#1F1F1F] bg-white px-5 py-3 text-[12px] font-semibold text-[#1F1F1F] transition-colors hover:bg-[#F7F3EE] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Split className="size-4" strokeWidth={1.9} />
            Dividir cuenta
          </button>
          <div className="flex-1" />
          <Link
            href={cancelHref}
            className="rounded-[10px] border border-[#d8cec2] bg-white px-5 py-3 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
          >
            Cancelar
          </Link>
          <button
            onClick={onConfirm}
            disabled={!bill || paying}
            className="flex items-center gap-2.5 rounded-[10px] bg-[#E67E22] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(230,126,34,0.3)] transition-colors hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Receipt className="size-4" strokeWidth={2} />
            {paying ? "Procesando cobro..." : confirmLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
