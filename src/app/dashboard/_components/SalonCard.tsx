import React from "react";
import Link from "next/link";
import type { DashboardSalon } from "../_lib/dashboard-data";

interface SalonCardProps {
  salon: DashboardSalon;
}

export function SalonCard({ salon }: SalonCardProps) {
  const rows = salon.rows.filter((r) => r.count > 0);
  const segments = salon.rows.filter((r) => r.pct > 0);

  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
          ESTADO DEL SALÓN
        </span>
        <Link
          href="/salon"
          className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#C2410C] hover:underline"
        >
          VER MAPA →
        </Link>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-jakarta text-[42px] font-bold leading-none tracking-[-0.015em]">
          {salon.active}
        </span>
        <span className="pb-1.5 font-jakarta text-[14px] font-medium text-[#A89D8E]">
          / {salon.total} mesas activas
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-[#EDE6DC]">
        {segments.map((s) => (
          <div
            key={s.status}
            className="h-full"
            style={{ width: `${s.pct}%`, background: s.color }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.length > 0 ? (
          rows.map((r) => (
            <div key={r.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="block size-2 rounded-[2px]"
                  style={{ background: r.color }}
                />
                <span className="font-jakarta text-[13px] font-medium">
                  {r.label}
                </span>
              </div>
              <span className="font-mono text-[13px] font-bold">{r.count}</span>
            </div>
          ))
        ) : (
          <span className="font-jakarta text-[12px] text-[#A89D8E]">
            Todas las mesas están libres.
          </span>
        )}
      </div>

      {salon.zones.length > 0 && (
        <div className="flex gap-2 border-t border-[#EDE6DC] pt-3">
          {salon.zones.map((z) => (
            <div key={z.name} className="flex flex-1 flex-col items-center gap-1">
              <span className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#6B4F3A]">
                {z.name}
              </span>
              <span
                className={`font-jakarta text-[14px] font-bold ${
                  z.total > 0 && z.active === z.total ? "text-[#C2410C]" : ""
                }`}
              >
                {z.active}/{z.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
