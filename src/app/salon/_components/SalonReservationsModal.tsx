"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Info, Plus, TriangleAlert, X } from "lucide-react";
import type { SalonTable } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { formatReservationDate } from "../_lib/table-utils";
import { ReservationPanel } from "./ReservationPanel";
import { EmptyReservationRow, ReservationRow } from "./ReservationRow";
import { useTableReservations } from "../_hooks/useTableReservations";

interface SalonReservationsModalProps {
  table: SalonTable;
  zoneName: string | null;
  serviceDate: string;
  initialReservations: ReservationDTO[];
  onClose: () => void;
}

export function SalonReservationsModal({
  table,
  zoneName,
  serviceDate,
  initialReservations,
  onClose,
}: SalonReservationsModalProps) {
  const {
    loading,
    loadError,
    visibleRows,
    inactiveRows,
    current,
    next,
    upcoming,
  } = useTableReservations({
    table,
    zoneName,
    serviceDate,
    initialReservations,
  });

  const createHref = `/reservas/nueva?tableId=${encodeURIComponent(
    table.id,
  )}&date=${encodeURIComponent(serviceDate)}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1F1F1F]/45 px-6 py-8"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="flex max-h-[88vh] w-[760px] flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] shadow-[0_24px_70px_rgba(31,31,31,0.24)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-reservations-title"
      >
        <header className="flex items-start justify-between border-b border-[#EDE6DC] bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E67E2214]">
              <Calendar className="size-5 text-[#E67E22]" strokeWidth={1.8} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
                {formatReservationDate(serviceDate).toUpperCase()}
              </span>
              <h2
                id="table-reservations-title"
                className="text-[22px] font-semibold leading-tight text-[#1F1F1F]"
              >
                Reservaciones de mesa
              </h2>
              <span className="text-[12px] text-[#6B6660]">
                {zoneName ?? "Salón"} · Mesa {table.label} · {table.seats}{" "}
                {table.seats === 1 ? "persona" : "personas"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reservaciones"
            className="flex size-8 items-center justify-center rounded-lg border border-[#EDE6DC] hover:bg-[#F7F3EE]"
          >
            <X className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#C95A3D33] bg-[#C95A3D0A] px-3 py-2 text-[12px] text-[#C95A3D]">
              <TriangleAlert className="mt-px size-3.5 shrink-0" strokeWidth={1.8} />
              <span>{loadError}</span>
            </div>
          )}

          <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
            <ReservationPanel
              title="Ahora"
              reservation={current}
              emptyText={loading ? "Actualizando..." : "Sin reserva activa"}
              featured
            />
            <ReservationPanel
              title="Siguiente"
              reservation={next}
              emptyText={loading ? "Actualizando..." : "Sin siguiente reserva"}
            />
          </div>

          <section className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
                PROXIMAS
              </span>
              <span className="font-mono text-[11px] text-[#6B6660]">
                {visibleRows.length} total
              </span>
            </div>
            <div className="flex flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-white">
              {upcoming.length > 0 ? (
                upcoming.map((reservation) => (
                  <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              ) : (
                <EmptyReservationRow
                  text={
                    loading
                      ? "Actualizando reservaciones..."
                      : "No hay más reservas activas"
                  }
                />
              )}
            </div>
          </section>

          {inactiveRows.length > 0 && (
            <section className="mt-5 flex flex-col gap-3">
              <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
                HISTORIAL
              </span>
              <div className="flex flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-white opacity-80">
                {inactiveRows.map((reservation) => (
                  <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#EDE6DC] bg-white px-6 py-4">
          <span className="flex min-w-0 items-center gap-2 text-[12px] text-[#6B6660]">
            <Info className="size-3.5 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="truncate">
              Datos sincronizados desde backend por mesa y fecha.
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#EDE6DC] bg-white px-4 py-2 text-[12px] hover:bg-[#F7F3EE]"
            >
              Cerrar
            </button>
            <Link
              href={createHref}
              className="flex items-center gap-2 rounded-lg bg-[#E67E22] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#c2410c]"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Nueva reservación
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
