"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import { formatDayLong } from "../_lib/date-utils";
import { buildZones } from "../_lib/zone-utils";
import {
  getSalonFloorPlan,
  listMeseros,
  listReservationsByDate,
  type MeseroDTO,
  type ReservationDTO,
  type SalonFloorPlanDTO,
} from "../_lib/client-api";

export function useWizardData(
  draftDate: string,
  setDraft: Dispatch<SetStateAction<ReservationDraft>>,
) {
  const searchParams = useSearchParams();
  const prefilledTableIdRef = useRef<string | null>(null);
  const [reservations, setReservations] = useState<ReservationDTO[]>([]);
  const [floorPlan, setFloorPlan] = useState<SalonFloorPlanDTO | null>(null);
  const [meseros, setMeseros] = useState<MeseroDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getSalonFloorPlan();
        if (!cancelled) setFloorPlan(fp);
      } catch (e) {
        console.error("[wizard] getSalonFloorPlan failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listMeseros();
        if (!cancelled) setMeseros(list);
      } catch (e) {
        console.error("[wizard] listMeseros failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const zones: ZoneDef[] = floorPlan ? buildZones(floorPlan) : [];
  const totalOpenTables = zones
    .filter((z) => !z.disabled)
    .reduce((acc, z) => acc + z.total, 0);

  useEffect(() => {
    const requestedTableId = searchParams.get("tableId");
    if (!requestedTableId || !floorPlan) return;
    if (prefilledTableIdRef.current === requestedTableId) return;

    const table = floorPlan.tables.find((t) => t.id === requestedTableId);
    const zone = table
      ? floorPlan.zones.find((z) => z.id === table.zoneId)
      : null;
    if (!table || !zone) return;

    const date = searchParams.get("date");
    const timeSlot = searchParams.get("timeSlot");
    prefilledTableIdRef.current = requestedTableId;
    window.queueMicrotask(() => {
      setDraft((prev) => ({
        ...prev,
        ...(date && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? { date, dateLabel: formatDayLong(date) }
          : {}),
        ...(timeSlot && /^([01]\d|2[0-3]):[0-5]\d$/.test(timeSlot)
          ? { timeSlot }
          : {}),
        zoneName: zone.name,
        tableId: table.id,
        tableLabel: table.label,
      }));
    });
  }, [floorPlan, searchParams, setDraft]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listReservationsByDate(draftDate);
        if (!cancelled) setReservations(list);
      } catch (e) {
        console.error("[wizard] listReservationsByDate failed", e);
        if (!cancelled) setReservations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftDate]);

  return {
    reservations,
    floorPlan,
    meseros,
    zones,
    totalOpenTables,
  };
}
