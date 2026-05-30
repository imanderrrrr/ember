"use client";

import { useEffect, useRef, useState } from "react";
import {
  Armchair,
  Circle,
  Square,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { SalonTable, Shape, Zone } from "../_lib/types";
import { STATUS_COLOR, STATUS_LABEL, TABLE_STATUSES } from "../_lib/types";

const PALETTE_TABLES: { shape: "round" | "rect"; seats: number; label: string; icon: LucideIcon }[] = [
  { shape: "round", seats: 2, label: "Redonda · 2p", icon: Circle },
  { shape: "round", seats: 4, label: "Redonda · 4p", icon: Circle },
  { shape: "round", seats: 6, label: "Redonda · 6p", icon: Circle },
  { shape: "rect", seats: 2, label: "Rectangular · 2p", icon: Square },
  { shape: "rect", seats: 4, label: "Rectangular · 4p", icon: Square },
  { shape: "rect", seats: 8, label: "Rectangular · 8p", icon: Square },
];

const PALETTE_SHAPES: {
  kind: string;
  label: string;
  width: number;
  height: number;
  /** Texto inicial cuando la forma es `text`. */
  defaultText?: string;
}[] = [
  { kind: "text", label: "Texto", width: 160, height: 14, defaultText: "ETIQUETA" },
  { kind: "wall", label: "Pared horizontal", width: 200, height: 3 },
  { kind: "wall", label: "Pared vertical", width: 3, height: 200 },
  { kind: "window", label: "Ventanal", width: 200, height: 3 },
  { kind: "door", label: "Puerta", width: 140, height: 30 },
  { kind: "plant", label: "Planta", width: 36, height: 36 },
  { kind: "column", label: "Columna", width: 10, height: 10 },
  { kind: "restroom", label: "Baños", width: 80, height: 62 },
  { kind: "bar", label: "Barra", width: 240, height: 70 },
  { kind: "kitchen_pass", label: "Pase de cocina", width: 320, height: 80 },
  { kind: "divider", label: "Divisor", width: 200, height: 1 },
];

/**
 * Sidebar derecho del editor: doble función.
 *
 *  - Sin selección  → Paleta para agregar mesas y formas a la zona activa.
 *  - Con selección  → Inspector que muestra dimensiones, status, label,
 *                     y permite borrar el elemento.
 */
export function RightSidebar({
  activeZone,
  selectedTable,
  selectedShape,
  onAddTable,
  onAddShape,
  onUpdateTable,
  onUpdateShape,
  onDeleteTable,
  onDeleteShape,
}: {
  activeZone: Zone | null;
  selectedTable: SalonTable | null;
  selectedShape: Shape | null;
  onAddTable: (p: { shape: "round" | "rect"; seats: number }) => void;
  onAddShape: (kind: string, dims: { width: number; height: number; label?: string | null }) => void;
  onUpdateTable: (id: string, patch: Partial<Omit<SalonTable, "id">>) => void;
  onUpdateShape: (id: string, patch: Partial<Omit<Shape, "id">>) => void;
  onDeleteTable: (id: string) => void;
  onDeleteShape: (id: string) => void;
}) {
  return (
    <aside className="flex w-[344px] flex-col overflow-y-auto border-l border-[#EDE6DC] bg-white">
      {selectedTable ? (
        <TableInspector
          key={selectedTable.id}
          table={selectedTable}
          onUpdate={(patch) => onUpdateTable(selectedTable.id, patch)}
          onDelete={() => onDeleteTable(selectedTable.id)}
        />
      ) : selectedShape ? (
        <ShapeInspector
          key={selectedShape.id}
          shape={selectedShape}
          onUpdate={(patch) => onUpdateShape(selectedShape.id, patch)}
          onDelete={() => onDeleteShape(selectedShape.id)}
        />
      ) : (
        <Palette
          activeZone={activeZone}
          onAddTable={onAddTable}
          onAddShape={onAddShape}
        />
      )}
    </aside>
  );
}

/* ─── Palette ─── */

function Palette({
  activeZone,
  onAddTable,
  onAddShape,
}: {
  activeZone: Zone | null;
  onAddTable: (p: { shape: "round" | "rect"; seats: number }) => void;
  onAddShape: (kind: string, dims: { width: number; height: number; label?: string | null }) => void;
}) {
  const disabled = !activeZone;
  return (
    <>
      <div className="flex flex-col gap-1.5 border-b border-[#EDE6DC] px-6 py-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          PALETA
        </span>
        <span className="text-[13px]">
          {activeZone ? (
            <>
              Agregando a{" "}
              <span className="font-semibold">{activeZone.name}</span>
            </>
          ) : (
            <span className="text-[#6B6660]">Selecciona una zona primero</span>
          )}
        </span>
      </div>

      <Section title="MESAS">
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_TABLES.map((t) => (
            <PaletteButton
              key={`${t.shape}-${t.seats}`}
              disabled={disabled}
              onClick={() => onAddTable({ shape: t.shape, seats: t.seats })}
              icon={<t.icon className="size-4" strokeWidth={1.8} />}
              label={t.label}
            />
          ))}
        </div>
      </Section>

      <Section title="FORMAS">
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_SHAPES.map((s, i) => (
            <PaletteButton
              key={`${s.kind}-${i}`}
              disabled={disabled}
              onClick={() =>
                onAddShape(s.kind, {
                  width: s.width,
                  height: s.height,
                  label: s.defaultText ?? null,
                })
              }
              icon={<Armchair className="size-4 opacity-0" />}
              label={s.label}
            />
          ))}
        </div>
      </Section>

      <div className="flex-1" />
      <div className="px-6 pb-6 pt-2">
        <span className="font-mono text-[10px] italic text-[#6B6660]">
          Click en una pieza para agregarla al centro del plano. Después podés
          arrastrarla a su lugar.
        </span>
      </div>
    </>
  );
}

function PaletteButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[60px] flex-col items-start justify-between rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] p-2.5 text-left hover:border-[#E67E22] hover:bg-[#FBE7D6]/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="text-[#6B4F3A]">{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
        {title}
      </span>
      {children}
    </section>
  );
}

/* ─── Inspectors ─── */

function TableInspector({
  table,
  onUpdate,
  onDelete,
}: {
  table: SalonTable;
  onUpdate: (patch: Partial<Omit<SalonTable, "id">>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(table.label);

  return (
    <>
      <InspectorHeader
        eyebrow="MESA SELECCIONADA"
        title={`Mesa ${table.label}`}
        badge={
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: STATUS_COLOR[table.status] }}
          >
            <span className="size-1.5 rounded-full bg-white" />
            <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-white">
              {STATUS_LABEL[table.status].toUpperCase()}
            </span>
          </span>
        }
      />

      <Section title="ETIQUETA">
        <input
          value={label}
          maxLength={4}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            const trimmed = label.trim();
            if (trimmed && trimmed !== table.label) onUpdate({ label: trimmed });
            else setLabel(table.label);
          }}
          className="w-full rounded-lg border border-[#EDE6DC] bg-white px-3 py-2 font-mono text-[14px] outline-none focus:border-[#E67E22]"
        />
      </Section>

      <Section title="FORMA">
        <div className="flex gap-2">
          <ToggleButton
            active={table.shape === "round"}
            onClick={() => onUpdate({ shape: "round" })}
            label="Redonda"
          />
          <ToggleButton
            active={table.shape === "rect"}
            onClick={() => onUpdate({ shape: "rect" })}
            label="Rectangular"
          />
        </div>
      </Section>

      <Section title="DIMENSIONES">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Ancho"
            value={table.width}
            onChange={(v) => onUpdate({ width: v })}
            min={24}
            max={400}
          />
          <NumberField
            label="Alto"
            value={table.height}
            onChange={(v) => onUpdate({ height: v })}
            min={24}
            max={400}
          />
          <NumberField
            label="X"
            value={table.x}
            onChange={(v) => onUpdate({ x: v })}
            min={0}
            max={2000}
          />
          <NumberField
            label="Y"
            value={table.y}
            onChange={(v) => onUpdate({ y: v })}
            min={0}
            max={2000}
          />
        </div>
      </Section>

      <Section title="CAPACIDAD">
        <NumberField
          label="Comensales"
          value={table.seats}
          onChange={(v) => onUpdate({ seats: v })}
          min={1}
          max={20}
        />
      </Section>

      <Section title="ESTADO">
        <div className="grid grid-cols-2 gap-1.5">
          {TABLE_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdate({ status: s })}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left ${
                table.status === s
                  ? "border-[#E67E22] bg-[#FBE7D6]/50"
                  : "border-[#EDE6DC] bg-white hover:border-[#D8CEC2]"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: STATUS_COLOR[s] }}
              />
              <span className="text-[11px]">{STATUS_LABEL[s]}</span>
            </button>
          ))}
        </div>
      </Section>

      <DeleteButton onClick={onDelete} label="Eliminar mesa" />
    </>
  );
}

