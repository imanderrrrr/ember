"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { DoorOpen, Leaf, SquareUser } from "lucide-react";
import type { Shape } from "../../_lib/types";

/**
 * Renderiza una forma decorativa (pared, puerta, ventanal, …). Cada `kind`
 * tiene su propio look — colores/iconos vienen de las constantes definidas
 * abajo. El bbox `width × height` sirve como hitbox para drag/select.
 */

const SHAPE_STYLE: Record<
  string,
  {
    fill: string;
    label: string;
    icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }
> = {
  wall: { fill: "#6B4F3A", label: "Pared" },
  door: { fill: "#6B4F3A", label: "Puerta", icon: DoorOpen },
  window: { fill: "#7C8A6A", label: "Ventanal" },
  plant: { fill: "#7C8A6A", label: "Planta", icon: Leaf },
  column: { fill: "#6B4F3A", label: "Columna" },
  restroom: { fill: "#D8CEC2", label: "Baños", icon: SquareUser },
  bar: { fill: "#1F1F1F", label: "Barra" },
  kitchen_pass: { fill: "#1F1F1F", label: "Pase de cocina" },
  divider: { fill: "#D8CEC2", label: "Divisor" },
};

export function ShapeNode({
  shape,
  position,
  selected,
  onPointerDown,
}: {
  shape: Shape;
  position: { x: number; y: number } | null;
  selected: boolean;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const x = position?.x ?? shape.x;
  const y = position?.y ?? shape.y;
  const style = SHAPE_STYLE[shape.kind] ?? SHAPE_STYLE.wall;
  const Icon = style.icon;

  const isWallOrWindow = shape.kind === "wall" || shape.kind === "window";
  const isStripLabel = shape.kind === "kitchen_pass" || shape.kind === "bar";

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={onPointerDown}
      className={`absolute flex cursor-grab touch-none select-none active:cursor-grabbing ${
        selected ? "ring-2 ring-[#E67E22] ring-offset-2 ring-offset-[#F7F3EE]" : ""
      }`}
      style={{
        left: x,
        top: y,
        width: shape.width,
        height: shape.height,
        background: isWallOrWindow ? style.fill : "transparent",
        borderRadius: isStripLabel ? 6 : 0,
      }}
    >
      {isStripLabel && (
        <div
          className="flex h-full w-full flex-col justify-center gap-1 px-3 text-[#E67E22]"
          style={{ background: style.fill, borderRadius: 6 }}
        >
          <span className="font-mono text-[10px] font-semibold tracking-[0.16em]">
            {(shape.label ?? style.label).toUpperCase()}
          </span>
          <span className="text-[10px] text-[#D8CEC2]">{style.label}</span>
        </div>
      )}

      {shape.kind === "plant" && (
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="rounded-full"
            style={{
              width: Math.min(shape.width, shape.height),
              height: Math.min(shape.width, shape.height),
              background: style.fill,
              opacity: 0.7,
            }}
          />
        </div>
      )}

      {shape.kind === "restroom" && (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1 rounded p-2"
          style={{ background: style.fill }}
        >
          {Icon && <Icon className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />}
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B4F3A]">
            {(shape.label ?? "BAÑOS").toUpperCase()}
          </span>
        </div>
      )}

      {shape.kind === "door" && (
        <div className="flex h-full w-full flex-col justify-center gap-1.5">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-3.5 text-[#6B4F3A]" strokeWidth={2} />}
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#6B4F3A]">
              {(shape.label ?? "ENTRADA").toUpperCase()}
            </span>
          </div>
          <div className="h-0.5 w-full bg-[#6B4F3A]" />
        </div>
      )}

      {shape.kind === "column" && (
        <div className="h-full w-full bg-[#6B4F3A]" />
      )}

      {shape.kind === "divider" && (
        <div className="h-full w-full bg-[#D8CEC2] opacity-70" />
      )}

      {shape.kind === "text" && (
        <span
          className="block whitespace-nowrap font-mono font-semibold tracking-[0.16em] text-[#6B4F3A]"
          style={{ fontSize: shape.height, lineHeight: 1 }}
        >
          {shape.label ?? ""}
        </span>
      )}
    </div>
  );
}
