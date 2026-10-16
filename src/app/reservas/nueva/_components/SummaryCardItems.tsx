"use client";

import React from "react";
import { Check, type LucideIcon } from "lucide-react";

export function SummaryCardConfirmed({
  icon: Icon,
  eyebrow,
  primary,
  secondary,
}: {
  icon: LucideIcon;
  eyebrow: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl bg-[#fbe7d6] p-3.5"
      style={{ border: "1.5px solid #e67e22" }}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="size-3.5 text-[#7a2e14]" strokeWidth={1.8} />
        <span
          className="font-mono text-[10px] font-bold text-[#7a2e14]"
          style={{ letterSpacing: "1.4px" }}
        >
          {eyebrow}
        </span>
        <span className="flex-1" />
        <span className="flex size-[18px] items-center justify-center rounded-full bg-[#e67e22]">
          <Check className="size-2.5 text-white" strokeWidth={3} />
        </span>
      </div>
      <span
        className="font-mono text-[18px] font-bold text-[#1f1f1f]"
        style={{ letterSpacing: "-0.2px" }}
      >
        {primary}
      </span>
      <span className="text-[12px] text-[#6b4f3a]">{secondary}</span>
    </div>
  );
}

export function SummaryCardPending({
  icon: Icon,
  eyebrow,
  primary,
  secondary,
  stepLabel,
}: {
  icon: LucideIcon;
  eyebrow: string;
  primary: string;
  secondary: string;
  stepLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5">
      <div className="flex items-center gap-2.5">
        <Icon className="size-3.5 text-[#a89d8e]" strokeWidth={1.8} />
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          {eyebrow}
        </span>
        <span className="flex-1" />
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "0.8px" }}
        >
          {stepLabel}
        </span>
      </div>
      <span className="font-mono text-[16px] font-bold text-[#a89d8e]">
        {primary}
      </span>
      {secondary && (
        <span className="text-[11px] text-[#a89d8e]">{secondary}</span>
      )}
    </div>
  );
}

export function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[22px] items-center justify-center rounded-md border border-[#ede6dc] bg-[#f7f3ee] px-2">
        <span className="font-mono text-[11px] font-bold text-[#6b4f3a]">
          {keys}
        </span>
      </span>
      <span className="text-[11px] text-[#6b4f3a]">{label}</span>
    </div>
  );
}
