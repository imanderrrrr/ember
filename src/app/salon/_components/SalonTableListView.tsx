"use client";

import React from "react";
import Link from "next/link";
import type { SalonTable } from "../_lib/types";
import { STATUS_COLOR, STATUS_LABEL } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { effectiveStatus, nextReservationForTable } from "../_lib/table-utils";

interface SalonTableListViewProps {
  tables: SalonTable[];
  reservations: ReservationDTO[];
  zoneNameById: Map<string, string>;
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
}

export function SalonTableListView({
  tables,
  reservations,
  zoneNameById,
  selectedTableId,
  onSelectTable,
}: SalonTableListViewProps) {
  const sorted = [...tables].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  if (sorted.length === 0) {
    return (
      <div className="flex h-[900px] w-[920px] items-center justify-center rounded-lg border border-[#EDE6DC] bg-white">
        <span className="rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-4 py-2 text-[12px] text-[#6B6660]">
          Esta zona aún no tiene mesas.{" "}
          <Link href="/salon/edit" className="font-medium text-[#C2410C]">
            Configurar
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-[900px] w-[920px] flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-white">
      <div
        className="sticky top-0 z-10 grid items-center gap-3 border-b border-[#EDE6DC] bg-[#F7F3EE] px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]"
        style={{
          gridTemplateColumns: "64px 168px 96px 110px 1fr 1fr",
        }}
      >
        <span>MESA</span>
        <span>ESTADO</span>
        <span>CAPACIDAD</span>
        <span>COMENSALES</span>
        <span>CLIENTE</span>
        <span>NOTAS</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.map((t, i) => (
          <TableListRow
            key={t.id}
            table={t}
            reservation={nextReservationForTable(
              reservations,
              t,
              zoneNameById.get(t.zoneId),
            )}
            index={i}
            selected={t.id === selectedTableId}
            onSelect={() =>
              onSelectTable(t.id === selectedTableId ? null : t.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

function TableListRow({
  table,
  reservation,
  index,
  selected,
  onSelect,
}: {
  table: SalonTable;
  reservation: ReservationDTO | null;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = effectiveStatus(table, reservation);
  const color = STATUS_COLOR[status];
  const customerName = table.customerName ?? reservation?.customerName ?? null;
  const notes =
    table.notes ?? reservation?.occasion ?? reservation?.notes ?? null;
  const animStyle = { animationDelay: `${index * 30}ms` } as React.CSSProperties;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="animate-salon-table grid w-full items-center gap-3 border-b border-[#EDE6DC] px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#F7F3EE]"
      style={{
        gridTemplateColumns: "64px 168px 96px 110px 1fr 1fr",
        background: selected ? `${color}10` : undefined,
        boxShadow: selected ? `inset 3px 0 0 0 ${color}` : undefined,
        ...animStyle,
      }}
    >
      <span className="font-mono text-[15px] font-semibold leading-none text-[#1F1F1F]">
        {table.label}
      </span>

      <span
        className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px]"
        style={{ background: color }}
      >
        <span className="size-1.5 rounded-full bg-[#F7F3EE]" />
        <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#F7F3EE]">
          {STATUS_LABEL[status].toUpperCase()}
        </span>
      </span>

      <span className="font-mono text-[12px] text-[#6B6660]">
        {table.seats} {table.seats === 1 ? "asiento" : "asientos"}
      </span>

      <span
        className={`font-mono text-[13px] font-medium ${
          table.partySize !== null && table.partySize > table.seats
            ? "text-[#C95A3D]"
            : "text-[#1F1F1F]"
        }`}
      >
        {table.partySize !== null ? table.partySize : "—"}
      </span>

      <span
        className={`truncate text-[12.5px] ${
          customerName ? "text-[#1F1F1F]" : "text-[#a89d8e]"
        }`}
        title={customerName ?? undefined}
      >
        {customerName ?? "—"}
      </span>

      <span
        className={`truncate text-[12px] ${
          notes ? "text-[#6B4F3A]" : "text-[#a89d8e]"
        }`}
        title={notes ?? undefined}
      >
        {notes ?? "—"}
      </span>
    </button>
  );
}
