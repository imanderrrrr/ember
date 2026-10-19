"use client";

import { ChefHat } from "lucide-react";
import { formatTimer, type Ticket } from "./_lib/kds-data";
import { useKdsBoard } from "./_hooks/useKdsBoard";
import { KdsHeader } from "./_components/KdsHeader";
import { KdsControlBar } from "./_components/KdsControlBar";
import { KdsColumn } from "./_components/KdsColumn";
import { TicketCard } from "./_components/KdsCards";
import { KdsSidePanel } from "./_components/KdsSidePanel";

export function KdsBoard({
  initialTickets,
  dateLabel,
  timeLabel,
}: {
  initialTickets: Ticket[];
  dateLabel: string;
  timeLabel: string;
}) {
  const {
    activeStation,
    setActiveStation,
    notified,
    toggleNotify,
    tickets,
    nuevas,
    preparacion,
    listas,
    demoradas,
    effectiveStatus,
    avgDelaySec,
    criticas,
    advance,
    deliver,
  } = useKdsBoard(initialTickets);

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-[#FAF5EB] font-jakarta text-[#1F1F1F]">
      <KdsHeader dateLabel={dateLabel} timeLabel={timeLabel} />
      <KdsControlBar
        activeStation={activeStation}
        onStation={setActiveStation}
        avgDelay={formatTimer(avgDelaySec)}
        criticas={criticas}
      />
      <div className="flex min-h-0 flex-1 gap-7 overflow-hidden p-8">
        {tickets.length === 0 ? (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
              <ChefHat className="size-7 text-[#A89D8E]" strokeWidth={1.5} />
            </span>
            <span className="text-[16px] font-semibold">
              Sin comandas en cocina
            </span>
            <p className="max-w-[320px] text-[13px] leading-[1.5] text-[#6b6660]">
              Cuando un mesero envíe un pedido a cocina aparecerá aquí
              automáticamente, listo para preparar.
            </p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 gap-[18px] overflow-x-auto">
            <KdsColumn
              dot="#E67E22"
              countBg="#fbe7d6"
              countFg="#C2410C"
              title="NUEVAS"
              subtitle="Recién ingresadas · sin tocar"
              count={nuevas.length}
              headerCard
            >
              {nuevas.map((t) => (
                <TicketCard
                  key={t.id}
                  t={t}
                  notified={notified.has(t.id)}
                  onAdvance={advance}
                  onDeliver={deliver}
                  onNotify={toggleNotify}
                />
              ))}
            </KdsColumn>

            <KdsColumn
              dot="#C2410C"
              countBg="#1F1F1F"
              countFg="#FAF5EB"
              title="EN PREPARACIÓN"
              subtitle="Brigada activa · línea caliente"
              count={preparacion.length}
              headerCard
            >
              {preparacion.map((t) => (
                <TicketCard
                  key={t.id}
                  t={t}
                  notified={notified.has(t.id)}
                  onAdvance={advance}
                  onDeliver={deliver}
                  onNotify={toggleNotify}
                />
              ))}
            </KdsColumn>

            <KdsColumn
              dot="#7c8a6a"
              countBg="#7c8a6a"
              countFg="#FAF5EB"
              title="LISTAS PARA SERVIR"
              subtitle="Listas para retiro · acción del salón"
              count={listas.length}
            >
              {listas.map((t) => (
                <TicketCard
                  key={t.id}
                  t={t}
                  notified={notified.has(t.id)}
                  onAdvance={advance}
                  onDeliver={deliver}
                  onNotify={toggleNotify}
                />
              ))}
            </KdsColumn>

            <KdsColumn
              dot="#C2410C"
              countBg="#C2410C"
              countFg="#FAF5EB"
              title="DEMORADAS"
              subtitle="Pasaron del tiempo objetivo · prioridad alta"
              count={demoradas.length}
              titleColor="#C2410C"
            >
              {demoradas.map((t) => (
                <TicketCard
                  key={t.id}
                  t={t}
                  notified={notified.has(t.id)}
                  onAdvance={advance}
                  onDeliver={deliver}
                  onNotify={toggleNotify}
                />
              ))}
            </KdsColumn>
          </div>
        )}

        <KdsSidePanel
          tickets={tickets}
          counts={{
            nuevas: tickets.filter((t) => effectiveStatus(t) === "nueva").length,
            preparacion: tickets.filter((t) => effectiveStatus(t) === "preparacion")
              .length,
            listas: tickets.filter((t) => t.status === "lista").length,
            demoradas: criticas,
          }}
          avgDelaySec={avgDelaySec}
        />
      </div>
    </div>
  );
}
