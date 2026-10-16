"use client";

import React from "react";
import {
  Calendar,
  LogOut,
  Receipt,
  Sparkles,
  SquarePen,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { TableStatus } from "../_lib/types";

interface DrawerQuickActionsProps {
  saving: TableStatus | null;
  error: string | null;
  onOpenOrder: () => void;
  onOpenReservation: () => void;
  onSetStatus: (status: TableStatus) => void;
}

export function DrawerQuickActions({
  saving,
  error,
  onOpenOrder,
  onOpenReservation,
  onSetStatus,
}: DrawerQuickActionsProps) {
  return (
    <div className="flex flex-col gap-3 px-6 py-5 pb-6">
      <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
        ACCIONES RÁPIDAS
      </span>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <ActionButton
            icon={<SquarePen className="size-3.5" strokeWidth={1.8} />}
            label="Abrir pedido"
            primary
            onClick={onOpenOrder}
          />
          <ActionButton
            icon={<Calendar className="size-3.5" strokeWidth={1.8} />}
            label="Reservar"
            onClick={onOpenReservation}
          />
        </div>
        <div className="flex gap-2">
          <ActionButton
            icon={<Users className="size-3.5" strokeWidth={1.8} />}
            label="Marcar ocupada"
            busy={saving === "ocupada"}
            onClick={() => onSetStatus("ocupada")}
          />
          <ActionButton
            icon={<Receipt className="size-3.5" strokeWidth={1.8} />}
            label="Solicitar cuenta"
            busy={saving === "esperando"}
            onClick={() => onSetStatus("esperando")}
          />
        </div>
        <div className="flex gap-2">
          <ActionButton
            icon={<Sparkles className="size-3.5" strokeWidth={1.8} />}
            label="Marcar limpieza"
            busy={saving === "limpieza"}
            onClick={() => onSetStatus("limpieza")}
          />
          <ActionButton
            icon={<LogOut className="size-3.5" strokeWidth={1.8} />}
            label="Liberar mesa"
            danger
            busy={saving === "libre"}
            onClick={() => onSetStatus("libre")}
          />
        </div>
      </div>
      {error && (
        <p className="mt-1 flex items-start gap-1.5 rounded-md border border-[#C95A3D33] bg-[#C95A3D0A] px-2.5 py-1.5 text-[11px] text-[#C95A3D]">
          <TriangleAlert className="mt-px size-3.5 shrink-0" strokeWidth={1.8} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  primary,
  danger,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  danger?: boolean;
  busy?: boolean;
  onClick?: () => void;
}) {
  const baseLabel = busy ? "Guardando…" : label;
  if (primary) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#E67E22] px-3 py-2.5 text-[#F7F3EE] transition-colors hover:bg-[#c2410c] disabled:opacity-70"
      >
        {icon}
        <span className="text-[12px] font-semibold">{baseLabel}</span>
      </button>
    );
  }
  if (danger) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border bg-[#F7F3EE] px-3 py-2.5 transition-colors hover:bg-[#C95A3D0A] disabled:opacity-70"
        style={{ borderColor: "#C95A3D55" }}
      >
        <span className="text-[#C95A3D]">{icon}</span>
        <span className="text-[12px] text-[#C95A3D]">{baseLabel}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-2.5 transition-colors hover:bg-white disabled:opacity-70"
    >
      {icon}
      <span className="text-[12px]">{baseLabel}</span>
    </button>
  );
}
