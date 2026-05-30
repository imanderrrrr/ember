"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  Check,
  Info,
  Minus,
  Plus,
  TriangleAlert,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { formatQ, type Bill } from "./_lib/billing";

/**
 * Modal "Dividir cuenta" — fiel al diseño de Pencil ("Modal Dividir cuenta").
 * Opera sobre la factura REAL de la mesa (bill.lines / bill.total); no usa
 * datos mock. Tres modos:
 *   - personas:  divide el total en partes iguales (N personas).
 *   - productos: asigna cada producto ordenado a una cuenta.
 *   - monto:     define manualmente cuánto paga cada persona.
 * La división es informativa (prepara las cuentas); "Continuar a cobro" lleva
 * la primera parte al teclado de pago de la pantalla de cobro.
 */

type SplitMode = "personas" | "productos" | "monto";

const round2 = (n: number) => Math.round(n * 100) / 100;
const roundHalf = (n: number) => Math.round(n * 2) / 2;

/** Una parte de la cuenta dividida (persona o cuenta). */
export interface SplitPart {
  label: string;
  amount: number;
}

const METHODS: {
  key: SplitMode;
  icon: React.ReactNode;
  title: string;
  desc: string;
}[] = [
  {
    key: "personas",
    icon: <Users className="size-4" strokeWidth={1.9} />,
    title: "Por personas",
    desc: "Divide el total en partes iguales",
  },
  {
    key: "productos",
    icon: <Utensils className="size-4" strokeWidth={1.9} />,
    title: "Por productos",
    desc: "Asigna productos a cada cuenta",
  },
  {
    key: "monto",
    icon: <Calculator className="size-4" strokeWidth={1.9} />,
    title: "Por monto personalizado",
    desc: "Define cuánto paga cada uno",
  },
];

