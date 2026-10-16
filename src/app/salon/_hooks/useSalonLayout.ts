"use client";

import { useState } from "react";
import type { TableStatus } from "../_lib/types";

export interface SalonLayoutState {
  zoom: number;
  pan: { x: number; y: number };
  selectedTableId: string | null;
  statusFilter: TableStatus | "todos";
  view: "plano" | "lista";
}

export function useSalonLayout(initialZoom = 100) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TableStatus | "todos">("todos");
  const [view, setView] = useState<"plano" | "lista">("plano");

  const zoomIn = () => setZoom((z) => Math.min(150, z + 10));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 10));
  const resetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  return {
    zoom,
    pan,
    setPan,
    zoomIn,
    zoomOut,
    resetZoom,
    selectedTableId,
    setSelectedTableId,
    statusFilter,
    setStatusFilter,
    view,
    setView,
  };
}
