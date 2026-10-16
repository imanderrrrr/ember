"use client";

import React from "react";
import { Bell, ChevronRight, Clock } from "lucide-react";

interface Rule {
  icon: "timer" | "layers" | "bell" | "shield";
  label: string;
  value: string;
  muted?: boolean;
  chevron?: boolean;
}

const RULES: Rule[] = [
  { icon: "timer", label: "Duración mesa", value: "90 min" },
  { icon: "layers", label: "Buffer entre reservas", value: "30 min" },
  { icon: "bell", label: "Recordatorio al cliente", value: "24h antes" },
  {
    icon: "shield",
    label: "Garantía de tarjeta",
    value: "No requerida",
    muted: true,
    chevron: true,
  },
];

export function Step2RulesCard() {
  return (
    <section
      className="animate-r2-up flex w-[520px] flex-col gap-3.5 rounded-2xl border border-[#ede6dc] bg-white p-5"
      style={{ animationDelay: "1280ms" }}
    >
      <div className="flex flex-col gap-1">
        <span
          className="font-mono text-[11px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.6px" }}
        >
          CONFIGURACIÓN DEL TURNO
        </span>
        <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
          Reglas aplicadas
        </span>
      </div>
      <div className="flex flex-col">
        {RULES.map((r, i) => (
          <div key={r.label}>
            <div
              className="animate-r2-up flex items-center justify-between py-2.5"
              style={{ animationDelay: `${1380 + i * 60}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <RuleIcon name={r.icon} muted={r.muted} />
                <span
                  className="text-[13px]"
                  style={{
                    color: r.muted ? "#6b4f3a" : "#1f1f1f",
                    fontWeight: r.muted ? 500 : 600,
                  }}
                >
                  {r.label}
                </span>
              </div>
              {r.chevron ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-semibold text-[#a89d8e]">
                    {r.value}
                  </span>
                  <ChevronRight
                    className="size-3.5 text-[#a89d8e]"
                    strokeWidth={1.8}
                  />
                </div>
              ) : (
                <span className="font-mono text-[13px] font-bold text-[#1f1f1f]">
                  {r.value}
                </span>
              )}
            </div>
            {i < RULES.length - 1 && (
              <span className="block h-px w-full bg-[#ede6dc]" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function RuleIcon({
  name,
  muted,
}: {
  name: "timer" | "layers" | "bell" | "shield";
  muted?: boolean;
}) {
  const color = muted ? "#a89d8e" : "#7c8a6a";
  const props = { className: "size-3.5", strokeWidth: 1.8, color };
  if (name === "timer") return <Clock {...props} />;
  if (name === "bell") return <Bell {...props} />;
  if (name === "layers") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={14}
        height={14}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