export function SplitBillModal({
  bill,
  onClose,
  onContinue,
}: {
  bill: Bill;
  onClose: () => void;
  /** Envía las partes calculadas a la pantalla de cobro para cobrarlas una
   *  por una. Solo se llama cuando la división cuadra con el total. */
  onContinue: (parts: SplitPart[]) => void;
}) {
  const [mode, setMode] = useState<SplitMode>("personas");

  // ─── Modo "personas" ───
  const [people, setPeople] = useState(() => Math.min(12, Math.max(2, bill.partySize || 2)));
  const [proportional, setProportional] = useState(true);
  const [round050, setRound050] = useState(false);

  // ─── Modo "productos" ───
  const [accounts, setAccounts] = useState(2);
  // assign[i] = índice de cuenta (0-based) o -1 si la línea está sin asignar.
  const [assign, setAssign] = useState<number[]>(() => bill.lines.map(() => -1));

  // ─── Modo "monto" ───
  const [amtPeople, setAmtPeople] = useState(2);
  const [amounts, setAmounts] = useState<string[]>(() => ["", ""]);

  // Cerrar con Escape + bloquear scroll del fondo mientras el modal vive.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  /* ── Cálculo "personas": partes iguales del total, ajustando la última
        para que la suma cuadre exacto con el total real. ── */
  const personasParts = useMemo<SplitPart[]>(() => {
    const n = Math.max(1, people);
    let each = bill.total / n;
    if (round050) each = roundHalf(each);
    const parts: SplitPart[] = Array.from({ length: n }, (_, i) => ({
      label: `Persona ${i + 1}`,
      amount: round2(each),
    }));
    // La última parte absorbe el residuo de redondeo para que la suma de las
    // partes cuadre EXACTO con el total real (evita Q0.01 colgando).
    const sum = round2(parts.reduce((a, p) => a + p.amount, 0));
    const diff = round2(bill.total - sum);
    if (parts.length) {
      const last = parts.length - 1;
      parts[last] = { ...parts[last], amount: round2(parts[last].amount + diff) };
    }
    return parts;
  }, [bill.total, people, round050]);

  /* ── Cálculo "productos": suma de líneas asignadas por cuenta. ── */
  const productosParts = useMemo<SplitPart[]>(() => {
    const totals = Array.from({ length: accounts }, () => 0);
    bill.lines.forEach((l, i) => {
      const a = assign[i];
      if (a >= 0 && a < accounts) totals[a] += l.lineTotal;
    });
    return totals.map((t, i) => ({ label: `Cuenta ${i + 1}`, amount: round2(t) }));
  }, [bill.lines, assign, accounts]);

  const unassignedCount = useMemo(
    () => assign.filter((a) => !(a >= 0 && a < accounts)).length,
    [assign, accounts],
  );

  /* ── Cálculo "monto": montos manuales por persona. ── */
  const montoNums = useMemo(
    () => amounts.map((s) => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : 0)),
    [amounts],
  );
  const montoParts: SplitPart[] = montoNums.map((n, i) => ({
    label: `Persona ${i + 1}`,
    amount: round2(n),
  }));

  // Unifica el modo activo en parts / saldo pendiente / validez.
  const { parts, pending, valid } = useMemo(() => {
    if (mode === "personas") return { parts: personasParts, pending: 0, valid: true };
    if (mode === "productos") {
      const assigned = round2(productosParts.reduce((a, p) => a + p.amount, 0));
      return {
        parts: productosParts,
        pending: round2(bill.total - assigned),
        valid: unassignedCount === 0,
      };
    }
    const assigned = round2(montoParts.reduce((a, p) => a + p.amount, 0));
    const pend = round2(bill.total - assigned);
    return { parts: montoParts, pending: pend, valid: Math.abs(pend) < 0.005 };
  }, [mode, personasParts, productosParts, montoParts, unassignedCount, bill.total]);

  // Partes con monto > 0 (las que efectivamente se cobran).
  const chargeableParts = parts.filter((p) => p.amount > 0.005);
  const partsCount = parts.length;

  // Helpers para cambiar el número de personas en modo "monto".
  const setAmtPeopleClamped = (n: number) => {
    const c = Math.min(12, Math.max(1, n));
    setAmtPeople(c);
    setAmounts((prev) => {
      const next = prev.slice(0, c);
      while (next.length < c) next.push("");
      return next;
    });
  };

  return (
    <div
      className="animate-dc-overlay fixed inset-0 z-50 flex items-center justify-center bg-[#1F1F1F66] p-6"
      onClick={onClose}
    >
      <div
        className="animate-dc-modal flex h-[min(800px,calc(100vh-48px))] w-[min(1200px,calc(100vw-48px))] flex-col overflow-hidden rounded-[18px] border border-[#EDE6DC] bg-white shadow-[0_32px_80px_rgba(31,31,31,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-[#EDE6DC] px-7 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-jakarta text-[22px] font-bold tracking-[-0.01em] text-[#1F1F1F]">
                Dividir cuenta
              </h2>
              <p className="text-[13px] leading-snug text-[#6B4F3A]">
                Separa el total por personas, productos o montos personalizados.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex size-9 items-center justify-center rounded-[10px] border border-[#EDE6DC] bg-white text-[#6B4F3A] transition-colors hover:bg-[#F7F3EE]"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip label="MESA" value={bill.tableLabel} />
            <Chip label="COMENSALES" value={String(bill.partySize)} />
            {bill.mesero && <Chip label="MESERO" value={bill.mesero} mono={false} />}
            <Chip label="TOTAL" value={bill.totalLabel} bold />
            <span className="flex items-center gap-1.5 rounded-full bg-[#EDE6DC] px-3 py-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ background: valid ? "#7C8A6A" : "#C2410C" }}
              />
              <span
                className="text-[12px] font-medium"
                style={{ color: valid ? "#7C8A6A" : "#C2410C" }}
              >
                {valid ? "Listo para dividir" : "Falta asignar el total"}
              </span>
            </span>
          </div>
        </div>

        {/* ── Body: 3 columnas ── */}
        <div className="flex min-h-0 flex-1">
          {/* COL IZQUIERDA — método */}
          <div className="flex w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#EDE6DC] bg-[#F7F3EE] px-6 py-6">
            <MonoLabel>MÉTODO DE DIVISIÓN</MonoLabel>
            <div className="flex flex-col gap-2.5">
              {METHODS.map((m) => {
                const active = m.key === mode;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMode(m.key)}
                    className="flex items-center gap-3 rounded-xl p-3.5 text-left transition-colors"
                    style={{
                      background: active ? "#FBE7D6" : "#FFFFFF",
                      border: active ? "1.5px solid #E67E22" : "1px solid #EDE6DC",
                    }}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: active ? "#E67E22" : "#F7F3EE",
                        color: active ? "#FFFFFF" : "#6B4F3A",
                      }}
                    >
                      {m.icon}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-[14px] font-semibold text-[#1F1F1F]">
                        {m.title}
                      </span>
                      <span className="text-[12px] leading-snug text-[#6B4F3A]">
                        {m.desc}
                      </span>
                    </span>
                    <span
                      className="flex size-[18px] shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: active ? "#E67E22" : "#FFFFFF",
                        border: active
                          ? "4px solid #FFFFFF"
                          : "1.5px solid #D8CEC2",
                        boxShadow: active ? "0 0 0 1.5px #E67E22" : "none",
                      }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            <div className="flex items-start gap-2.5 rounded-[10px] border border-[#EDE6DC] bg-white p-3">
              <Info className="mt-0.5 size-3.5 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
              <span className="text-[11px] leading-relaxed text-[#6B4F3A]">
                La división no cobra automáticamente. Solo prepara las cuentas para
                el pago.
              </span>
            </div>
          </div>

          {/* COL CENTRO — configuración */}
          <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto px-7 py-6">
            <MonoLabel>CONFIGURA LA DIVISIÓN</MonoLabel>

            {mode === "personas" && (
              <>
                <Stepper
                  label="Número de personas"
                  value={people}
                  unit="personas"
                  onDec={() => setPeople((p) => Math.max(1, p - 1))}
                  onInc={() => setPeople((p) => Math.min(12, p + 1))}
                />
                <div className="flex flex-col overflow-hidden rounded-[14px] border border-[#EDE6DC] bg-white">
                  <ToggleRow
                    title="Distribuir propina e impuestos proporcionalmente"
                    desc="Cada persona paga su parte de servicio"
                    on={proportional}
                    onToggle={() => setProportional((v) => !v)}
                    border
                  />
                  <ToggleRow
                    title="Redondear al múltiplo de Q0.50"
                    desc="Ajusta los montos para evitar centavos"
                    on={round050}
                    onToggle={() => setRound050((v) => !v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <MonoLabel>VISTA PREVIA POR PERSONA</MonoLabel>
                  <span className="font-mono text-[10px] text-[#A89D8E]">
                    {partsCount} partes
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {parts.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 rounded-xl border border-[#EDE6DC] bg-[#F7F3EE] px-2 py-3"
                    >
                      <span className="font-mono text-[9px] font-semibold tracking-[0.1em] text-[#6B4F3A]">
                        P{i + 1}
                      </span>
                      <span className="font-mono text-[15px] font-bold text-[#1F1F1F]">
                        {formatQ(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {mode === "productos" && (
              <>
                <Stepper
                  label="Número de cuentas"
                  value={accounts}
                  unit="cuentas"
                  onDec={() => setAccounts((a) => Math.max(2, a - 1))}
                  onInc={() => setAccounts((a) => Math.min(8, a + 1))}
                />
                <div className="flex items-center justify-between">
                  <MonoLabel>PRODUCTOS ORDENADOS</MonoLabel>
                  <span className="font-mono text-[10px] text-[#A89D8E]">
                    {unassignedCount > 0
                      ? `${unassignedCount} sin asignar`
                      : "todo asignado"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {bill.lines.length === 0 && (
                    <span className="text-[12px] text-[#A89D8E]">
                      Esta mesa no tiene productos registrados.
                    </span>
                  )}
                  {bill.lines.map((l, i) => {
                    const a = assign[i];
                    const assigned = a >= 0 && a < accounts;
                    return (
                      <div
                        key={i}
                        className="flex flex-col gap-2 rounded-xl border bg-white p-3"
                        style={{ borderColor: assigned ? "#EDE6DC" : "#E8B07F" }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#F2F3F0] font-mono text-[10px] font-semibold text-[#6B4F3A]">
                            {l.qty}
                          </span>
                          <span className="flex-1 truncate text-[12.5px] font-medium">
                            {l.name}
                          </span>
                          <span className="font-mono text-[11.5px] text-[#1F1F1F]">
                            {l.unitPrice > 0 ? formatQ(l.lineTotal) : "—"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Array.from({ length: accounts }, (_, k) => {
                            const sel = a === k;
                            return (
                              <button
                                key={k}
                                type="button"
                                onClick={() =>
                                  setAssign((prev) => {
                                    const next = [...prev];
                                    next[i] = sel ? -1 : k;
                                    return next;
                                  })
                                }
                                className="rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors"
                                style={{
                                  background: sel ? "#1F1F1F" : "#F7F3EE",
                                  color: sel ? "#FFFFFF" : "#6B4F3A",
                                  border: `1px solid ${sel ? "#1F1F1F" : "#EDE6DC"}`,
                                }}
                              >
                                C{k + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {mode === "monto" && (
              <>
                <Stepper
                  label="Número de personas"
                  value={amtPeople}
                  unit="personas"
                  onDec={() => setAmtPeopleClamped(amtPeople - 1)}
                  onInc={() => setAmtPeopleClamped(amtPeople + 1)}
                />
                {/* Barra de progreso asignado / total */}
                <div className="flex flex-col gap-2 rounded-[14px] border border-[#EDE6DC] bg-[#F7F3EE] p-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#6B4F3A]">
                      Asignado {formatQ(round2(bill.total - pending))}
                    </span>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: Math.abs(pending) < 0.005 ? "#7C8A6A" : "#C2410C" }}
                    >
                      {pending > 0.005
                        ? `Restante ${formatQ(pending)}`
                        : pending < -0.005
                          ? `Excedido ${formatQ(-pending)}`
                          : "Cuadrado"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE6DC]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((bill.total - pending) / (bill.total || 1)) * 100))}%`,
                        background: Math.abs(pending) < 0.005 ? "#7C8A6A" : "#E67E22",
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {amounts.map((val, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-[#EDE6DC] bg-white p-3"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F7F3EE] font-mono text-[11px] font-bold text-[#6B4F3A]">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-[12.5px] font-medium">
                        Persona {i + 1}
                      </span>
                      <div className="flex items-center gap-1.5 rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1.5">
                        <span className="font-mono text-[12px] font-semibold text-[#6B4F3A]">
                          Q
                        </span>
                        <input
                          inputMode="decimal"
                          value={val}
                          placeholder="0.00"
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, "");
                            setAmounts((prev) => {
                              const next = [...prev];
                              next[i] = v;
                              return next;
                            });
                          }}
                          className="w-20 bg-transparent text-right font-mono text-[13px] font-semibold text-[#1F1F1F] outline-none placeholder:text-[#A89D8E]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* COL DERECHA — resumen */}
          <div className="flex w-[400px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#EDE6DC] bg-[#F7F3EE] px-7 py-6">
            <MonoLabel>RESUMEN DE LA DIVISIÓN</MonoLabel>
            <div className="flex flex-col gap-3 rounded-[14px] border border-[#EDE6DC] bg-white p-[18px]">
              <SummaryRow label="Subtotal" value={formatQ(bill.subtotal)} />
              <SummaryRow label="IVA (12%)" value={formatQ(bill.iva)} accent />
              <div className="h-px bg-[#EDE6DC]" />
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold">Total</span>
                <span className="font-mono text-[16px] font-bold">{bill.totalLabel}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <MonoLabel>{mode === "productos" ? "POR CUENTA" : "POR PARTE"}</MonoLabel>
              <span className="font-mono text-[10px] text-[#A89D8E]">{partsCount}</span>
            </div>
            <div className="flex flex-col overflow-hidden rounded-[14px] border border-[#EDE6DC] bg-white">
              {parts.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-[#F2F3F0] px-4 py-3 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-full bg-[#F7F3EE] font-mono text-[10px] font-bold text-[#6B4F3A]">
                      {i + 1}
                    </span>
                    <span className="text-[12.5px] font-medium">{p.label}</span>
                  </div>
                  <span className="font-mono text-[13px] font-bold text-[#1F1F1F]">
                    {formatQ(p.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="flex items-start gap-3 rounded-xl p-3.5"
              style={{ background: valid ? "#EDE6DC" : "#FBE7D6" }}
            >
              {valid ? (
                <Check className="mt-0.5 size-[18px] shrink-0 text-[#7C8A6A]" strokeWidth={2} />
              ) : (
                <TriangleAlert
                  className="mt-0.5 size-[18px] shrink-0 text-[#C2410C]"
                  strokeWidth={2}
                />
              )}
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: valid ? "#7C8A6A" : "#C2410C" }}
                >
                  {valid
                    ? "La cuenta está dividida correctamente."
                    : mode === "productos"
                      ? "Hay productos sin asignar."
                      : "Los montos no suman el total."}
                </span>
                <span
                  className="font-mono text-[12px]"
                  style={{ color: valid ? "#7C8A6A" : "#C2410C" }}
                >
                  Saldo pendiente {formatQ(Math.abs(pending))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#EDE6DC] bg-white px-7 py-[18px]">
          <button
            type="button"
            onClick={onClose}
            className="px-1 py-2.5 text-[13px] font-medium text-[#6B4F3A] transition-colors hover:text-[#1F1F1F]"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2">
              <Info className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
              <span className="font-mono text-[11px] text-[#6B4F3A]">
                Mesa {bill.tableLabel} · {partsCount} cuentas listas
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-[#1F1F1F] bg-white px-[18px] py-3 text-[13px] font-semibold text-[#1F1F1F] transition-colors hover:bg-[#F7F3EE]"
            >
              Guardar división
            </button>
            <button
              type="button"
              disabled={!valid || chargeableParts.length === 0}
              onClick={() => onContinue(chargeableParts)}
              className="flex items-center gap-2 rounded-[10px] bg-[#E67E22] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(230,126,34,0.3)] transition-colors hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar a cobro
              <ArrowRight className="size-[15px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Subcomponentes
───────────────────────────────────────────── */
function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#6B4F3A]">
      {children}
    </span>
  );
}

function Chip({
  label,
  value,
  bold,
  mono = true,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-1.5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#6B4F3A]">
        {label}
      </span>
      <span
        className={`text-[12px] text-[#1F1F1F] ${mono ? "font-mono" : ""} ${
          bold ? "font-bold" : "font-semibold"
        }`}
      >
        {value}
      </span>
    </span>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#6B6660]">{label}</span>
      <span
        className={`font-mono text-[12.5px] ${
          accent ? "font-semibold text-[#C2410C]" : "text-[#1F1F1F]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Stepper({
  label,
  value,
  unit,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  unit: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[14px] border border-[#EDE6DC] bg-[#F7F3EE] p-5">
      <span className="text-[13px] font-medium text-[#1F1F1F]">{label}</span>
      <div className="flex items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={onDec}
          className="flex size-12 items-center justify-center rounded-xl border border-[#D8CEC2] bg-white text-[#1F1F1F] transition-colors hover:bg-[#F2F3F0]"
        >
          <Minus className="size-[18px]" strokeWidth={2} />
        </button>
        <div className="flex w-[200px] flex-col items-center gap-0.5 rounded-xl border border-[#EDE6DC] bg-white py-2.5">
          <span className="font-mono text-[28px] font-bold leading-none text-[#1F1F1F]">
            {value}
          </span>
          <span className="text-[11px] tracking-wide text-[#6B4F3A]">{unit}</span>
        </div>
        <button
          type="button"
          onClick={onInc}
          className="flex size-12 items-center justify-center rounded-xl bg-[#1F1F1F] text-white transition-colors hover:bg-[#3a322c]"
        >
          <Plus className="size-[18px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onToggle,
  border,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  border?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3.5"
      style={{ borderBottom: border ? "1px solid #EDE6DC" : undefined }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium text-[#1F1F1F]">{title}</span>
        <span className="text-[11px] text-[#6B4F3A]">{desc}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className="flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-0.5 transition-colors"
        style={{ background: on ? "#E67E22" : "#D8CEC2", justifyContent: on ? "flex-end" : "flex-start" }}
      >
        <span className="size-[18px] rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}
