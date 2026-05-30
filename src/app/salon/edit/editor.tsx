"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { FloorPlan, SalonTable, Shape, Zone } from "../_lib/types";
import * as api from "../_lib/client-api";
import { EditorTopBar } from "./top-bar";
import { ZonesSidebar } from "./sidebar-left";
import { Canvas } from "./canvas";
import { RightSidebar } from "./sidebar-right";

/* ─── State ─── */

export type Selection =
  | { type: "table"; id: string }
  | { type: "shape"; id: string }
  | null;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface State extends FloorPlan {
  activeZoneId: string | null;
  selection: Selection;
}

type Action =
  | { type: "replace_zones"; zones: Zone[] }
  | { type: "upsert_zone"; zone: Zone }
  | { type: "remove_zone"; id: string }
  | { type: "set_active_zone"; id: string | null }
  | { type: "upsert_table"; table: SalonTable }
  | { type: "remove_table"; id: string }
  | { type: "upsert_shape"; shape: Shape }
  | { type: "remove_shape"; id: string }
  | { type: "select"; selection: Selection };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "replace_zones":
      return { ...state, zones: a.zones };
    case "upsert_zone": {
      const i = state.zones.findIndex((z) => z.id === a.zone.id);
      const zones =
        i >= 0
          ? state.zones.map((z, idx) => (idx === i ? a.zone : z))
          : [...state.zones, a.zone];
      return { ...state, zones };
    }
    case "remove_zone":
      return {
        ...state,
        zones: state.zones.filter((z) => z.id !== a.id),
        tables: state.tables.filter((t) => t.zoneId !== a.id),
        shapes: state.shapes.filter((s) => s.zoneId !== a.id),
        activeZoneId: state.activeZoneId === a.id ? null : state.activeZoneId,
        selection: null,
      };
    case "set_active_zone":
      return { ...state, activeZoneId: a.id, selection: null };
    case "upsert_table": {
      const i = state.tables.findIndex((t) => t.id === a.table.id);
      const tables =
        i >= 0
          ? state.tables.map((t, idx) => (idx === i ? a.table : t))
          : [...state.tables, a.table];
      return { ...state, tables };
    }
    case "remove_table":
      return {
        ...state,
        tables: state.tables.filter((t) => t.id !== a.id),
        selection:
          state.selection?.type === "table" && state.selection.id === a.id
            ? null
            : state.selection,
      };
    case "upsert_shape": {
      const i = state.shapes.findIndex((s) => s.id === a.shape.id);
      const shapes =
        i >= 0
          ? state.shapes.map((s, idx) => (idx === i ? a.shape : s))
          : [...state.shapes, a.shape];
      return { ...state, shapes };
    }
    case "remove_shape":
      return {
        ...state,
        shapes: state.shapes.filter((s) => s.id !== a.id),
        selection:
          state.selection?.type === "shape" && state.selection.id === a.id
            ? null
            : state.selection,
      };
    case "select":
      return { ...state, selection: a.selection };
  }
}

/* ─── Editor ─── */

