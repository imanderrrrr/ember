"use client";

import { Check, Phone } from "lucide-react";
import type { MeseroDTO } from "../_lib/client-api";
import { WizardCardSection } from "./WizardStepContainer";

interface StepCustomerMeseroProps {
  meseros: MeseroDTO[];
  selectedMesero: string;
  onSelectMesero: (name: string) => void;
}

export function StepCustomerMesero({
  meseros,
  selectedMesero,
  onSelectMesero,
}: StepCustomerMeseroProps) {
  return (
    <WizardCardSection title="Persona a cargo de la mesa">
      {meseros.length === 0 ? (
        <span className="text-[12px] text-[#a89d8e]">
          No hay meseros registrados todavía.
        </span>
      ) : (
        <div className="flex flex-col gap-1.5">
          {meseros.map((m) => {
            const active = selectedMesero === m.name;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMesero(active ? "" : m.name)}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors"
                style={{
                  background: active ? "#fbe7d6" : "#ffffff",
                  borderColor: active ? "#e67e22" : "#ede6dc",
                }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: active ? "#e67e22" : "#7c8a6a" }}
                >
                  {m.avatarInitials}
                </span>
                <span className="flex-1 text-[13px] font-medium text-[#1f1f1f]">
                  {m.name}
                </span>
                {active && (
                  <Check className="size-4 text-[#e67e22]" strokeWidth={2.4} />
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1.5">
        <Phone className="size-3 text-[#6b4f3a]" strokeWidth={1.8} />
        <span className="text-[11px] text-[#6B6660]">
          {selectedMesero
            ? `Se notificará a ${selectedMesero} por WhatsApp 30 min antes`
            : "Selecciona un mesero para asignarlo como responsable"}
        </span>
      </div>
    </WizardCardSection>
  );
}
