import React from "react";
import { ArrowRight, Quote } from "lucide-react";

export function FocusQuoteCard() {
  return (
    <section className="flex w-[340px] flex-col gap-5 rounded-[18px] bg-[#1F1F1F] p-7 shadow-[0_8px_24px_rgba(31,31,31,0.12)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#E8B07F]">
          FOCUS DEL DÍA
        </span>
        <span className="rounded-full bg-[#E67E22] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.06em] text-[#1F1F1F]">
          PRIORIDAD
        </span>
      </div>

      <p className="font-jakarta text-[20px] font-semibold leading-snug tracking-[-0.015em] text-[#FAF5EB]">
        Cerrar el turno con servicio impecable y rotación de mesa fluida.
      </p>

      <div className="h-px w-full bg-[#3A322C]" />

      <div className="flex gap-2.5">
        <Quote className="mt-0.5 size-4.5 shrink-0 text-[#E67E22]" strokeWidth={2} />
        <p className="font-jakarta text-[14px] font-medium italic leading-snug text-[#FAF5EB]">
          &quot;La sala respira cuando la cocina canta.&quot;
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2.5">
        <span className="h-px w-6 bg-[#E8B07F]" />
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#E8B07F]">
          FILOSOFÍA EMBER
        </span>
      </div>

      <button
        type="button"
        className="flex items-center justify-between gap-2.5 rounded-[12px] border border-[#3A322C] bg-[#1F1F1F] px-4 py-3 hover:bg-[#251a14]"
      >
        <div className="flex flex-col items-start">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#A89D8E]">
            REUNIÓN PRE-SERVICIO
          </span>
          <span className="font-jakarta text-[12px] font-medium text-[#FAF5EB]">
            Hoy 18:30 · Brigada completa
          </span>
        </div>
        <ArrowRight className="size-4 text-[#E8B07F]" strokeWidth={2} />
      </button>
    </section>
  );
}
