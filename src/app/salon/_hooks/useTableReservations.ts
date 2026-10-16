"use client";

import { useEffect, useState } from "react";
import type { SalonTable } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { listReservationsByTable } from "@/app/reservas/_lib/client-api";
import {
  allReservationsForTable,
  isActiveReservation,
} from "../_lib/table-utils";

interface UseTableReservationsProps {
  table: SalonTable;
  zoneName: string | null;
  serviceDate: string;
  initialReservations: ReservationDTO[];
}

export function useTableReservations({
  table,
  zoneName,
  serviceDate,
  initialReservations,
}: UseTableReservationsProps) {
  const [rows, setRows] = useState<ReservationDTO[]>(initialReservations);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    listReservationsByTable({
      tableId: table.id,
      date: serviceDate,
      zoneName: zoneName ?? undefined,
      tableLabel: table.label,
    })
      .then((next) => {
        if (mounted) setRows(next);
      })
      .catch((e) => {
        console.error("[salon] listReservationsByTable failed", e);
        if (mounted) setLoadError("No se pudieron actualizar las reservaciones");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [serviceDate, table.id, table.label, zoneName]);

  const visibleRows = allReservationsForTable(rows, table, zoneName);
  const activeRows = visibleRows.filter(isActiveReservation);
  const inactiveRows = visibleRows.filter((r) => !isActiveReservation(r));
  const current = activeRows[0] ?? null;
  const next = activeRows[1] ?? null;
  const upcoming = activeRows.slice(2);

  return {
    rows,
    loading,
    loadError,
    visibleRows,
    activeRows,
    inactiveRows,
    current,
    next,
    upcoming,
  };
}
