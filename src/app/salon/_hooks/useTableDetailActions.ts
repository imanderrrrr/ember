"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SalonTable, TableStatus } from "../_lib/types";
import { STATUS_COLOR } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { updateTable } from "../_lib/client-api";
import { createKitchenOrder } from "@/app/cocina/_lib/orders";
import type { CartLine } from "../_lib/menu";
import type { Bill } from "@/app/caja/_lib/billing";

interface UseTableDetailActionsProps {
  table: SalonTable;
  zoneName: string | null;
  bill: Bill | null;
  initialReservations: ReservationDTO[];
}

export function useTableDetailActions({
  table,
  zoneName,
  bill,
  initialReservations,
}: UseTableDetailActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState<TableStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TableStatus>(() => table.status);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);

  const nextReservation = initialReservations[0] ?? null;
  const displayStatus =
    nextReservation && status === "libre" ? "reservada" : status;
  const statusColor = STATUS_COLOR[displayStatus];

  const setStatusTo = async (next: TableStatus) => {
    if (next === status || saving) return;
    setError(null);
    setSaving(next);
    setStatus(next);
    try {
      await updateTable(table.id, { status: next });
      startTransition(() => router.refresh());
    } catch (e) {
      console.error("[salon] updateTable failed", e);
      setStatus(table.status);
      setError("No se pudo guardar el cambio");
    } finally {
      setSaving(null);
    }
  };

  const handleSendToKitchen = async (cartLines?: CartLine[]) => {
    if (saving) return;
    setError(null);
    setSaving("cocina");
    try {
      if (cartLines && cartLines.length > 0) {
        await createKitchenOrder({
          tableId: table.id,
          tableLabel: table.label,
          zoneName: zoneName ?? "Salón",
          partySize: table.partySize ?? table.seats,
          mesero: bill?.mesero ?? "Salón",
          items: cartLines.map((l) => ({
            menuItemId: l.productId,
            qty: l.qty,
            name: l.name,
          })),
        });
      }
      await updateTable(table.id, { status: "cocina" });
      setStatus("cocina");
      setOrderModalOpen(false);
      startTransition(() => router.refresh());
    } catch (e) {
      console.error("[salon] send-to-kitchen failed", e);
      setError("No se pudo enviar a cocina");
    } finally {
      setSaving(null);
    }
  };

  return {
    saving,
    error,
    status,
    displayStatus,
    statusColor,
    nextReservation,
    orderModalOpen,
    setOrderModalOpen,
    reservationModalOpen,
    setReservationModalOpen,
    setStatusTo,
    handleSendToKitchen,
  };
}
