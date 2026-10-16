"use client";

import React from "react";

interface WizardStepContainerProps {
  stepLabel: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function WizardStepContainer({
  stepLabel,
  title,
  subtitle,
  children,
}: WizardStepContainerProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span
          className="font-mono text-[11px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.6px" }}
        >
          {stepLabel}
        </span>
        <h1
          className="font-mono text-[24px] font-bold leading-tight text-[#1f1f1f]"
          style={{ letterSpacing: "-0.3px" }}
        >
          {title}
        </h1>
        <p className="max-w-[640px] text-[13px] leading-[1.45] text-[#6b4f3a]">
          {subtitle}
        </p>
      </div>
      {children}
    </>
  );
}

export function WizardCardSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#ede6dc] bg-white p-5">
      {title && (
        <span
          className="font-mono text-[10px] font-bold text-[#6b4f3a]"
          style={{ letterSpacing: "1.4px" }}
        >
          {title.toUpperCase()}
        </span>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
