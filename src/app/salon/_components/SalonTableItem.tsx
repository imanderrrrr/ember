"use client";

import React from "react";
import type { SalonTable } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import type { TableDecor } from "../_lib/table-utils";
import { TableRound } from "./TableRound";
import { TableRect } from "./TableRect";

interface SalonTableItemProps {
  table: SalonTable;
  decor: TableDecor;
  reservation: ReservationDTO | null;
  delay?: number;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function SalonTableItem({
  table,
  decor,
  reservation,
  delay = 0,
  selected,
  onClick,
}: SalonTableItemProps) {
  if (table.shape === "round") {
    return (
      <TableRound
        table={table}
        decor={decor}
        reservation={reservation}
        delay={delay}
        selected={selected}
        onClick={onClick}
      />
    );
  }

  return (
    <TableRect
      table={table}
      decor={decor}
      reservation={reservation}
      delay={delay}
      selected={selected}
      onClick={onClick}
    />
  );
}
