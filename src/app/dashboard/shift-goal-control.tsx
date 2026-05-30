"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Pencil, X } from "lucide-react";
import { setShiftGoal } from "@/lib/sales-client";

/**
 * Control de "Objetivo del turno" en el dashboard.
 *
 * Sin meta fijada → botón VERDE "Definir meta" (en lugar del porcentaje).
 * Al pulsarlo se abre un input; al guardar, se anima el cambio del botón al
 * PORCENTAJE de avance (ventas reales / meta). La meta se persiste en el
 * backend (`PUT /api/sales/goal`). El % se recalcula en vivo con las ventas.
 */
type Phase = "idle" | "editing" | "set";

export function ShiftGoalControl({
  ventasQ,
  goalQ,
  serviceDate,
}: {
  ventasQ: number;
  goalQ: number | null;
  serviceDate: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(goalQ != null ? "set" : "idle");
  const [goal, setGoal] = useState<number | null>(goalQ);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const pct = goal && goal > 0 ? Math.round((ventasQ / goal) * 100) : 0;
  const remaining = goal != null ? Math.max(0, goal - ventasQ) : 0;
  const reached = goal != null && ventasQ >= goal;
  const barColor = reached ? "#7C8A6A" : "#E67E22";
  const fmt = (q: number) =>
    "Q" +
    q.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const save = async () => {
    const val = parseFloat(input);
    if (!Number.isFinite(val) || val <= 0 || saving) return;
    setSaving(true);
    try {
      await setShiftGoal(serviceDate, val);
      setGoal(val);
      setPhase("set");
      router.refresh();
    } catch (e) {
      console.error("[dashboard] setShiftGoal failed", e);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setInput(goal != null ? String(goal) : "");
    setPhase("editing");
  };

  return (
    <div className="flex w-[240px] flex-col items-end gap-2.5">
      <div className="flex w-full items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#A89D8E]">
          OBJETIVO DEL TURNO
        </span>
        {phase === "set" && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Cambiar meta"
            className="flex size-6 items-center justify-center rounded-md border border-[#3A322C] text-[#A89D8E] transition-colors hover:bg-[#3A322C]"
          >
            <Pencil className="size-3" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Sin meta: botón verde ── */}
      {phase === "idle" && (
        <>
          <button
            type="button"
            onClick={startEdit}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C8A6A] py-3 shadow-[0_6px_16px_rgba(124,138,106,0.3)] transition-colors hover:bg-[#6b785b]"
          >
            <Flag className="size-4 text-white" strokeWidth={2.2} />
            <span className="font-jakarta text-[13px] font-bold text-white">
              Definir meta del turno
            </span>
          </button>
          <span className="font-mono text-[10px] tracking-[0.1em] text-[#A89D8E]">
            Fija tu meta para ver el avance
          </span>
        </>
      )}

      {/* ── Editando: input de meta ── */}
      {phase === "editing" && (
        <div className="flex w-full flex-col items-end gap-2">
          <div className="flex w-full items-center gap-2 rounded-[12px] border border-[#3A322C] bg-[#0e0a08] px-3 py-2.5">
            <span className="font-mono text-[16px] font-bold text-[#E8B07F]">
              Q
            </span>
            <input
              autoFocus
              inputMode="decimal"
              value={input}
              placeholder="54000"
              onChange={(e) => setInput(e.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setPhase(goal != null ? "set" : "idle");
              }}
              className="w-full bg-transparent text-right font-mono text-[20px] font-bold text-[#FAF5EB] outline-none placeholder:text-[#6B6660]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPhase(goal != null ? "set" : "idle")}
              className="flex size-9 items-center justify-center rounded-[10px] border border-[#3A322C] text-[#A89D8E] transition-colors hover:bg-[#3A322C]"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !input}
              className="flex items-center gap-1.5 rounded-[10px] bg-[#7C8A6A] px-4 py-2 transition-colors hover:bg-[#6b785b] disabled:opacity-50"
            >
              <Check className="size-4 text-white" strokeWidth={2.4} />
              <span className="font-jakarta text-[12px] font-bold text-white">
                {saving ? "Guardando…" : "Guardar meta"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Meta fijada: porcentaje de avance (swap animado) ── */}
      {phase === "set" && goal != null && (
        <div
          key={goal}
          className="animate-goal-in flex w-full flex-col items-end gap-2.5"
        >
          <span
            className="font-jakarta text-[38px] font-bold leading-none"
            style={{ color: barColor }}
          >
            {pct}%
          </span>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#FAF5EB1A]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: reached
                  ? "#7C8A6A"
                  : "linear-gradient(90deg, #E67E22 0%, #C2410C 100%)",
              }}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.1em] text-[#A89D8E]">
            {reached
              ? `¡Meta alcanzada! · meta ${fmt(goal)}`
              : `${fmt(remaining)} restantes · meta ${fmt(goal)}`}
          </span>
        </div>
      )}
    </div>
  );
}
