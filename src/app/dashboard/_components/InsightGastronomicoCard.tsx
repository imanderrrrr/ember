import React from "react";
import { GlassWater, OctagonAlert, Sparkles } from "lucide-react";

export function InsightGastronomicoCard() {
  return (
    <section className="flex w-[380px] flex-col gap-4 rounded-[18px] bg-[#1F1F1F] p-6 shadow-[0_8px_24px_rgba(31,31,31,0.12)]">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#E8B07F]">
          INSIGHT GASTRONÓMICO
        </span>
        <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em] text-[#FAF5EB]">
          Pulso de la cocina hoy
        </h3>
      </div>

      <div className="flex flex-col gap-2 rounded-[14px] border border-[#3A322C] bg-[#1F1F1F] p-4.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#E8B07F]">
            PLATILLO MÁS VENDIDO
          </span>
          <span className="rounded-full bg-[#E67E22] px-2 py-0.5">
            <span className="font-mono text-[9px] font-bold tracking-[0.06em] text-[#1F1F1F]">
              #1
            </span>
          </span>
        </div>
        <span className="font-jakarta text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#FAF5EB]">
          Cordero al rescoldo
        </span>
        <div className="flex items-center gap-2.5">
          <span className="font-jakarta text-[12px] font-medium text-[#FAF5EB]">
            32 órdenes
          </span>
          <span className="text-[12px] text-[#6B4F3A]">·</span>
          <span className="font-jakarta text-[12px] font-semibold text-[#E8B07F]">
            Q24,640 facturados
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 rounded-[12px] bg-[#1F1F1F] px-3.5 py-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#3A322C]">
            <GlassWater className="size-4 text-[#E8B07F]" strokeWidth={1.8} />
          </span>
          <div className="flex flex-1 flex-col">
            <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#A89D8E]">
              BEBIDA MÁS PEDIDA
            </span>
            <span className="font-jakarta text-[13px] font-semibold text-[#FAF5EB]">
              Malbec Reserva Mendoza
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold tracking-[0.03em] text-[#E8B07F]">
            24 copas
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[12px] border border-[#7A2E14] bg-[#3A322C] px-3.5 py-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#7A2E14]">
            <OctagonAlert className="size-4 text-[#F4DABA]" strokeWidth={1.8} />
          </span>
          <div className="flex flex-1 flex-col">
            <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#E8B07F]">
              PRODUCTO AGOTADO
            </span>
            <span className="font-jakarta text-[13px] font-semibold text-[#F4DABA]">
              Empanadas de morcilla
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold tracking-[0.03em] text-[#E8B07F]">
            86&apos;d
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[12px] bg-[#E67E22] p-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-[#1F1F1F]" strokeWidth={2.5} />
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#1F1F1F]">
            RECOMENDACIÓN DE REPOSICIÓN
          </span>
        </div>
        <p className="font-jakarta text-[12px] font-medium leading-snug text-[#1F1F1F]">
          Pedir 2 kg de morcilla y 5 botellas Malbec antes del cierre. Hora
          pico detectada: 21:00.
        </p>
      </div>
    </section>
  );
}
