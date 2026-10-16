"use client";

import { FileText } from "lucide-react";
import type { ReservationDraft } from "../_lib/types";
import {
  WizardCardSection,
  WizardStepContainer,
} from "./WizardStepContainer";

interface Step5ConfirmationProps {
  draft: ReservationDraft;
}

export function Step5Confirmation({ draft }: Step5ConfirmationProps) {
  const rows = [
    { label: "Fecha y hora", value: `${draft.dateLabel} · ${draft.timeSlot}` },
    {
      label: "Mesa asignada",
      value: draft.tableLabel
        ? `${draft.zoneName} · Mesa ${draft.tableLabel}`
        : "Sin mesa asignada",
    },
    { label: "Comensales", value: `${draft.partySize} personas` },
    { label: "Cliente", value: draft.customerName },
    { label: "Mesero responsable", value: draft.mesero || "Sin asignar" },
    { label: "Ocasión", value: draft.occasion ?? "—" },
    {
      label: "Restricciones",
      value:
        draft.restrictions.length > 0
          ? draft.restrictions.join(", ")
          : "Ninguna",
    },
  ];

  return (
    <WizardStepContainer
      stepLabel="PASO 05 · CONFIRMAR"
      title="Revisa y confirma la reserva"
      subtitle="Verifica todos los datos antes de enviar."
    >
      <WizardCardSection title="Resumen">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between border-b border-[#ede6dc] py-2 last:border-b-0"
          >
            <span
              className="font-mono text-[10px] font-bold text-[#6b4f3a]"
              style={{ letterSpacing: "1.2px" }}
            >
              {r.label.toUpperCase()}
            </span>
            <span className="text-[12.5px] font-medium text-[#1f1f1f]">
              {r.value}
            </span>
          </div>
        ))}
      </WizardCardSection>
      <div
        className="flex items-start gap-3 rounded-xl bg-[#fbe7d6] p-4"
        style={{ border: "1.5px solid #e8b07f" }}
      >
        <FileText
          className="mt-0.5 size-4 shrink-0 text-[#e67e22]"
          strokeWidth={2}
        />
        <span className="text-[12.5px] leading-[1.5] text-[#1f1f1f]">
          Al confirmar enviaremos un mensaje por WhatsApp a{" "}
          {draft.customerName.split(" ")[0]} con los detalles de la reserva.
        </span>
      </div>
    </WizardStepContainer>
  );
}

export { Step5Confirmation as Step5 };
