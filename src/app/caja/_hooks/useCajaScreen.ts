"use client";

import { useState, useCallback } from "react";
import { useRealtimeEvents } from "@/lib/use-realtime-events";
import { createSale, todayServiceDate } from "@/lib/sales-client";
import type { Bill } from "../_lib/billing";
import type { SplitPart } from "../split-bill-modal";

export type PayMethod = "efectivo" | "tarjeta" | "transferencia" | "mixto";

export interface SessionUser {
  name: string;
  role: string | null;
  avatarInitials?: string | null;
}

export function useCajaScreen({
  bills,
  initialTableId,
  user,
}: {
  bills: Bill[];
  initialTableId?: string;
  user: SessionUser | null;
}) {
  // Sincronización en tiempo real vía SSE en caja
  useRealtimeEvents({
    events: ["sale:recorded", "table:status_updated", "order:status_updated"],
    refreshOnEvent: true,
  });

  const [selectedId, setSelectedId] = useState<string | null>(
    (initialTableId && bills.some((b) => b.tableId === initialTableId)
      ? initialTableId
      : bills[0]?.tableId) ?? null,
  );
  const [method, setMethod] = useState<PayMethod>("efectivo");
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [split, setSplit] = useState<{ parts: SplitPart[]; paidCount: number } | null>(
    null,
  );
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const selectedBill = bills.find((b) => b.tableId === selectedId) ?? null;

  const currentPart = split ? split.parts[split.paidCount] ?? null : null;
  const exactAmount = currentPart
    ? currentPart.amount.toFixed(2)
    : selectedBill
      ? selectedBill.total.toFixed(2)
      : "0.00";

  const handleApplySplit = (parts: SplitPart[]) => {
    const charging = parts.filter((p) => p.amount > 0.005);
    setSplitOpen(false);
    if (charging.length === 0) return;
    setSplit({ parts: charging, paidCount: 0 });
    setAmount(charging[0].amount.toFixed(2));
  };

  const cancelSplit = () => {
    setSplit(null);
    setAmount("");
    setPayError(null);
  };

  const handleSelectTable = (id: string) => {
    setSelectedId(id);
    setPayError(null);
  };

  const handleKey = (k: string) => {
    if (k === "←") {
      setAmount((prev) => prev.slice(0, -1));
    } else if (k === "C") {
      setAmount("");
    } else if (k === "." && amount.includes(".")) {
      return;
    } else if (amount.length >= 8) {
      return;
    } else {
      setAmount((prev) => prev + k);
    }
  };

  const handleQuick = (val: string) => setAmount(val);

  const handleConfirm = useCallback(async () => {
    if (!selectedBill || paying) return;

    if (split && split.paidCount + 1 < split.parts.length) {
      const nextPaid = split.paidCount + 1;
      setSplit({ parts: split.parts, paidCount: nextPaid });
      setAmount(split.parts[nextPaid].amount.toFixed(2));
      return;
    }

    setPaying(true);
    setPayError(null);
    try {
      await createSale({
        orderId: selectedBill.orderId ?? null,
        tableId: selectedBill.tableId,
        tableLabel: selectedBill.tableLabel,
        zoneName: selectedBill.zoneName,
        mesero: selectedBill.mesero,
        cashier: user?.name ?? null,
        method,
        subtotal: selectedBill.subtotal,
        iva: selectedBill.iva,
        total: selectedBill.total,
        items: selectedBill.lines.map((l) => ({
          menuItemId: l.menuItemId,
          qty: l.qty,
          name: l.name,
          mods: l.mods,
        })),
        serviceDate: todayServiceDate(),
      });
      setSplit(null);
      setDone(selectedBill.tableLabel);
    } catch (e) {
      console.error("[caja] transacción atómica de cobro failed", e);
      setPayError(e instanceof Error ? e.message : "Error al procesar el cobro en el servidor");
    } finally {
      setPaying(false);
    }
  }, [selectedBill, split, method, user, paying]);

  const handleNext = () => {
    setDone(null);
    setAmount("");
    setSplit(null);
    setPayError(null);
    const remaining = bills.filter((b) => b.tableId !== selectedId);
    setSelectedId(remaining[0]?.tableId ?? null);
  };

  return {
    selectedId,
    setSelectedId: handleSelectTable,
    selectedBill,
    method,
    setMethod,
    amount,
    exactAmount,
    done,
    splitOpen,
    setSplitOpen,
    split,
    paying,
    payError,
    handleApplySplit,
    cancelSplit,
    handleKey,
    handleQuick,
    handleConfirm,
    handleNext,
  };
}
