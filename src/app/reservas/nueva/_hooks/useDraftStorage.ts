"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ReservationDraft } from "../_lib/types";
import { DRAFT_KEY } from "../_lib/wizard-constants";
import { relTimeShort } from "../_lib/date-utils";

export function useDraftStorage(
  draft: ReservationDraft,
  setDraft: Dispatch<SetStateAction<ReservationDraft>>,
) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const skipFirstPersistRef = useRef(true);

  // Restaura un borrador guardado al montar
  useEffect(() => {
    let parsed: { draft?: Partial<ReservationDraft>; savedAt?: number } | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    if (parsed?.draft) {
      const restored = parsed;
      window.queueMicrotask(() => {
        setDraft((prev) => ({ ...prev, ...restored.draft }));
        if (restored.savedAt) setSavedAt(restored.savedAt);
      });
    }
  }, [setDraft]);

  // Persiste el draft en cada cambio
  useEffect(() => {
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return;
    }
    const ts = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, savedAt: ts }));
    } catch {
      // ignore
    }
    window.queueMicrotask(() => setSavedAt(ts));
  }, [draft]);

  // Reloj para el "hace X" del chip de borrador
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSec =
    savedAt != null && now > 0
      ? Math.max(0, Math.floor((now - savedAt) / 1000))
      : null;

  const draftLabel =
    savedAt == null
      ? "Borrador iniciado · ahora"
      : elapsedSec == null || elapsedSec < 5
        ? "Borrador guardado · ahora"
        : `Borrador guardado · hace ${relTimeShort(elapsedSec)}`;

  const saveDraftNow = () => {
    const ts = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, savedAt: ts }));
    } catch {
      // ignore
    }
    setSavedAt(ts);
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  return {
    draftLabel,
    saveDraftNow,
    clearDraft,
  };
}
