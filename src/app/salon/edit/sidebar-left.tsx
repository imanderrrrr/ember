"use client";

import { useState } from "react";
import { Check, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import type { SalonTable, Zone } from "../_lib/types";

/**
 * Sidebar izquierdo del editor.
 *
 * Lista las zonas. Click en una zona la activa (el canvas muestra solo sus
 * mesas). Cada fila tiene acciones inline para renombrar y eliminar.
 *
 * "Agregar zona" abre un input inline al final de la lista — sin modal,
 * sin route extra: editor inline siempre es más rápido.
 */
export function ZonesSidebar({
  zones,
  activeZoneId,
  tables,
  onActivate,
  onAdd,
  onRename,
  onDelete,
}: {
  zones: Zone[];
  activeZoneId: string | null;
  tables: SalonTable[];
  onActivate: (id: string) => void;
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const tableCount = (zoneId: string) =>
    tables.filter((t) => t.zoneId === zoneId).length;

  return (
    <aside className="flex w-[286px] flex-col border-r border-[#EDE6DC] bg-white">
      <div className="flex items-center gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <span className="block size-9 rounded-full bg-[#E67E22]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold leading-tight">Casa Olivar</span>
          <span className="text-[11px] text-[#6B6660]">Distribución</span>
        </div>
      </div>

      <section className="flex flex-col gap-3 border-b border-[#EDE6DC] p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
            ZONAS
          </span>
          <span className="font-mono text-[10px] text-[#6B6660]">{zones.length}</span>
        </div>

        <div className="flex flex-col gap-1">
          {zones.map((z) => {
            const active = z.id === activeZoneId;
            const editing = editingId === z.id;
            return (
              <div
                key={z.id}
                className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${
                  active ? "bg-[#E67E2214]" : "hover:bg-[#EDE6DC]/40"
                }`}
              >
                {active && !editing && (
                  <span className="h-8 w-[3px] rounded-sm bg-[#E67E22]" />
                )}
                {editing ? (
                  <form
                    className="flex flex-1 items-center gap-1.5"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const name = editingName.trim();
                      if (name && name !== z.name) await onRename(z.id, name);
                      setEditingId(null);
                    }}
                  >
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 rounded border border-[#E67E22] bg-white px-2 py-1 text-[13px] outline-none"
                    />
                    <button
                      type="submit"
                      className="flex size-6 items-center justify-center rounded text-[#7C8A6A] hover:bg-[#EDE6DC]"
                    >
                      <Check className="size-3.5" strokeWidth={2.4} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="flex flex-1 flex-col items-start gap-[3px]"
                    onClick={() => onActivate(z.id)}
                  >
                    <span
                      className={`text-[13px] ${active ? "font-semibold" : ""}`}
                    >
                      {z.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#6B6660]">
                      {tableCount(z.id)} mesas
                    </span>
                  </button>
                )}
                {!editing && (
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(z.id);
                        setEditingName(z.name);
                      }}
                      className="flex size-6 items-center justify-center rounded text-[#6B4F3A] hover:bg-[#EDE6DC]"
                      aria-label={`Renombrar ${z.name}`}
                    >
                      <Pencil className="size-3" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar la zona "${z.name}"? Las mesas dentro se borrarán.`)) {
                          void onDelete(z.id);
                        }
                      }}
                      className="flex size-6 items-center justify-center rounded text-[#C95A3D] hover:bg-[#C95A3D]/10"
                      aria-label={`Eliminar ${z.name}`}
                    >
                      <Trash2 className="size-3" strokeWidth={1.8} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {zones.length === 0 && !adding && (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-[#EDE6DC] bg-[#F7F3EE] px-4 py-5 text-center">
              <Layers className="mx-auto size-4 text-[#6B4F3A]" strokeWidth={1.8} />
              <span className="text-[12px] font-semibold">Aún sin zonas</span>
              <span className="text-[11px] text-[#6B6660]">
                Crea tu primera zona para empezar a colocar mesas.
              </span>
            </div>
          )}
        </div>

        {adding ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={async (e) => {
              e.preventDefault();
              const name = newName.trim();
              if (!name) {
                setAdding(false);
                return;
              }
              await onAdd(name);
              setNewName("");
              setAdding(false);
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la zona"
              className="flex-1 rounded border border-[#E67E22] bg-white px-2.5 py-2 text-[13px] outline-none"
            />
            <button
              type="submit"
              className="flex size-8 items-center justify-center rounded bg-[#E67E22] text-white"
            >
              <Check className="size-3.5" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="flex size-8 items-center justify-center rounded border border-[#EDE6DC] text-[#6B6660]"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#EDE6DC] px-3 py-2.5 hover:bg-[#EDE6DC]/40"
          >
            <Plus className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[12px] text-[#6B4F3A]">Agregar zona</span>
          </button>
        )}
      </section>

      <section className="flex flex-col gap-2.5 p-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          ATAJOS
        </span>
        <ShortcutRow keyLabel="Esc" desc="Deseleccionar" />
        <ShortcutRow keyLabel="Del" desc="Eliminar elemento" />
        <ShortcutRow keyLabel="Click" desc="Seleccionar" />
        <ShortcutRow keyLabel="Arrastrar" desc="Mover en el plano" />
      </section>

      <div className="flex-1" />
      <div className="px-5 pb-5 pt-3">
        <span className="font-mono text-[10px] italic text-[#6B6660]">
          Los cambios se guardan automáticamente.
        </span>
      </div>
    </aside>
  );
}

function ShortcutRow({ keyLabel, desc }: { keyLabel: string; desc: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="min-w-[60px] rounded border border-[#EDE6DC] bg-[#F7F3EE] px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold text-[#6B4F3A]">
        {keyLabel}
      </span>
      <span className="text-[11px] text-[#6B6660]">{desc}</span>
    </div>
  );
}
