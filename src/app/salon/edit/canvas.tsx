"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Layers, LayoutGrid } from "lucide-react";
import type { SalonTable, Shape, Zone } from "../_lib/types";
import type { Selection } from "./editor";
import { TableNode } from "./nodes/table-node";
import { ShapeNode } from "./nodes/shape-node";

/* ─── Canvas ─── */

const CANVAS_W = 920;
const CANVAS_H = 900;

interface DragState {
  id: string;
  type: "table" | "shape";
  originX: number;
  originY: number;
  startX: number;
  startY: number;
}

export function Canvas({
  zone,
  tables,
  shapes,
  selection,
  onSelect,
  onMoveTable,
  onMoveShape,
}: {
  zone: Zone | null;
  tables: SalonTable[];
  shapes: Shape[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  onMoveTable: (id: string, x: number, y: number) => void;
  onMoveShape: (id: string, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  /**
   * `dragPos` se actualiza durante el move y se aplica como overlay en el
   * nodo arrastrado. Solo cuando soltamos el pointer hacemos el commit
   * al store (que dispara la llamada al backend) — así evitamos un
   * roundtrip por frame de drag.
   */
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  function startDrag(
    e: ReactPointerEvent<HTMLDivElement>,
    item: { id: string; type: "table" | "shape"; x: number; y: number },
  ) {
    e.stopPropagation();
    onSelect({ type: item.type, id: item.id });
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDrag({
      id: item.id,
      type: item.type,
      originX: item.x,
      originY: item.y,
      startX: e.clientX,
      startY: e.clientY,
    });
    setDragPos({ x: item.x, y: item.y });
  }

  function moveDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const nx = clamp(drag.originX + (e.clientX - drag.startX), 0, CANVAS_W - 24);
    const ny = clamp(drag.originY + (e.clientY - drag.startY), 0, CANVAS_H - 24);
    setDragPos({ x: snap(nx), y: snap(ny) });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || !dragPos) return;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    const finalX = dragPos.x;
    const finalY = dragPos.y;
    const { id, type, originX, originY } = drag;
    setDrag(null);
    setDragPos(null);
    if (finalX !== originX || finalY !== originY) {
      if (type === "table") onMoveTable(id, finalX, finalY);
      else onMoveShape(id, finalX, finalY);
    }
  }

  const overlayPos = (id: string) =>
    drag && drag.id === id && dragPos ? dragPos : null;

  return (
    <main className="flex flex-1 flex-col bg-[#F7F3EE]">
      {/* Sub-header */}
      <div className="flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-[#F7F3EE] px-7">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[15px] font-semibold">
              {zone?.name ?? "Sin zona activa"}
            </span>
            <span className="text-[13px] text-[#6B6660]">
              · {tables.length} mesas · {shapes.length} formas
            </span>
          </div>
          <span className="h-6 w-px bg-[#EDE6DC]" />
          <div className="flex items-center gap-2 rounded-full border border-[#E67E22] bg-[#FBE7D6] px-3 py-1.5">
            <LayoutGrid className="size-3 text-[#C2410C]" strokeWidth={2} />
            <span className="text-[11px] font-medium text-[#C2410C]">
              Edición activa
            </span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 items-start p-6">
        {zone ? (
          <div
            ref={canvasRef}
            className="relative overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#F7F3EE]"
            style={{ width: CANVAS_W, height: CANVAS_H }}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerDown={() => onSelect(null)}
          >
            <Grid />
            {shapes.map((s) => (
              <ShapeNode
                key={s.id}
                shape={s}
                position={overlayPos(s.id)}
                selected={selection?.type === "shape" && selection.id === s.id}
                onPointerDown={(e) =>
                  startDrag(e, { id: s.id, type: "shape", x: s.x, y: s.y })
                }
              />
            ))}
            {tables.map((t) => (
              <TableNode
                key={t.id}
                table={t}
                position={overlayPos(t.id)}
                selected={selection?.type === "table" && selection.id === t.id}
                onPointerDown={(e) =>
                  startDrag(e, { id: t.id, type: "table", x: t.x, y: t.y })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyCanvas />
        )}
      </div>
    </main>
  );
}

function Grid() {
  return (
    <>
      {Array.from({ length: Math.floor(CANVAS_W / 40) - 1 }).map((_, i) => (
        <div
          key={`v${i}`}
          className="pointer-events-none absolute top-0 h-full w-px bg-[#EDE6DC] opacity-50"
          style={{ left: (i + 1) * 40 }}
        />
      ))}
      {Array.from({ length: Math.floor(CANVAS_H / 40) - 1 }).map((_, i) => (
        <div
          key={`h${i}`}
          className="pointer-events-none absolute left-0 h-px w-full bg-[#EDE6DC] opacity-50"
          style={{ top: (i + 1) * 40 }}
        />
      ))}
    </>
  );
}

function EmptyCanvas() {
  return (
    <div className="flex h-[600px] flex-1 items-center justify-center rounded-lg border border-dashed border-[#EDE6DC] bg-white">
      <div className="flex max-w-[420px] flex-col items-center gap-4 text-center">
        <div className="flex size-[88px] items-center justify-center rounded-2xl bg-[#F7F3EE]">
          <Layers className="size-9 text-[#E67E22]" strokeWidth={1.6} />
        </div>
        <h2 className="text-[20px] font-semibold">Selecciona una zona</h2>
        <p className="text-[13px] leading-[1.5] text-[#6B6660]">
          Elige una zona en el panel izquierdo o crea una nueva para empezar a
          colocar mesas y formas.
        </p>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const SNAP = 8;
function snap(v: number) {
  return Math.round(v / SNAP) * SNAP;
}
