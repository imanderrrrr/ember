"use client";

import {
  ArrowRight,
  Flame,
  Timer,
  TriangleAlert,
} from "lucide-react";
import {
  STATION_LABEL,
  formatTimer,
  type Station,
  type Ticket,
  type TicketStatus,
} from "../_lib/kds-data";

export function ItemRow({
  item,
  muted,
}: {
  item: Ticket["items"][number];
  muted?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="font-mono text-[12px] font-bold text-[#C2410C]">
        {item.qty}×
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span
          className={`text-[13px] ${muted ? "font-medium" : "font-semibold"} text-[#1F1F1F]`}
        >
          {item.name}
        </span>
        {item.mods && (
          <span
            className={`text-[11px] ${
              muted ? "italic text-[#A89D8E]" : "font-medium text-[#6B4F3A]"
            }`}
          >
            {muted ? item.mods : `· ${item.mods}`}
          </span>
        )}
      </div>
    </div>
  );
}

export function StationChip({ station }: { station: Station }) {
  if (station === "parrilla") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-[#1F1F1F] px-2.5 py-1">
        <Flame className="size-2.5 text-[#E67E22]" strokeWidth={2} />
        <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#FAF5EB]">
          PARRILLA
        </span>
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#EDE6DC] bg-white px-2.5 py-1">
      <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#1F1F1F]">
        {STATION_LABEL[station].toUpperCase()}
      </span>
    </span>
  );
}

export function CategoryChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#EDE6DC] bg-white px-2.5 py-1">
      <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#1F1F1F]">
        {label}
      </span>
    </span>
  );
}

