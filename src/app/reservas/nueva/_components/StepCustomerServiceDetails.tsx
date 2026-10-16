"use client";

import { Cake, CircleAlert, GlassWater, HeartHandshake, Leaf, Star, WheatOff } from "lucide-react";
import { WizardCardSection } from "./WizardStepContainer";

interface StepCustomerServiceDetailsProps {
  occasion: string | null;
  restrictions: string[];
  onChangeOccasion: (o: string) => void;
  onToggleRestriction: (r: string) => void;
}

const OCCASIONS = [
  { label: "Cumpleaños", icon: Cake },
  { label: "Aniversario", icon: HeartHandshake },
  { label: "Cena de negocios", icon: GlassWater },
  { label: "Otro", icon: Star },
];

const RESTRICTIONS = [
  { label: "Vegetariano", icon: Leaf },
  { label: "Sin gluten", icon: WheatOff },
  { label: "Vegano", icon: Leaf },
  { label: "Otro", icon: CircleAlert },
];

export function StepCustomerServiceDetails({
  occasion,
  restrictions,
  onChangeOccasion,
  onToggleRestriction,
}: StepCustomerServiceDetailsProps) {
  return (
    <WizardCardSection title="Detalles del servicio">
      <span
        className="font-mono text-[9.5px] font-bold text-[#6b4f3a]"
        style={{ letterSpacing: "1.4px" }}
      >
        OCASIÓN
      </span>
      <div className="flex flex-wrap gap-1.5">
        {OCCASIONS.map((o) => {
          const active = o.label === occasion;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => onChangeOccasion(o.label)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px]"
              style={{
                background: active ? "#e67e22" : "#FFFFFF",
                border: active ? "1.5px solid #e67e22" : "1px solid #ede6dc",
                color: active ? "#FFFFFF" : "#1f1f1f",
                fontWeight: active ? 600 : 500,
              }}
            >
              <o.icon className="size-3" strokeWidth={1.8} />
              {o.label}
            </button>
          );
        })}
      </div>
      <span
        className="mt-2 font-mono text-[9.5px] font-bold text-[#6b4f3a]"
        style={{ letterSpacing: "1.4px" }}
      >
        RESTRICCIONES
      </span>
      <div className="flex flex-wrap gap-1.5">
        {RESTRICTIONS.map((r) => {
          const active = restrictions.includes(r.label);
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => onToggleRestriction(r.label)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px]"
              style={{
                background: active ? "#1f1f1f" : "#FFFFFF",
                border: active ? "1.5px solid #1f1f1f" : "1px solid #ede6dc",
                color: active ? "#FFFFFF" : "#1f1f1f",
                fontWeight: active ? 600 : 500,
              }}
            >
              <r.icon className="size-3" strokeWidth={1.8} />
              {r.label}
            </button>
          );
        })}
      </div>
    </WizardCardSection>
  );
}
