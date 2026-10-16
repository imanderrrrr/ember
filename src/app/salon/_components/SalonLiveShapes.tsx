"use client";

import React from "react";
import { DoorOpen, SquareUser } from "lucide-react";
import type { Shape } from "../_lib/types";

interface SalonLiveShapesProps {
  shape: Shape;
}

export function SalonLiveShapes({ shape }: SalonLiveShapesProps) {
  const base = {
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
  };

  switch (shape.kind) {
    case "wall":
      return <div className="absolute bg-[#6B4F3A]" style={base} />;
    case "window":
      return (
        <>
          <div className="absolute bg-[#7C8A6A]" style={base} />
          {shape.label && (
            <span
              className="absolute font-mono text-[9px] tracking-[0.16em] text-[#7C8A6A]"
              style={{ left: shape.x, top: shape.y + 14 }}
            >
              {shape.label}
            </span>
          )}
        </>
      );
    case "door":
      return (
        <div className="absolute flex flex-col gap-1.5" style={base}>
          <div className="flex items-center gap-2">
            <DoorOpen className="size-3.5 text-[#6B4F3A]" strokeWidth={2} />
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#6B4F3A]">
              {(shape.label ?? "ENTRADA").toUpperCase()}
            </span>
          </div>
          <div className="h-0.5 w-full bg-[#6B4F3A]" />
        </div>
      );
    case "plant": {
      const size = Math.min(shape.width, shape.height);
      return (
        <>
          <div
            className="absolute rounded-full bg-[#7C8A6A] opacity-70"
            style={{ left: shape.x, top: shape.y, width: size, height: size }}
          />
          <div
            className="absolute rounded-full bg-[#7c8a6a]"
            style={{
              left: shape.x + size * 0.28,
              top: shape.y + size * 0.28,
              width: size * 0.44,
              height: size * 0.44,
            }}
          />
        </>
      );
    }
    case "column":
      return <div className="absolute bg-[#6B4F3A]" style={base} />;
    case "restroom":
      return (
        <div
          className="absolute flex flex-col items-center justify-center gap-1 rounded bg-[#D8CEC2] p-2.5"
          style={base}
        >
          <SquareUser className="size-[18px] text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B4F3A]">
            {(shape.label ?? "BAÑOS").toUpperCase()}
          </span>
        </div>
      );
    case "bar":
      return (
        <div
          className="absolute flex flex-col justify-center gap-1.5 rounded-md bg-[#1F1F1F] px-[18px] py-3.5"
          style={base}
        >
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#E67E22]">
            {(shape.label ?? "BARRA").toUpperCase()}
          </span>
        </div>
      );
    case "kitchen_pass":
      return (
        <div
          className="absolute flex flex-col gap-1.5 rounded-md bg-[#1F1F1F] px-[18px] py-3.5"
          style={base}
        >
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#E67E22]">
            {(shape.label ?? "PASE DE COCINA").toUpperCase()}
          </span>
          <div className="h-px w-full bg-[#3a322c]" />
          <span className="text-[11px] text-[#D8CEC2]">
            Servicio activo · Chef Vidal
          </span>
        </div>
      );
    case "divider":
      return <div className="absolute bg-[#D8CEC2] opacity-70" style={base} />;
    case "text":
      return (
        <span
          className="absolute whitespace-nowrap font-mono font-semibold tracking-[0.16em] text-[#6B4F3A]"
          style={{
            left: shape.x,
            top: shape.y,
            fontSize: shape.height,
            lineHeight: 1,
          }}
        >
          {shape.label ?? ""}
        </span>
      );
    default:
      return null;
  }
}