export function Editor({ initial }: { initial: FloorPlan }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...initial,
    activeZoneId: initial.zones[0]?.id ?? null,
    selection: null,
  }));

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * `markSaved` — feedback de autosave en la barra superior.
   *
   * Mostramos "Guardado" por 1.6s después de cada cambio exitoso; si llega
   * otro guardado durante ese período, reseteamos el timer.
   */
  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus("idle"), 1600);
  }, []);

  const wrap = useCallback(
    async <T,>(p: Promise<T>): Promise<T | null> => {
      setSaveStatus("saving");
      try {
        const result = await p;
        markSaved();
        return result;
      } catch (err) {
        console.error("[editor] save failed:", err);
        setSaveStatus("error");
        return null;
      }
    },
    [markSaved],
  );

  /* ─── Zone actions ─── */

  const addZone = useCallback(
    async (name: string) => {
      const zone = await wrap(api.createZone({ name }));
      if (!zone) return;
      dispatch({ type: "upsert_zone", zone });
      dispatch({ type: "set_active_zone", id: zone.id });
    },
    [wrap],
  );

  const renameZone = useCallback(
    async (id: string, name: string) => {
      const zone = await wrap(api.updateZone(id, { name }));
      if (!zone) return;
      dispatch({ type: "upsert_zone", zone });
    },
    [wrap],
  );

  const removeZone = useCallback(
    async (id: string) => {
      await wrap(api.deleteZone(id));
      dispatch({ type: "remove_zone", id });
    },
    [wrap],
  );

  /* ─── Table actions ─── */

  const addTable = useCallback(
    async (params: { shape: "round" | "rect"; seats: number }) => {
      if (!state.activeZoneId) return;
      const zoneTables = state.tables.filter((t) => t.zoneId === state.activeZoneId);
      const nextLabel = String(zoneTables.length + 1).padStart(2, "0");
      const size = params.shape === "round" ? 80 : 90;
      const table = await wrap(
        api.createTable({
          zoneId: state.activeZoneId,
          label: nextLabel,
          shape: params.shape,
          x: 200,
          y: 200,
          width: params.shape === "round" ? size : 120,
          height: size,
          seats: params.seats,
          status: "libre",
        }),
      );
      if (!table) return;
      dispatch({ type: "upsert_table", table });
      dispatch({ type: "select", selection: { type: "table", id: table.id } });
    },
    [state.activeZoneId, state.tables, wrap],
  );

  /**
   * Optimistic update: aplica el cambio local de inmediato y luego intenta
   * persistir. Si falla, hace rollback al snapshot previo. Útil para drag —
   * no queremos que el cursor "salte" esperando respuesta del server.
   */
  const updateTableOptimistic = useCallback(
    async (id: string, patch: Partial<Omit<SalonTable, "id">>) => {
      const prev = state.tables.find((t) => t.id === id);
      if (!prev) return;
      dispatch({ type: "upsert_table", table: { ...prev, ...patch } });
      const updated = await wrap(api.updateTable(id, patch));
      if (!updated) {
        dispatch({ type: "upsert_table", table: prev });
      }
    },
    [state.tables, wrap],
  );

  const removeTable = useCallback(
    async (id: string) => {
      await wrap(api.deleteTable(id));
      dispatch({ type: "remove_table", id });
    },
    [wrap],
  );

  /* ─── Shape actions ─── */

  const addShape = useCallback(
    async (kind: string, dims: { width: number; height: number; label?: string | null }) => {
      const shape = await wrap(
        api.createShape({
          zoneId: state.activeZoneId,
          kind,
          x: 240,
          y: 240,
          width: dims.width,
          height: dims.height,
          label: dims.label ?? null,
        }),
      );
      if (!shape) return;
      dispatch({ type: "upsert_shape", shape });
      dispatch({ type: "select", selection: { type: "shape", id: shape.id } });
    },
    [state.activeZoneId, wrap],
  );

  const updateShapeOptimistic = useCallback(
    async (id: string, patch: Partial<Omit<Shape, "id">>) => {
      const prev = state.shapes.find((s) => s.id === id);
      if (!prev) return;
      dispatch({ type: "upsert_shape", shape: { ...prev, ...patch } });
      const updated = await wrap(api.updateShape(id, patch));
      if (!updated) {
        dispatch({ type: "upsert_shape", shape: prev });
      }
    },
    [state.shapes, wrap],
  );

  const removeShape = useCallback(
    async (id: string) => {
      await wrap(api.deleteShape(id));
      dispatch({ type: "remove_shape", id });
    },
    [wrap],
  );

  /* ─── Derived ─── */

  const activeZone = useMemo(
    () => state.zones.find((z) => z.id === state.activeZoneId) ?? null,
    [state.zones, state.activeZoneId],
  );

  const visibleTables = useMemo(
    () => state.tables.filter((t) => t.zoneId === state.activeZoneId),
    [state.tables, state.activeZoneId],
  );

  const visibleShapes = useMemo(
    () =>
      state.shapes.filter(
        (s) => s.zoneId === state.activeZoneId || s.zoneId === null,
      ),
    [state.shapes, state.activeZoneId],
  );

  const selectedTable =
    state.selection?.type === "table"
      ? state.tables.find((t) => t.id === state.selection!.id) ?? null
      : null;
  const selectedShape =
    state.selection?.type === "shape"
      ? state.shapes.find((s) => s.id === state.selection!.id) ?? null
      : null;

  /* ─── Keyboard: delete + escape ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        dispatch({ type: "select", selection: null });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedTable) {
          e.preventDefault();
          void removeTable(selectedTable.id);
        } else if (selectedShape) {
          e.preventDefault();
          void removeShape(selectedShape.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTable, selectedShape, removeTable, removeShape]);

  return (
    <div className="flex min-h-screen w-full min-w-[1600px] flex-col bg-[#F7F3EE] font-sans text-[#1F1F1F]">
      <EditorTopBar saveStatus={saveStatus} />
      <div className="flex flex-1 min-h-[1028px]">
        <ZonesSidebar
          zones={state.zones}
          activeZoneId={state.activeZoneId}
          tables={state.tables}
          onActivate={(id) => dispatch({ type: "set_active_zone", id })}
          onAdd={addZone}
          onRename={renameZone}
          onDelete={removeZone}
        />
        <Canvas
          zone={activeZone}
          tables={visibleTables}
          shapes={visibleShapes}
          selection={state.selection}
          onSelect={(selection) => dispatch({ type: "select", selection })}
          onMoveTable={(id, x, y) => updateTableOptimistic(id, { x, y })}
          onMoveShape={(id, x, y) => updateShapeOptimistic(id, { x, y })}
        />
        <RightSidebar
          activeZone={activeZone}
          selectedTable={selectedTable}
          selectedShape={selectedShape}
          onAddTable={addTable}
          onAddShape={addShape}
          onUpdateTable={updateTableOptimistic}
          onUpdateShape={updateShapeOptimistic}
          onDeleteTable={removeTable}
          onDeleteShape={removeShape}
        />
      </div>
    </div>
  );
}
