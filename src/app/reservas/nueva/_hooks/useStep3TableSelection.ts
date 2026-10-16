"use client";

import { useEffect, useRef, useState } from "react";
import type { ReservationDraft, ZoneDef } from "../_lib/types";
import type { ReservationDTO } from "../_lib/client-api";
import { recommendForZone, reservedTablesAt } from "../_lib/zone-utils";
import type { PlanTable } from "../_components/PlanTableNode";
import type { AltCard } from "../_components/AltTableCard";

export const FLOOR_REF_W = 920;
export const FLOOR_REF_H = 900;

interface UseStep3TableSelectionProps {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  zone: ZoneDef;
  reservations: ReservationDTO[];
}

export function useStep3TableSelection({
  draft,
  onChange,
  zone,
  reservations,
}: UseStep3TableSelectionProps) {
  const [suggestionsOn, setSuggestionsOn] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [planOpen, setPlanOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const sx = rect.width / FLOOR_REF_W;
      const sy = rect.height / FLOOR_REF_H;
      setAutoScale(Math.min(sx, sy));
    };
    compute();
    const obs = new ResizeObserver(compute);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const effectiveScale = autoScale * zoom;

  const reservedMap = reservedTablesAt(
    reservations,
    zone.name,
    draft.timeSlot,
  );
  const reservedSet = new Set(reservedMap.keys());

  const recommendation = recommendForZone(
    zone,
    draft.partySize,
    reservedSet,
  );
  const recommended = recommendation.tableId;

  const initialPick = draft.tableLabel ?? recommended ?? null;
  const [selected, setSelected] = useState<string | null>(initialPick);

  useEffect(() => {
    const table = recommended
      ? zone.tables.find((t) => t.id === recommended)
      : null;
    window.queueMicrotask(() => {
      setSelected(recommended);
      onChange({
        ...draft,
        tableLabel: recommended,
        tableId: table?.tableId ?? null,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone.name, draft.partySize]);

  const selectTable = (label: string) => {
    const table = zone.tables.find((t) => t.id === label);
    setSelected(label);
    onChange({
      ...draft,
      tableLabel: label,
      tableId: table?.tableId ?? null,
    });
  };

  const planTables: PlanTable[] = zone.tables.map((t, i) => {
    const r = reservedMap.get(t.id);
    return {
      ...t,
      label: t.id,
      delay: 360 + i * 40,
      reservedBy: r ? `Reserva ${r.timeSlot} — ${r.customerName}` : undefined,
    };
  });

  const alts: AltCard[] = zone.tables
    .filter((t) => t.id !== recommended && !reservedSet.has(t.id))
    .slice(0, 4)
    .map((t, i) => {
      const fits = t.seats >= draft.partySize;
      const generous = t.seats >= draft.partySize + 2;
      const chip: AltCard["chip"] = !fits
        ? { icon: "x", text: `Insuficiente para ${draft.partySize}p`, tone: "bad" }
        : generous
          ? { text: `Generosa (${t.seats} pers)`, tone: "warn" }
          : { icon: "check", text: "Compatible", tone: "good" };
      return {
        label: t.id,
        meta: `${zone.shortName} · ${t.seats} pers`,
        chip,
        dotColor: fits ? "#e67e22" : "#a89d8e",
        dotX: 18 + i * 12,
        muted: !fits,
        delay: 1100 + i * 80,
      };
    });

  return {
    suggestionsOn,
    setSuggestionsOn,
    zoom,
    setZoom,
    planOpen,
    setPlanOpen,
    viewportRef,
    effectiveScale,
    recommendation,
    recommended,
    selected,
    selectTable,
    planTables,
    alts,
  };
}
