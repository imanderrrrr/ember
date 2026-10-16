"use client";

import { Check } from "lucide-react";
import { STEP_META, TIME_REMAINING, TOTAL_STEPS } from "../_lib/wizard-constants";

interface WizardStepperHeaderProps {
  step: number;
}

export function WizardStepperHeader({ step }: WizardStepperHeaderProps) {
  return (
    <div className="flex h-[120px] items-center justify-center border-b border-[#ede6dc] bg-white px-7">
      <div className="flex w-full items-center justify-between gap-6">
        <div className="flex-1" />

        <div className="flex items-center">
          {STEP_META.map((meta, i) => {
            const idx = i + 1;
            const active = idx === step;
            const past = idx < step;
            return (
              <div key={meta.label} className="flex items-center">
                <div
                  className="flex flex-col items-center gap-2"
                  style={{ width: active ? 200 : 140 }}
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-full"
                    style={{
                      background: active
                        ? "#e67e22"
                        : past
                          ? "#7c8a6a"
                          : "#f7f3ee",
                      border: active || past ? "none" : "1px solid #ede6dc",
                    }}
                  >
                    {past ? (
                      <Check className="size-4 text-white" strokeWidth={2.5} />
                    ) : (
                      <span
                        className="font-mono text-[13px] font-bold"
                        style={{
                          color: active ? "#FFFFFF" : "#a89d8e",
                        }}
                      >
                        {meta.number}
                      </span>
                    )}
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className="font-mono text-[11px] font-bold"
                      style={{
                        color: active
                          ? "#1f1f1f"
                          : past
                            ? "#5b6e48"
                            : "#a89d8e",
                        letterSpacing: "1.2px",
                      }}
                    >
                      {meta.label}
                    </span>
                    {active && (
                      <span className="text-[11px] text-[#6b4f3a]">
                        {meta.sub}
                      </span>
                    )}
                  </div>
                </div>
                {idx < TOTAL_STEPS && (
                  <div className="flex h-[42px] w-20 items-center justify-center">
                    <span
                      className="h-0.5 w-full"
                      style={{ background: idx < step ? "#7c8a6a" : "#ede6dc" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        <span className="flex items-center gap-2 rounded-full border border-[#ede6dc] bg-[#f7f3ee] px-3 py-1.5">
          <span className="block size-2 rounded-full bg-[#7c8a6a]" />
          <span className="text-[12px] text-[#6b4f3a]">
            Tiempo estimado · {TIME_REMAINING[step] ?? "—"}
          </span>
        </span>
      </div>
    </div>
  );
}
