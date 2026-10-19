"use client";

import React from "react";

export function KdsColumn({
  dot,
  countBg,
  countFg,
  title,
  subtitle,
  count,
  titleColor,
  headerCard,
  children,
}: {
  dot: string;
  countBg: string;
  countFg: string;
  title: string;
  subtitle: string;
  count: number;
  titleColor?: string;
  headerCard?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-w-[300px] flex-1 flex-col gap-3.5">
      <div
        className={`flex items-center justify-between ${
          headerCard
            ? "rounded-[14px] border border-[#EDE6DC] bg-white px-3.5 py-2.5"
            : "px-0.5 pb-2 pt-0.5"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="rounded-full"
            style={{ width: 10, height: 10, background: dot }}
          />
          <div className="flex flex-col gap-0.5">
            <span
              className="font-mono text-[11px] font-bold tracking-[0.16em]"
              style={{ color: titleColor ?? "#1F1F1F" }}
            >
              {title}
            </span>
            <span className="text-[11px] font-medium text-[#A89D8E]">
              {subtitle}
            </span>
          </div>
        </div>
        <span
          className="flex items-center justify-center rounded-full px-2.5 py-1 font-mono text-[11px] font-bold"
          style={{ background: countBg, color: countFg }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto pb-2">
        {children}
      </div>
    </div>
  );
}
