"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReservationDraft } from "../_lib/types";
import { INITIAL_DRAFT, TOTAL_STEPS } from "../_lib/wizard-constants";
import { findZone, recommendForZone } from "../_lib/zone-utils";
import { createReservation } from "../_lib/client-api";
import { useDraftStorage } from "./useDraftStorage";
import { useWizardData } from "./useWizardData";

export function useReservationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ReservationDraft>(INITIAL_DRAFT);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { draftLabel, saveDraftNow, clearDraft } = useDraftStorage(draft, setDraft);
  const { reservations, zones, totalOpenTables, meseros } = useWizardData(
    draft.date,
    setDraft,
  );

  const goNext = () => {
    saveDraftNow();
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    if (submitting) return;
    if (!draft.customerName.trim()) {
      setSubmitError("Agrega un cliente antes de confirmar la reserva.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    const zone =
      findZone(zones, draft.zoneName) ??
      zones.find((z) => !z.disabled) ??
      null;
    if (!zone) {
      setSubmitError("No hay zonas disponibles para reservar.");
      setSubmitting(false);
      return;
    }

    const reservedSet = new Set(
      reservations
        .filter((r) => r.zoneName === zone.name && r.timeSlot === draft.timeSlot)
        .map((r) => r.tableLabel),
    );
    const rec = recommendForZone(zone, draft.partySize, reservedSet);
    const tableLabel = draft.tableLabel ?? rec.tableId ?? null;
    const table =
      (draft.tableId
        ? zone.tables.find((t) => t.tableId === draft.tableId)
        : null) ??
      (tableLabel ? zone.tables.find((t) => t.id === tableLabel) : null);

    if (!table) {
      setSubmitError("No hay una mesa disponible para esa reserva.");
      setSubmitting(false);
      return;
    }

    try {
      await createReservation({
        tableId: table.tableId,
        date: draft.date,
        timeSlot: draft.timeSlot,
        partySize: draft.partySize,
        zoneName: zone.name,
        tableLabel: table.id,
        customerName: draft.customerName,
        customerPhone: draft.customerPhone || null,
        customerEmail: draft.customerEmail || null,
        occasion: draft.occasion,
        restrictions: draft.restrictions,
        notes: draft.notes || null,
        mesero: draft.mesero || null,
      });
      clearDraft();
      setConfirmed(true);
      setTimeout(() => router.push("/salon"), 1400);
    } catch (e) {
      console.error("[wizard] createReservation failed", e);
      setSubmitError(
        e instanceof Error ? e.message : "No se pudo guardar la reserva",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    draft,
    setDraft,
    confirmed,
    submitting,
    submitError,
    draftLabel,
    reservations,
    zones,
    totalOpenTables,
    meseros,
    goNext,
    goPrev,
    saveDraftNow,
    handleFinish,
  };
}