export function NuevaCard({
  t,
  onAdvance,
}: {
  t: Ticket;
  onAdvance: (id: string, to: TicketStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#EDE6DC] bg-white p-[18px]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold">
            Mesa {t.tableLabel} · {t.zoneName}
          </span>
          <span className="text-[11px] font-medium text-[#A89D8E]">
            Comanda {t.comanda} · {t.comensales} comensales
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[18px] font-bold tracking-[0.06em]">
            {formatTimer(t.elapsedSec)}
          </span>
          <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#A89D8E]">
            INGRESÓ {t.ingreso}
          </span>
        </div>
      </div>
      <span className="h-px w-full bg-[#EDE6DC]" />
      <div className="flex flex-col gap-2">
        {t.items.map((it, i) => (
          <ItemRow key={i} item={it} />
        ))}
      </div>
      {t.note && (
        <div className="flex items-center gap-2 rounded-[10px] bg-[#fbe7d6] px-2.5 py-2">
          <TriangleAlert className="size-3.5 shrink-0 text-[#C2410C]" strokeWidth={2} />
          <span className="text-[12px] font-semibold text-[#C2410C]">{t.note}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <StationChip station={t.station} />
        <CategoryChip label={t.category} />
        <span className="rounded-full bg-[#fbe7d6] px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.12em] text-[#C2410C]">
          NUEVA
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#A89D8E]">
          Mesero · {t.mesero}
        </span>
        <button
          type="button"
          onClick={() => onAdvance(t.id, "preparacion")}
          className="flex items-center gap-1.5 rounded-[10px] bg-[#1F1F1F] px-3 py-2 transition-opacity hover:opacity-90"
        >
          <span className="text-[12px] font-semibold text-[#FAF5EB]">
            Asumir orden
          </span>
          <ArrowRight className="size-3 text-[#E67E22]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

export function PrepCard({
  t,
  onAdvance,
}: {
  t: Ticket;
  onAdvance: (id: string, to: TicketStatus) => void;
}) {
  const stages = t.stages ?? { done: 0, total: t.items.length };
  const pct = stages.total > 0 ? Math.round((stages.done / stages.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#EDE6DC] bg-white p-[18px]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold">
            Mesa {t.tableLabel} · {t.zoneName}
          </span>
          <span className="text-[11px] font-medium text-[#A89D8E]">
            Comanda {t.comanda} · {t.comensales} comensales
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="flex items-center gap-1.5 rounded-lg bg-[#fbe7d6] px-2 py-1">
            <Timer className="size-2.5 text-[#C2410C]" strokeWidth={2} />
            <span className="font-mono text-[14px] font-bold tracking-[0.04em] text-[#C2410C]">
              {formatTimer(t.elapsedSec)}
            </span>
          </span>
          <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#A89D8E]">
            INGRESÓ {t.ingreso}
          </span>
        </div>
      </div>
      <span className="h-px w-full bg-[#EDE6DC]" />
      <div className="flex flex-col gap-2">
        {t.items.map((it, i) => (
          <ItemRow key={i} item={it} />
        ))}
      </div>
      <div className="flex flex-col gap-1.5 rounded-[12px] bg-[#FAF5EB] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#A89D8E]">
            AVANCE DE LÍNEA
          </span>
          <span className="font-mono text-[9px] font-bold tracking-[0.08em]">
            {stages.done} / {stages.total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EDE6DC]">
          <div
            className="h-full rounded-full bg-[#C2410C] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StationChip station={t.station} />
        <CategoryChip label={t.category} />
        {t.vip && (
          <span className="rounded-full bg-[#fbe7d6] px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.12em] text-[#C2410C]">
            VIP
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#A89D8E]">
          Brigada · {t.mesero}
        </span>
        <button
          type="button"
          onClick={() => onAdvance(t.id, "lista")}
          className="flex items-center gap-1.5 rounded-[10px] bg-[#E67E22] px-3 py-2 transition-colors hover:bg-[#c2410c]"
        >
          <span className="text-[12px] font-bold text-[#1F1F1F]">Marcar listo</span>
        </button>
      </div>
    </div>
  );
}

export function ListaCard({
  t,
  notified,
  onDeliver,
  onNotify,
}: {
  t: Ticket;
  notified: boolean;
  onDeliver: (t: Ticket) => void;
  onNotify: (id: string) => void;
}) {
  const dark = t.variant === "vip";
  const cream = t.variant === "takeaway";
  const bg = dark ? "#1F1F1F" : cream ? "#fbe7d6" : "#FFFFFF";
  const fg = dark ? "#FAF5EB" : "#1F1F1F";
  const sub = dark ? "#A89D8E" : "#6B4F3A";
  const sep = dark ? "#3a322c" : "#EDE6DC";

  return (
    <div
      className="flex flex-col gap-3 rounded-[18px] p-[18px]"
      style={{
        background: bg,
        border: dark ? "none" : `1px solid ${cream ? "#E8B07F" : "#EDE6DC"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-semibold" style={{ color: fg }}>
            Mesa {t.tableLabel} · {t.zoneName}
          </span>
          <span
            className="font-mono text-[9px] tracking-[0.12em]"
            style={{ color: dark ? "#A89D8E" : "#A89D8E" }}
          >
            INGRESO {t.ingreso}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-bold tracking-[0.04em] text-[#7c8a6a]">
            00:00 · LISTO
          </span>
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#A89D8E]">
            OBJETIVO {formatTimer(t.targetSec)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: sub }}>
          {t.comanda}
        </span>
        <span className="size-[3px] rounded-full bg-[#d8cec2]" />
        <span className="text-[11px]" style={{ color: sub }}>
          Mesero {t.mesero}
        </span>
        <span className="size-[3px] rounded-full bg-[#d8cec2]" />
        <span className="text-[11px]" style={{ color: sub }}>
          {t.comensales} comensales
        </span>
      </div>
      <span className="h-px w-full" style={{ background: sep }} />
      <div className="flex flex-col gap-2">
        {t.items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <span className="font-mono text-[12px] font-bold text-[#C2410C]">
              {it.qty}×
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-[13px] font-medium" style={{ color: fg }}>
                {it.name}
              </span>
              {it.mods && (
                <span className="text-[11px] italic text-[#A89D8E]">{it.mods}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-[12px] px-2.5 py-1"
          style={{
            background: dark ? "#3a322c" : "#FAF5EB",
            border: dark ? "none" : "1px solid #EDE6DC",
          }}
        >
          <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#6B4F3A]">
            {STATION_LABEL[t.station].toUpperCase()}
          </span>
        </span>
        <span className="rounded-[12px] bg-[#7c8a6a] px-2.5 py-1">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#FAF5EB]">
            LISTO
          </span>
        </span>
        {t.vip && (
          <span className="rounded-[12px] bg-[#E67E22] px-2.5 py-1">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#1F1F1F]">
              VIP
            </span>
          </span>
        )}
      </div>
      <div className="flex gap-2 pt-1.5">
        <button
          type="button"
          onClick={() => onNotify(t.id)}
          className="flex flex-1 items-center justify-center rounded-[12px] px-3 py-2.5 transition-colors"
          style={{ background: notified ? "#7c8a6a" : "#C2410C" }}
        >
          <span className="text-[12px] font-semibold text-[#FAF5EB]">
            {notified ? "Salón avisado ✓" : "Avisar a salón"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDeliver(t)}
          className="flex flex-1 items-center justify-center rounded-[12px] bg-white px-3 py-2.5 transition-colors hover:bg-[#F7F3EE]"
          style={{ border: "1px solid #EDE6DC" }}
        >
          <span className="text-[12px] font-medium text-[#1F1F1F]">
            Marcar entregado
          </span>
        </button>
      </div>
    </div>
  );
}

export function DemoraCard({
  t,
  notified,
  onAdvance,
  onNotify,
}: {
  t: Ticket;
  notified: boolean;
  onAdvance: (id: string, to: TicketStatus) => void;
  onNotify: (id: string) => void;
}) {
  const over = t.elapsedSec - t.targetSec;
  return (
    <div className="flex overflow-hidden rounded-[18px] border-[1.5px] border-[#E8B07F] bg-[#fbe7d6]">
      <span className="w-1 shrink-0 bg-[#C2410C]" />
      <div className="flex flex-1 flex-col gap-3 p-[18px] pl-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-semibold">
              Mesa {t.tableLabel} · {t.zoneName}
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#C2410C]">
              INGRESO {t.ingreso} · {t.items.length} PLATOS DEMORADOS
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="flex items-center gap-1.5">
              <Flame className="size-3.5 text-[#C2410C]" strokeWidth={2} />
              <span className="font-mono text-[13px] font-bold tracking-[0.04em] text-[#C2410C]">
                {formatTimer(t.elapsedSec)} · DEMORA
              </span>
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B4F3A]">
              OBJETIVO {formatTimer(t.targetSec)} · +{formatTimer(over > 0 ? over : 0)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-[#6B4F3A]">
            {t.comanda}
          </span>
          <span className="size-[3px] rounded-full bg-[#d8cec2]" />
          <span className="text-[11px] text-[#6B4F3A]">Mesera {t.mesero}</span>
          <span className="size-[3px] rounded-full bg-[#d8cec2]" />
          <span className="text-[11px] text-[#6B4F3A]">{t.comensales} comensales</span>
        </div>
        <span className="h-px w-full bg-[#EDE6DC]" />
        <div className="flex flex-col gap-2">
          {t.items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-mono text-[12px] font-bold text-[#C2410C]">
                {it.qty}×
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[13px] font-medium text-[#1F1F1F]">
                  {it.name}
                </span>
                {it.mods && (
                  <span className="text-[11px] italic text-[#A89D8E]">{it.mods}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-[12px] border border-[#EDE6DC] bg-[#FAF5EB] px-2.5 py-1">
            <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#6B4F3A]">
              {STATION_LABEL[t.station].toUpperCase()}
            </span>
          </span>
          <span className="rounded-[12px] bg-[#1F1F1F] px-2.5 py-1">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#E67E22]">
              CRÍTICA
            </span>
          </span>
          {t.glutenFree && (
            <span className="rounded-[12px] bg-[#1F1F1F] px-2.5 py-1">
              <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#FAF5EB]">
                GLUTEN
              </span>
            </span>
          )}
        </div>
        {t.reclamos != null && (
          <div className="flex items-center gap-1.5">
            <TriangleAlert className="size-3 text-[#C2410C]" strokeWidth={2} />
            <span className="font-mono text-[10px] tracking-[0.06em] text-[#C2410C]">
              Reclamado ×{t.reclamos} · último {t.lastReclamo}
            </span>
          </div>
        )}
        <div className="flex gap-2 pt-1.5">
          <button
            type="button"
            onClick={() => onAdvance(t.id, "preparacion")}
            className="flex flex-1 items-center justify-center rounded-[12px] bg-[#1F1F1F] px-3 py-2.5 transition-opacity hover:opacity-90"
          >
            <span className="text-[12px] font-semibold text-[#FAF5EB]">
              Asumir por brigada
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNotify(t.id)}
            className="flex flex-1 items-center justify-center rounded-[12px] border border-[#EDE6DC] bg-[#fbe7d6] px-3 py-2.5 transition-colors hover:bg-white"
          >
            <span className="text-[12px] font-medium text-[#1F1F1F]">
              {notified ? "Chef avisado ✓" : "Avisar al chef"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function TicketCard({
  t,
  notified,
  onAdvance,
  onDeliver,
  onNotify,
}: {
  t: Ticket;
  notified: boolean;
  onAdvance: (id: string, to: TicketStatus) => void;
  onDeliver: (t: Ticket) => void;
  onNotify: (id: string) => void;
}) {
  // Estado efectivo: una orden activa vencida se pinta como Demorada.
  const eff: TicketStatus =
    (t.status === "nueva" || t.status === "preparacion") &&
    t.elapsedSec > t.targetSec
      ? "demorada"
      : t.status;
  if (eff === "nueva") return <NuevaCard t={t} onAdvance={onAdvance} />;
  if (eff === "preparacion") return <PrepCard t={t} onAdvance={onAdvance} />;
  if (eff === "lista")
    return (
      <ListaCard t={t} notified={notified} onDeliver={onDeliver} onNotify={onNotify} />
    );
  return (
    <DemoraCard t={t} notified={notified} onAdvance={onAdvance} onNotify={onNotify} />
  );
}
