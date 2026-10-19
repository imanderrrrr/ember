"use client";

import React from "react";
import { MousePointerClick, TriangleAlert } from "lucide-react";
import type { SalonTable } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import type { Bill } from "@/app/caja/_lib/billing";
import { OrderModal } from "../order-modal";
import { SalonReservationsModal } from "./SalonReservationsModal";
import { reservationsForTable } from "../_lib/table-utils";
import { useTableDetailActions } from "../_hooks/useTableDetailActions";
import { DrawerHeader } from "./DrawerHeader";
import { DrawerReservationsSection } from "./DrawerReservationsSection";
import { DrawerOrderSection } from "./DrawerOrderSection";
import { DrawerQuickActions } from "./DrawerQuickActions";

interface SalonTableDetailDrawerProps {
  table: SalonTable | null;
  reservations: ReservationDTO[];
  zoneName: string | null;
  serviceDate: string;
  bill: Bill | null;
  onClose: () => void;
}

export function SalonTableDetailDrawer({
  table,
  reservations,
  zoneName,
  serviceDate,
  bill,
  onClose,
}: SalonTableDetailDrawerProps) {
  if (!table) {
    return (
      <aside className="animate-salon-detail flex w-[344px] flex-col items-center justify-center gap-3 border-l border-[#EDE6DC] bg-[#F7F3EE] px-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(31,31,31,0.06)]">
          <MousePointerClick
            className="size-5 text-[#6B4F3A]"
            strokeWidth={1.8}
          />
        </span>
        <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#6B4F3A]">
          NINGUNA MESA SELECCIONADA
        </span>
        <p className="max-w-[240px] text-[12px] leading-[1.55] text-[#6B6660]">
          Toca una mesa en el plano para ver su ficha rápida y cambiar su estado.
        </p>
      </aside>
    );
  }

  return (
    <TableDetailContent
      key={table.id}
      table={table}
      zoneName={zoneName}
      serviceDate={serviceDate}
      initialReservations={reservationsForTable(reservations, table, zoneName)}
      bill={bill}
      onClose={onClose}
    />
  );
}

interface TableDetailContentProps {
  table: SalonTable;
  zoneName: string | null;
  serviceDate: string;
  initialReservations: ReservationDTO[];
  bill: Bill | null;
  onClose: () => void;
}

function TableDetailContent({
  table,
  zoneName,
  serviceDate,
  initialReservations,
  bill,
  onClose,
}: TableDetailContentProps) {
  const orderLines = bill?.lines ?? [];
  const {
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
  } = useTableDetailActions({
    table,
    zoneName,
    bill,
    initialReservations,
  });

  const inService =
    status === "ocupada" || status === "cocina" || status === "esperando";
  const hasOrder = inService && orderLines.length > 0;

  return (
    <aside className="animate-salon-detail stagger-children flex w-[344px] flex-col overflow-y-auto border-l border-[#EDE6DC] bg-[#F7F3EE]">
      <DrawerHeader
        table={table}
        displayStatus={displayStatus}
        statusColor={statusColor}
        nextReservation={nextReservation}
        onClose={onClose}
      />

      <DrawerReservationsSection
        nextReservation={nextReservation}
        serviceDate={serviceDate}
        onOpenModal={() => setReservationModalOpen(true)}
      />

      {hasOrder && (
        <DrawerOrderSection
          orderLines={orderLines}
          total={bill?.total ?? 0}
          status={displayStatus}
        />
      )}

      {table.notes && (
        <div className="flex flex-col gap-2.5 border-b border-[#EDE6DC] px-6 py-5">
          <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
            NOTAS
          </span>
          <div className="flex gap-2.5 rounded-lg bg-[#D8CEC2] px-3.5 py-3">
            <TriangleAlert
              className="size-3.5 shrink-0 text-[#7C8A6A]"
              strokeWidth={1.8}
            />
            <span className="text-[12px] leading-[1.4]">{table.notes}</span>
          </div>
        </div>
      )}

      <DrawerQuickActions
        saving={saving}
        error={error}
        onOpenOrder={() => setOrderModalOpen(true)}
        onOpenReservation={() => setReservationModalOpen(true)}
        onSetStatus={(next) => void setStatusTo(next)}
      />

      {orderModalOpen && (
        <OrderModal
          table={table}
          initialLines={orderLines.map((l) => ({
            productId: l.menuItemId ?? l.name,
            name: l.name,
            unitPrice: l.unitPrice,
            qty: l.qty,
          }))}
          sending={saving === "cocina"}
          onClose={() => {
            if (saving === "cocina") return;
            setOrderModalOpen(false);
          }}
          onSendToKitchen={handleSendToKitchen}
        />
      )}
      {reservationModalOpen && (
        <SalonReservationsModal
          key={`${table.id}:${serviceDate}`}
          table={table}
          zoneName={zoneName}
          serviceDate={serviceDate}
          initialReservations={initialReservations}
          onClose={() => setReservationModalOpen(false)}
        />
      )}
    </aside>
  );
}
