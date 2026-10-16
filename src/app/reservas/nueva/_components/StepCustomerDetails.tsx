"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { ReservationDraft } from "../_lib/types";
import type { MeseroDTO } from "../_lib/client-api";
import {
  WizardCardSection,
  WizardStepContainer,
} from "./WizardStepContainer";
import { StepCustomerMesero } from "./StepCustomerMesero";
import { StepCustomerServiceDetails } from "./StepCustomerServiceDetails";

interface StepCustomerDetailsProps {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  meseros: MeseroDTO[];
}

export function StepCustomerDetails({
  draft,
  onChange,
  meseros,
}: StepCustomerDetailsProps) {
  const [creating, setCreating] = useState(draft.customerName.trim() === "");
  const hasClient = draft.customerName.trim().length > 0;
  const initials =
    draft.customerName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "··";

  const startNew = () => {
    onChange({
      ...draft,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
    });
    setCreating(true);
  };

  const toggleR = (r: string) => {
    const next = draft.restrictions.includes(r)
      ? draft.restrictions.filter((x) => x !== r)
      : [...draft.restrictions, r];
    onChange({ ...draft, restrictions: next });
  };

  return (
    <WizardStepContainer
      stepLabel="PASO 04 · CLIENTE"
      title="Datos del cliente"
      subtitle="Busca un cliente existente o registra uno nuevo."
    >
      <WizardCardSection title="Cliente vinculado">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] px-3.5 py-2.5">
            <Search className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo…"
              className="flex-1 bg-transparent text-[13px] text-[#1f1f1f] outline-none placeholder:text-[#a89d8e]"
            />
          </div>
          <button
            type="button"
            onClick={startNew}
            className="shrink-0 rounded-xl border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] font-medium text-[#1f1f1f] hover:bg-[#f7f3ee]"
          >
            + Nuevo cliente
          </button>
        </div>

        {creating ? (
          <div className="mt-3 flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5">
            <span
              className="font-mono text-[9.5px] font-bold text-[#6b4f3a]"
              style={{ letterSpacing: "1.4px" }}
            >
              NUEVO CLIENTE
            </span>
            <input
              type="text"
              autoFocus
              value={draft.customerName}
              onChange={(e) => onChange({ ...draft, customerName: e.target.value })}
              placeholder="Nombre completo *"
              className="w-full rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] text-[#1f1f1f] focus:border-[#e67e22] focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="tel"
                value={draft.customerPhone}
                onChange={(e) =>
                  onChange({ ...draft, customerPhone: e.target.value })
                }
                placeholder="Teléfono"
                className="w-full rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] text-[#1f1f1f] focus:border-[#e67e22] focus:outline-none"
              />
              <input
                type="email"
                value={draft.customerEmail}
                onChange={(e) =>
                  onChange({ ...draft, customerEmail: e.target.value })
                }
                placeholder="Correo electrónico"
                className="w-full rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] text-[#1f1f1f] focus:border-[#e67e22] focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={!hasClient}
              onClick={() => setCreating(false)}
              className="self-end rounded-lg bg-[#e67e22] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Vincular cliente
            </button>
          </div>
        ) : (
          <div
            className="mt-3 flex items-center gap-3 rounded-xl bg-[#fbe7d6] p-3.5"
            style={{ border: "1.5px solid #e8b07f" }}
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-[#e67e22] text-[16px] font-bold text-white">
              {initials}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-[14px] font-bold text-[#1f1f1f]">
                {draft.customerName}
              </span>
              <span className="text-[11.5px] text-[#6b4f3a]">
                {[draft.customerPhone, draft.customerEmail]
                  .filter(Boolean)
                  .join(" · ") || "Sin datos de contacto"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="rounded-lg border border-[#e8b07f] bg-white/70 px-3 py-1.5 text-[11.5px] font-medium text-[#1f1f1f] hover:bg-white"
            >
              Cambiar
            </button>
          </div>
        )}
      </WizardCardSection>

      <div className="grid grid-cols-2 gap-5">
        <StepCustomerMesero
          meseros={meseros}
          selectedMesero={draft.mesero}
          onSelectMesero={(name) => onChange({ ...draft, mesero: name })}
        />

        <StepCustomerServiceDetails
          occasion={draft.occasion}
          restrictions={draft.restrictions}
          onChangeOccasion={(o) => onChange({ ...draft, occasion: o })}
          onToggleRestriction={toggleR}
        />
      </div>
    </WizardStepContainer>
  );
}

export { StepCustomerDetails as Step4 };
