"use client";

import React from "react";
import type { TableStatus } from "../_lib/types";

interface DrawerOrderStepperProps {
  status: TableStatus;
}

export function DrawerOrderStepper({ status }: DrawerOrderStepperProps) {
  const steps = ["Pedido", "En cocina", "Servido", "Pagado"] as const;
  const activeIdx = (() => {
    if (status === "ocupada") return 0;
    if (status === "cocina") return 1;
    if (status === "esperando") return 2;
    if (status === "limpieza") return 3;
    return -1;
  })();

  return (
    <>
      <div className="flex items-center">
        {steps.map((_, i) => {
          const past = i < activeIdx;
          const active = i === activeIdx;
          return (
            <span key={i} className="flex flex-1 items-center last:flex-none">
              <span
                className={`block rounded-full ${
                  active ? "size-3.5 ring-[3px] ring-[#E67E2233]" : "size-2.5"
                }`}
                style={{
                  background: active
                    ? "#E67E22"
                    : past
                    ? "#1F1F1F"
                    : "#D8CEC2",
                }}
              />
              {i < steps.length - 1 && (
                <span
                  className="h-px flex-1"
                  style={{ background: past ? "#1F1F1F" : "#D8CEC2" }}
                />
              )}
            </span>
          );
        })}
      </div>
      <div className="flex justify-between">
        {steps.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] ${
              i === activeIdx
                ? "font-semibold text-[#E67E22]"
                : i < activeIdx
                ? "text-[#1F1F1F]"
                : "text-[#6B6660]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </>
  );
}