function ShapeInspector({
  shape,
  onUpdate,
  onDelete,
}: {
  shape: Shape;
  onUpdate: (patch: Partial<Omit<Shape, "id">>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(shape.label ?? "");

  /**
   * Cuando es un texto libre, el campo "label" deja de ser opcional —
   * es el contenido visible. Cambiamos la copy y el comportamiento del
   * blur (no permitimos null) para reflejarlo.
   */
  const isText = shape.kind === "text";

  return (
    <>
      <InspectorHeader
        eyebrow="FORMA SELECCIONADA"
        title={SHAPE_LABEL[shape.kind] ?? shape.kind}
      />

      <Section title={isText ? "TEXTO A MOSTRAR" : "ETIQUETA"}>
        <input
          value={label}
          maxLength={isText ? 80 : 40}
          autoFocus={isText}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            const trimmed = label.trim();
            if (isText) {
              if (!trimmed) {
                // No permitimos texto vacío: restauramos al valor anterior.
                setLabel(shape.label ?? "");
                return;
              }
              if (trimmed !== shape.label) onUpdate({ label: trimmed });
            } else {
              const next = trimmed || null;
              if (next !== shape.label) onUpdate({ label: next });
            }
          }}
          placeholder={isText ? "Ej: ENTRADA PRINCIPAL" : "Opcional"}
          className={`w-full rounded-lg border border-[#EDE6DC] bg-white px-3 py-2 outline-none focus:border-[#E67E22] ${
            isText ? "font-mono text-[14px] tracking-[0.12em]" : "text-[13px]"
          }`}
        />
      </Section>

      <Section title="DIMENSIONES">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Ancho"
            value={shape.width}
            onChange={(v) => onUpdate({ width: v })}
            min={1}
            max={2000}
          />
          <NumberField
            label={isText ? "Tamaño" : "Alto"}
            value={shape.height}
            onChange={(v) => onUpdate({ height: v })}
            min={isText ? 8 : 1}
            max={isText ? 96 : 2000}
          />
          <NumberField
            label="X"
            value={shape.x}
            onChange={(v) => onUpdate({ x: v })}
            min={0}
            max={2000}
          />
          <NumberField
            label="Y"
            value={shape.y}
            onChange={(v) => onUpdate({ y: v })}
            min={0}
            max={2000}
          />
        </div>
      </Section>

      <DeleteButton onClick={onDelete} label="Eliminar forma" />
    </>
  );
}

const SHAPE_LABEL: Record<string, string> = {
  wall: "Pared",
  door: "Puerta",
  window: "Ventanal",
  plant: "Planta",
  column: "Columna",
  restroom: "Baños",
  bar: "Barra",
  kitchen_pass: "Pase de cocina",
  divider: "Divisor",
  text: "Texto",
};

/* ─── Pieces ─── */

function InspectorHeader({
  eyebrow,
  title,
  badge,
}: {
  eyebrow: string;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
        {eyebrow}
      </span>
      <span className="text-[20px] font-semibold leading-tight">{title}</span>
      {badge}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-[12px] ${
        active
          ? "border-[#E67E22] bg-[#FBE7D6]/50 font-semibold"
          : "border-[#EDE6DC] bg-white hover:border-[#D8CEC2]"
      }`}
    >
      {label}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const [text, setText] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Sincroniza cambios externos (ej: drag mueve la posición) al input —
   * pero solo si el usuario no está editando este field ahora mismo.
   */
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setText(String(value));
    }
  }, [value]);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">
        {label.toUpperCase()}
      </span>
      <input
        ref={inputRef}
        type="number"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text);
          if (Number.isFinite(n) && n >= min && n <= max && n !== value) {
            onChange(Math.round(n));
          } else {
            setText(String(value));
          }
        }}
        min={min}
        max={max}
        className="w-full rounded-md border border-[#EDE6DC] bg-white px-2 py-1.5 font-mono text-[13px] outline-none focus:border-[#E67E22]"
      />
    </label>
  );
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="flex flex-col px-6 py-5">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2.5 hover:bg-[#C95A3D]/5"
        style={{ borderColor: "#C95A3D55" }}
      >
        <Trash2 className="size-3.5 text-[#C95A3D]" strokeWidth={1.8} />
        <span className="text-[12px] font-medium text-[#C95A3D]">{label}</span>
      </button>
    </div>
  );
}
