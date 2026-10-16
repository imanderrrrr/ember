import React from "react";
import { Clock, Flame, Sparkles, TrendingUp, Wallet } from "lucide-react";

export function InsightsAICard() {
  const items = [
    { Icon: TrendingUp, text: "La Terraza está cerca de llenarse — sugerir derivar a salón.", cta: "Aplicar", outline: true },
    { Icon: Flame, text: "El risotto va liderando ventas — mantener stock disponible.", cta: "Ver detalle" },
    { Icon: Clock, text: "3 mesas superan el tiempo promedio de servicio — revisar.", cta: "Revisar mesas" },
    { Icon: Wallet, text: "Conviene reforzar caja en 30 min según ritmo de cierre.", cta: "Programar", outline: true },
  ] as const;

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E8B07F] bg-[#F7F3EE] p-5.5 shadow-[0_4px_16px_rgba(107,79,58,0.08)]">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-[#E67E22]" strokeWidth={2} />
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          INSIGHTS · EMBER AI
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <it.Icon className="mt-0.5 size-3.5 shrink-0 text-[#C2410C]" strokeWidth={2} />
            <div className="flex flex-1 flex-col gap-1.5">
              <p className="font-sans text-[12px] leading-snug text-[#1F1F1F]">
                {it.text}
              </p>
              {"outline" in it && it.outline ? (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1 rounded-full border border-[#E8B07F] bg-white px-3 py-1 font-sans text-[11px] font-semibold text-[#C2410C]"
                >
                  {it.cta}
                </button>
              ) : (
                <span className="font-sans text-[11px] font-semibold text-[#C2410C]">
                  {it.cta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
