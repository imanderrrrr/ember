"use client";

import React from "react";
import { ChefHat, Flame, Package, Sparkles, Timer, TrendingUp, TriangleAlert } from "lucide-react";
import { STATION_LABEL, formatTimer, type Station, type Ticket } from "../_lib/kds-data";

export function KdsSidePanel({
  tickets,
  counts,
  avgDelaySec,
}: {
  tickets: Ticket[];
  counts: { nuevas: number; preparacion: number; listas: number; demoradas: number };
  avgDelaySec: number;
}) {
  // Carga por estación (sobre tickets activos).
  const active = tickets.filter((t) => t.status !== "lista");
  const stationCounts = new Map<Station, number>();
  for (const t of active)
    stationCounts.set(t.station, (stationCounts.get(t.station) ?? 0) + 1);
  const maxStation = Math.max(1, ...stationCounts.values());
  const topStations = (["parrilla", "platos", "entradas"] as Station[]).map((s) => ({
    station: s,
    count: stationCounts.get(s) ?? 0,
    pct: Math.round(((stationCounts.get(s) ?? 0) / maxStation) * 100),
  }));
  const leadStation = topStations[0];

  // Platillo líder (item más frecuente).
  const itemCounts = new Map<string, number>();
  for (const t of tickets)
    for (const it of t.items)
      itemCounts.set(it.name, (itemCounts.get(it.name) ?? 0) + it.qty);
  let leadItem = "—";
  let leadItemQty = 0;
  for (const [name, qty] of itemCounts)
    if (qty > leadItemQty) {
      leadItem = name;
      leadItemQty = qty;
    }

  const metaSec = 13 * 60 + 24;
  const avgPct = Math.min(100, Math.round((avgDelaySec / (20 * 60)) * 100));

  return (
    <aside className="flex w-[380px] shrink-0 flex-col gap-[18px] overflow-y-auto">
      {/* Resumen del servicio */}
      <div className="flex flex-col gap-[18px] rounded-2xl border border-[#EDE6DC] bg-white p-[22px] shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold">
              Resumen del servicio · Cocina
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#fbe7d6] px-2 py-1">
              <span className="size-1.5 rounded-full bg-[#E67E22]" />
              <span className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#C2410C]">
                EN VIVO
              </span>
            </span>
          </div>
          <span className="text-[12px] text-[#6b6660]">
            Resumen operativo en tiempo real
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-[#EDE6DC]">
          <StatCell label="NUEVAS" value={counts.nuevas} labelColor="#c2410c" />
          <StatCell label="EN PREPARACIÓN" value={counts.preparacion} labelColor="#c2410c" />
          <StatCell label="LISTAS" value={counts.listas} labelColor="#7c8a6a" />
          <StatCell
            label="DEMORADAS"
            value={counts.demoradas}
            labelColor="#7a2e14"
            valueColor="#c95a3d"
          />
        </div>
      </div>

      {/* Tiempo promedio */}
      <div className="flex flex-col gap-4 rounded-2xl bg-[#1F1F1F] p-[22px]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#E8B07F]">
            TIEMPO PROMEDIO DE PREPARACIÓN
          </span>
          <Timer className="size-4 text-[#E8B07F]" strokeWidth={1.8} />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-[42px] font-bold leading-none text-[#FAF5EB]">
            {formatTimer(avgDelaySec)}
          </span>
          <span className="pb-2 text-[14px] font-medium text-[#6b6660]">min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3 text-[#e67e22]" strokeWidth={2} />
          <span className="text-[12px] font-medium text-[#a89d8e]">
            {avgDelaySec > metaSec ? "+" : "−"}
            {formatTimer(Math.abs(avgDelaySec - metaSec))} vs meta del turno (13:24)
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0E0A08]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${avgPct}%`,
                background: "linear-gradient(90deg, #A05A1A, #FF8400)",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#6b6660]">
              META 13:24
            </span>
            <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#E8B07F]">
              ACTUAL {formatTimer(avgDelaySec)}
            </span>
          </div>
        </div>
      </div>

      {/* Estación con mayor carga */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#EDE6DC] bg-white p-5 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#c2410c]">
            ESTACIÓN CON MAYOR CARGA
          </span>
          <span className="flex size-7 items-center justify-center rounded-full bg-[#fbe7d6]">
            <ChefHat className="size-3.5 text-[#C2410C]" strokeWidth={1.8} />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[24px] font-bold">
            {STATION_LABEL[leadStation.station]}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#fbe7d6] px-2.5 py-1.5">
            <span className="size-[5px] rounded-full bg-[#E67E22]" />
            <span className="text-[11px] font-semibold text-[#c2410c]">
              {leadStation.count} órdenes activas
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {topStations.map((s, i) => (
            <div key={s.station} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium">
                  {STATION_LABEL[s.station]}
                </span>
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.12em]"
                  style={{ color: i === 0 ? "#c2410c" : "#6b6660" }}
                >
                  {s.pct}%
                </span>
              </div>
              <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#f7f3ee]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.pct}%`, background: i === 0 ? "#E67E22" : "#C2410C" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platillo líder */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-[#E8B07F] bg-[#fbe7d6] p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#E8B07F] bg-white">
          <Flame className="size-5 text-[#C2410C]" strokeWidth={1.8} />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#c2410c]">
            PLATILLO CON MAYOR SALIDA
          </span>
          <span className="text-[18px] font-semibold">{leadItem}</span>
          <span className="text-[12px] font-medium text-[#7a2e14]">
            {leadItemQty} órdenes en cocina
          </span>
        </div>
      </div>

      {/* Ember Insight */}
      <div className="flex flex-col gap-3.5 rounded-2xl bg-[#1F1F1F] p-[22px]">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#1f1f1f] ring-1 ring-[#3a322c]">
            <Sparkles className="size-3 text-[#e67e22]" strokeWidth={2} />
          </span>
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#e67e22]">
            EMBER INSIGHT · RECOMENDACIÓN
          </span>
        </div>
        <p className="text-[13px] font-medium leading-[1.5] text-[#FAF5EB]">
          Conviene reforzar emplatado en los próximos 20 min. La{" "}
          {STATION_LABEL[leadStation.station]} concentra el {leadStation.pct}% de la
          carga.
        </p>
        <span className="h-px w-full bg-[#3a322c]" />
        <p className="text-[11px] font-medium italic leading-[1.4] text-[#c2410c]">
          “El pase define el ritmo del salón.”
        </p>
      </div>

      {/* Alertas operativas */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EDE6DC] bg-white p-5 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#7a2e14]">
            ALERTAS OPERATIVAS
          </span>
          <span className="rounded-full bg-[#fbe7d6] px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-[#7a2e14]">
            2
          </span>
        </div>
        <AlertItem
          icon={<TriangleAlert className="size-3.5 text-[#c95a3d]" strokeWidth={1.8} />}
          title="Mesa 07 supera tiempo promedio"
          sub="+04:18 sobre el promedio"
        />
        <AlertItem
          icon={<Package className="size-3.5 text-[#c95a3d]" strokeWidth={1.8} />}
          title="Cocina sin morcilla en stock"
          sub="Sustituir o retirar del menú"
        />
      </div>
    </aside>
  );
}

export function StatCell({
  label,
  value,
  labelColor,
  valueColor,
}: {
  label: string;
  value: number;
  labelColor: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-white p-3.5">
      <span
        className="font-mono text-[9px] font-semibold tracking-[0.14em]"
        style={{ color: labelColor }}
      >
        {label}
      </span>
      <span
        className="text-[30px] font-bold leading-none"
        style={{ color: valueColor ?? "#1F1F1F" }}
      >
        {value}
      </span>
    </div>
  );
}

export function AlertItem({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] bg-[#fbe7d6] px-3 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-semibold text-[#1F1F1F]">{title}</span>
        <span className="text-[11px] font-medium text-[#7a2e14]">{sub}</span>
      </div>
    </div>
  );
}
