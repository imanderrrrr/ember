"use client";

import React from "react";
import { formatQ, type BillLine } from "@/app/caja/_lib/billing";
import type { TableStatus } from "../_lib/types";
import { DrawerOrderStepper } from "./DrawerOrderStepper";

interface DrawerOrderSectionProps {
  orderLines: BillLine[];
  total: number;
  status: TableStatus;
}

export function DrawerOrderSection({
  orderLines,
  total,
  status,
}: DrawerOrderSectionProps) {
  return (
    <>
      <div className="flex flex-col gap-3.5 border-b border-[#EDE6DC] px-6 py-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          PEDIDO ACTUAL
        </span>
        <div className="flex flex-col gap-2.5">
          {orderLines.map((l, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] text-[#6B4F3A]">
                x{l.qty}
              </span>
              <span className="flex-1 text-[13px]">{l.name}</span>
              <span className="font-mono text-[12px] text-[#6B4F3A]">
                {l.unitPrice > 0 ? formatQ(l.lineTotal) : "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="h-px bg-[#EDE6DC]" />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-[0.12em]">
            TOTAL
          </span>
          <span className="font-mono text-[18px] font-semibold">
            {formatQ(total)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 border-b border-[#EDE6DC] px-6 py-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          ESTADO DEL PEDIDO
        </span>
        <DrawerOrderStepper status={status} />
      </div>
    </>
  );
}
