"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SalonTable, TableStatus, Zone } from "../_lib/types";
import { STATUS_LABEL } from "../_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import type { SearchResult } from "../_lib/search-types";

interface UseSalonSearchProps {
  tables: SalonTable[];
  zones: Zone[];
  reservations: ReservationDTO[];
  onPickResult: (tableId: string, zoneId: string) => void;
}

export function useSalonSearch({
  tables,
  zones,
  reservations,
  onPickResult,
}: UseSalonSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [prevQuery, setPrevQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const zoneNameById = useMemo(
    () => new Map(zones.map((z) => [z.id, z.name])),
    [zones],
  );

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];
    const seen = new Set<string>();
    const push = (r: SearchResult, key: string) => {
      if (seen.has(key)) return;
      seen.add(key);
      out.push(r);
    };

    for (const t of tables) {
      if (t.label.toLowerCase().includes(q)) {
        push(
          {
            kind: "mesa",
            tableId: t.id,
            zoneId: t.zoneId,
            primary: `Mesa ${t.label}`,
            secondary: `${zoneNameById.get(t.zoneId) ?? "—"} · ${STATUS_LABEL[t.status]}`,
            status: t.status,
          },
          `mesa:${t.id}`,
        );
      }
    }

    const seatedStatuses: TableStatus[] = ["ocupada", "cocina", "esperando"];
    for (const t of tables) {
      if (
        seatedStatuses.includes(t.status) &&
        t.customerName &&
        t.customerName.toLowerCase().includes(q)
      ) {
        push(
          {
            kind: "cliente",
            tableId: t.id,
            zoneId: t.zoneId,
            primary: t.customerName,
            secondary: `Sentado · Mesa ${t.label} · ${zoneNameById.get(t.zoneId) ?? "—"}`,
            status: t.status,
          },
          `cli-mesa:${t.id}`,
        );
      }
    }

    for (const r of reservations) {
      if (!r.customerName.toLowerCase().includes(q)) continue;
      const table =
        (r.tableId && tables.find((t) => t.id === r.tableId)) ||
        tables.find(
          (t) =>
            zoneNameById.get(t.zoneId) === r.zoneName &&
            t.label === r.tableLabel,
        );
      if (!table) continue;
      push(
        {
          kind: "cliente",
          tableId: table.id,
          zoneId: table.zoneId,
          primary: r.customerName,
          secondary: `Reserva ${r.timeSlot} · Mesa ${r.tableLabel} · ${r.zoneName}`,
          status: table.status,
        },
        `cli-res:${r.id}`,
      );
    }

    return out.slice(0, 8);
  }, [query, tables, reservations, zoneNameById]);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setHighlight(0);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable;
      if (typing) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (r: SearchResult | undefined) => {
    if (!r) return;
    onPickResult(r.tableId, r.zoneId);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return {
    query,
    setQuery,
    open,
    setOpen,
    highlight,
    setHighlight,
    results,
    inputRef,
    boxRef,
    pick,
  };
}
