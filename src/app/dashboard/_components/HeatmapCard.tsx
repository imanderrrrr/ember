import React from "react";
import { ArrowRight, Flame } from "lucide-react";

export function HeatmapCard() {
  const rows = [
    { hour: "13H", cells: ["fbe7d6", "F4DABA", "fbe7d6", "F4DABA", "E8B07F", "E8B07F", "FAF5EB"] },
    { hour: "14H", cells: ["F4DABA", "E8B07F", "F4DABA", "E8B07F", "E67E22", "E67E22", "fbe7d6"] },
    { hour: "19H", cells: ["E8B07F", "E67E22", "E8B07F", "E67E22", "c2410c", "c2410c", "E67E22"] },
    { hour: "20H", cells: ["E67E22", "c2410c", "E67E22", "c2410c", "c2410c", "c2410c", "E67E22"], highlight: 4 },
    { hour: "21H", cells: ["E8B07F", "E67E22", "E8B07F", "E67E22", "c2410c", "c2410c", "E67E22"] },
    { hour: "22H", cells: ["fbe7d6", "F4DABA", "fbe7d6", "E8B07F", "E67E22", "E67E22", "F4DABA"] },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#EDE6DC] bg-white p-6 shadow-[0_6px_18px_rgba(31,31,31,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
            INTENSIDAD DEL SALÓN · MAPA DE CALOR
          </span>
          <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
            Ocupación por mesa · últimos 7 turnos
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#6B4F3A]">
            BAJA
          </span>
          <span
            className="block h-2 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #FAF5EB 0%, #FBEEE0 40%, #E67E22 80%, #A05A1A 100%)",
            }}
          />
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#6B4F3A]">
            ALTA
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5 pl-[42px]">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <span
              key={d}
              className="flex-1 text-center font-mono text-[9px] font-bold tracking-[0.1em] text-[#6B4F3A]"
            >
              {d}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.hour} className="flex items-center gap-1.5">
            <span className="w-9 font-mono text-[9px] font-bold tracking-[0.1em] text-[#6B4F3A]">
              {r.hour}
            </span>
            {r.cells.map((c, i) => (
              <span
                key={i}
                className="h-6 flex-1 rounded-md"
                style={{
                  background: `#${c}`,
                  outline: r.highlight === i ? "2px solid #1F1F1F" : undefined,
                  outlineOffset: r.highlight === i ? "-2px" : undefined,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2.5">
        <div className="flex items-center gap-2">
          <Flame className="size-3.5 text-[#E67E22]" strokeWidth={2} />
          <span className="font-jakarta text-[12px] font-semibold">
            Pico histórico: viernes 20:00
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#FAF5EB] px-2.5 py-1">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#1F1F1F]">
            VER ANÁLISIS COMPLETO
          </span>
          <ArrowRight className="size-3 text-[#1F1F1F]" strokeWidth={2.5} />
        </span>
      </div>
    </section>
  );
}
