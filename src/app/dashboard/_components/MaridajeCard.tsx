import React from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function MaridajeCard() {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] bg-[#1F1F1F] p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      <div className="flex items-center gap-2">
        <ArrowUpRight className="size-3.5 text-[#E8B07F]" strokeWidth={2} />
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#E8B07F]">
          CRECIMIENTO DE TICKET
        </span>
      </div>
      <h4 className="font-sans text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#FAF5EB]">
        Maridaje impecable.
      </h4>
      <p className="font-sans text-[12.5px] leading-relaxed text-[#A89D8E]">
        Cuida que cada platillo principal salga con su recomendación líquida
        sugerida. Refuerza la sugerencia en mesas de 4+ comensales para elevar
        el ticket promedio.
      </p>
      <div className="flex items-center gap-2 pt-2">
        <span className="font-sans text-[12px] font-semibold text-[#E8B07F]">
          Configurar sugerencias
        </span>
        <ArrowRight className="size-3.5 text-[#E8B07F]" strokeWidth={2} />
      </div>
    </div>
  );
}
