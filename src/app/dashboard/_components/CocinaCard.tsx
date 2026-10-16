import React from "react";
import { CircleCheck, Timer, TriangleAlert } from "lucide-react";
import type { DashboardCocina } from "../_lib/dashboard-data";

interface CocinaCardProps {
  cocina: DashboardCocina;
}

export function CocinaCard({ cocina }: CocinaCardProps) {
  return (
    <section className="flex flex-col gap-5 rounded-[16px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
            COCINA EN VIVO
          </span>
          <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
            Pase de cocina · brigada en línea
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
            <Timer className="size-2.5 text-[#6B4F3A]" strokeWidth={2.5} />
            <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#6B4F3A]">
              PROM. {cocina.avgLabel} MIN
            </span>
          </span>
          {cocina.demoras > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8B07F] bg-[#FBE7D6] px-2.5 py-1">
              <TriangleAlert className="size-2.5 text-[#C2410C]" strokeWidth={2.5} />
              <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#C2410C]">
                {cocina.demoras} {cocina.demoras === 1 ? "DEMORA" : "DEMORAS"}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
              <CircleCheck className="size-2.5 text-[#7C8A6A]" strokeWidth={2.5} />
              <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#7C8A6A]">
                AL DÍA
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <KitchenStat
          label="NUEVOS"
          value={String(cocina.nuevas)}
          help="recién enviados"
          tone="cream"
        />
        <KitchenStat
          label="EN PREPARACIÓN"
          value={String(cocina.preparacion)}
          help="con tiempo en curso"
          tone="warning"
        />
        <KitchenStat
          label="LISTOS PARA SERVIR"
          value={String(cocina.listas)}
          help="esperando entrega"
          tone="dark"
        />
      </div>
    </section>
  );
}

function KitchenStat({
  label,
  value,
  help,
  tone,
}: {
  label: string;
  value: string;
  help: string;
  tone: "cream" | "warning" | "dark";
}) {
  const styles = {
    cream: "bg-[#F7F3EE]",
    warning: "bg-[#FBE7D6] border border-[#E8B07F]",
    dark: "bg-[#1F1F1F]",
  } as const;
  const labelTone = {
    cream: "text-[#6B4F3A]",
    warning: "text-[#C2410C]",
    dark: "text-[#A89D8E]",
  } as const;
  const valueTone = {
    cream: "text-[#1F1F1F]",
    warning: "text-[#C2410C]",
    dark: "text-[#FAF5EB]",
  } as const;
  const helpTone = {
    cream: "text-[#6B4F3A]",
    warning: "text-[#C2410C] font-medium",
    dark: "text-[#A89D8E]",
  } as const;

  return (
    <div className={`flex flex-col gap-2 rounded-[12px] px-5 py-4.5 ${styles[tone]}`}>
      <span
        className={`font-mono text-[10px] font-bold tracking-[0.15em] ${labelTone[tone]}`}
      >
        {label}
      </span>
      <span
        className={`font-jakarta text-[32px] font-bold leading-none tracking-[-0.015em] ${valueTone[tone]}`}
      >
        {value}
      </span>
      <span className={`font-jakarta text-[11px] ${helpTone[tone]}`}>{help}</span>
    </div>
  );
}
