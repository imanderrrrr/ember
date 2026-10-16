"use client";

import { Cake, Check, User, type LucideIcon } from "lucide-react";

export function SideStepConfirmed({
  delay,
  eyebrow,
  actionLabel,
  rows,
}: {
  delay: string;
  eyebrow: string;
  actionLabel: string;
  rows: { icon: LucideIcon; text: string }[];
}) {
  return (
    <div
      className="animate-r3-up flex flex-col gap-2 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center rounded-full bg-[#7c8a6a]">
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </span>
          <span
            className="font-mono text-[10px] font-bold text-[#5b6e48]"
            style={{ letterSpacing: "1.4px" }}
          >
            {eyebrow}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-medium text-[#e67e22]"
        >
          <span className="text-[10px]">✎</span>
          {actionLabel}
        </button>
      </div>
      {rows.map((r) => (
        <div key={r.text} className="flex items-center gap-2">
          <r.icon className="size-3.5 text-[#6b4f3a]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#1f1f1f]">{r.text}</span>
        </div>
      ))}
    </div>
  );
}

export function SideStepPending({
  delay,
  eyebrow,
  primary,
  secondary,
  rows,
}: {
  delay: string;
  eyebrow: string;
  primary: string;
  secondary: string;
  rows: string[];
}) {
  return (
    <div
      className="animate-r3-up flex flex-col gap-2 rounded-xl border border-[#ede6dc] bg-white p-3.5"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex size-4 items-center justify-center rounded-full border border-dashed border-[#a89d8e]"
        />
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          {eyebrow}
        </span>
      </div>
      <span className="font-mono text-[14px] font-semibold text-[#a89d8e]">
        {primary}
      </span>
      {rows.map((r) => (
        <div key={r} className="flex items-center gap-2">
          <span className="size-1 rounded-full bg-[#d8cec2]" />
          <span className="text-[11px] text-[#a89d8e]">{r}</span>
        </div>
      ))}
      <span className="text-[11px] italic text-[#a89d8e]">{secondary}</span>
    </div>
  );
}

export function ShortcutBtn({
  icon,
  label,
}: {
  icon: "refresh" | "user" | "cake";
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-2.5 rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5"
    >
      <span className="text-[#6b4f3a]">
        {icon === "refresh" && (
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        )}
        {icon === "user" && <User className="size-3.5" strokeWidth={1.8} />}
        {icon === "cake" && <Cake className="size-3.5" strokeWidth={1.8} />}
      </span>
      <span className="text-[12px] text-[#1f1f1f]">{label}</span>
    </button>
  );
}
