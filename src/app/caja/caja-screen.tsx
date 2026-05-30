"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  ChefHat,
  CircleCheck,
  CreditCard,
  Delete,
  LayoutGrid,
  Printer,
  Receipt,
  Smartphone,
  Split,
  Wallet,
} from "lucide-react";
import { UserMenu } from "@/app/dashboard/user-menu";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import { updateTable } from "@/app/salon/_lib/client-api";
import { formatQ, type Bill } from "./_lib/billing";
import { SplitBillModal, type SplitPart } from "./split-bill-modal";
import { createSale, todayServiceDate } from "@/lib/sales-client";

/* ─────────────────────────────────────────────
   Tipos
───────────────────────────────────────────── */
type PayMethod = "efectivo" | "tarjeta" | "transferencia" | "mixto";

const METHOD_LABELS: Record<PayMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  mixto: "Mixto",
};

const METHOD_ICONS: Record<PayMethod, React.ReactNode> = {
  efectivo: <Banknote className="size-5" strokeWidth={1.8} />,
  tarjeta: <CreditCard className="size-5" strokeWidth={1.8} />,
  transferencia: <Smartphone className="size-5" strokeWidth={1.8} />,
  mixto: <Wallet className="size-5" strokeWidth={1.8} />,
};

interface SessionUser {
  name: string;
  role: string | null;
  avatarInitials: string | null;
}

/* ─────────────────────────────────────────────
   Root
───────────────────────────────────────────── */
export function CajaScreen({
  bills,
  totalTables,
  user,
  initialTableId = null,
  backHref = "/salon",
  backLabel = "Salón en vivo",
  homeHref = "/salon",
  showStaffLinks = true,
  showTableSelector = true,
}: {
  bills: Bill[];
  totalTables: number;
  user: SessionUser | null;
  /** Mesa preseleccionada al abrir (p. ej. la que tocó el mesero). */
  initialTableId?: string | null;
  /** Destino del botón "volver" del header. */
  backHref?: string;
  backLabel?: string;
  /** Destino de los CTAs "volver a tu área" (confirmación, vacío, footer). */
  homeHref?: string;
  /** Oculta los accesos a Cocina/Dashboard (chrome de cajero) en modo mesero. */
  showStaffLinks?: boolean;
  /** Muestra el listado de mesas esperando cuenta (cajero). En modo mesero la
   *  pantalla es de una sola mesa, así que se oculta y ese espacio se usa para
   *  el desglose de la división. */
  showTableSelector?: boolean;
}) {
  useLiveRefresh(6000);

  const [selectedId, setSelectedId] = useState<string | null>(
    // Preselecciona la mesa pedida si sigue en la lista; si no, la primera.
    (initialTableId && bills.some((b) => b.tableId === initialTableId)
      ? initialTableId
      : bills[0]?.tableId) ?? null,
  );
  const [method, setMethod] = useState<PayMethod>("efectivo");
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState<string | null>(null); // tableLabel de la mesa cobrada
  const [splitOpen, setSplitOpen] = useState(false); // modal "Dividir cuenta"
  // División activa: las partes a cobrar (en orden) y cuántas ya se cobraron.
  // Mientras hay división, el selector de mesas se oculta, así que no se puede
  // cambiar de mesa: la división solo se limpia al completarla o cancelarla.
  const [split, setSplit] = useState<{ parts: SplitPart[]; paidCount: number } | null>(
    null,
  );

  const selectedBill = bills.find((b) => b.tableId === selectedId) ?? null;

  // Parte actual de la división (la que toca cobrar ahora), si hay división.
  const currentPart = split ? split.parts[split.paidCount] ?? null : null;
  // El "monto exacto" sugerido es el de la parte actual, o el total de la mesa.
  const exactAmount = currentPart
    ? currentPart.amount.toFixed(2)
    : selectedBill
      ? selectedBill.total.toFixed(2)
      : "0.00";

  // Al "Continuar a cobro" desde el modal: arranca el cobro por partes con el
  // monto de la primera parte ya cargado en el teclado.
  const handleApplySplit = (parts: SplitPart[]) => {
    const charging = parts.filter((p) => p.amount > 0.005);
    setSplitOpen(false);
    if (charging.length === 0) return;
    setSplit({ parts: charging, paidCount: 0 });
    setAmount(charging[0].amount.toFixed(2));
  };

  const cancelSplit = () => {
    setSplit(null);
    setAmount("");
  };

  /* Numpad */
  const handleKey = (k: string) => {
    if (k === "←") {
      setAmount((prev) => prev.slice(0, -1));
    } else if (k === "C") {
      setAmount("");
    } else if (k === "." && amount.includes(".")) {
      return;
    } else if (amount.length >= 8) {
      return;
    } else {
      setAmount((prev) => prev + k);
    }
  };

  const handleQuick = (val: string) => setAmount(val);

  /* Confirmar cobro */
  const handleConfirm = useCallback(async () => {
    if (!selectedBill) return;

    // Con división activa: se cobra parte por parte. Solo al cobrar la última
    // parte se finaliza la cuenta (registra la venta y la mesa pasa a limpieza).
    if (split && split.paidCount + 1 < split.parts.length) {
      const nextPaid = split.paidCount + 1;
      setSplit({ parts: split.parts, paidCount: nextPaid });
      setAmount(split.parts[nextPaid].amount.toFixed(2));
      return;
    }

    // Finalizar el cobro: registrar la venta REAL (fuente del dashboard) y
    // pasar la mesa a limpieza. La venta es el total de la cuenta, no el monto
    // tecleado (que puede incluir vuelto).
    try {
      await createSale({
        tableId: selectedBill.tableId,
        tableLabel: selectedBill.tableLabel,
        zoneName: selectedBill.zoneName,
        mesero: selectedBill.mesero,
        cashier: user?.name ?? null,
        method,
        subtotal: selectedBill.subtotal,
        iva: selectedBill.iva,
        total: selectedBill.total,
        items: selectedBill.lines.map((l) => ({
          qty: l.qty,
          name: l.name,
          mods: l.mods,
        })),
        serviceDate: todayServiceDate(),
      });
    } catch (e) {
      console.error("[caja] registrar venta failed", e);
    }

    try {
      await updateTable(selectedBill.tableId, { status: "limpieza" });
      setSplit(null);
      setDone(selectedBill.tableLabel);
    } catch (e) {
      console.error("[caja] confirmar cobro failed", e);
    }
  }, [selectedBill, split, method, user]);

  const handleNext = () => {
    setDone(null);
    setAmount("");
    setSplit(null);
    const remaining = bills.filter((b) => b.tableId !== selectedId);
    setSelectedId(remaining[0]?.tableId ?? null);
  };

  /* Pantalla de confirmación */
  if (done !== null) {
    return (
      <ConfirmScreen tableLabel={done} onNext={handleNext} homeHref={homeHref} />
    );
  }

  return (
    <div className="flex h-screen w-full min-w-[1280px] flex-col bg-[#F2F3F0] font-jakarta text-[#1F1F1F]">
      <Header
        user={user}
        selectedBill={selectedBill}
        backHref={backHref}
        backLabel={backLabel}
        showStaffLinks={showStaffLinks}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[560px_minmax(0,1fr)_520px] overflow-hidden">
        {/* LEFT */}
        <LeftPanel
          bills={bills}
          selectedId={selectedId}
          onSelect={setSelectedId}
          bill={selectedBill}
          homeHref={homeHref}
          showTableSelector={showTableSelector}
          split={split}
          onCancelSplit={cancelSplit}
        />
        {/* CENTER */}
        <CenterPanel
          bill={selectedBill}
          method={method}
          onMethod={setMethod}
          amount={amount}
          exactAmount={exactAmount}
          onKey={handleKey}
          onQuick={handleQuick}
          onConfirm={handleConfirm}
          onSplit={() => setSplitOpen(true)}
          cancelHref={backHref}
          split={split}
        />
        {/* RIGHT */}
        <RightPanel
          bill={selectedBill}
          bills={bills}
          totalTables={totalTables}
          homeHref={homeHref}
        />
      </div>

      {/* Modal "Dividir cuenta" — opera sobre la factura real seleccionada. */}
      {splitOpen && selectedBill && (
        <SplitBillModal
          bill={selectedBill}
          onClose={() => setSplitOpen(false)}
          onContinue={handleApplySplit}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function Header({
  user,
  selectedBill,
  backHref,
  backLabel,
  showStaffLinks,
}: {
  user: SessionUser | null;
  selectedBill: Bill | null;
  backHref: string;
  backLabel: string;
  showStaffLinks: boolean;
}) {
  const initials =
    user?.avatarInitials ??
    (user?.name
      ? user.name
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "??");

  return (
    <header className="animate-salon-topbar flex h-16 shrink-0 items-center justify-between border-b border-[#d8cec2] bg-white px-6">
      {/* Left */}
      <div className="flex items-center gap-5">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 rounded-md border border-[#d8cec2] px-3 py-1.5 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          {backLabel}
        </Link>
        <span className="h-5 w-px bg-[#d8cec2]" />
        <div className="flex items-center gap-2.5">
          <span className="font-jakarta text-[15px] font-bold tracking-[0.1em] text-[#C2410C]">
            EMBER
          </span>
          <span className="h-4 w-px bg-[#d8cec2]" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#6B4F3A]">
            CAJA · COBRO
          </span>
        </div>
      </div>

      {/* Center pill */}
      {selectedBill && (
        <div className="flex items-center gap-2 rounded-full bg-[#F2F3F0] px-3.5 py-1.5">
          <span className="size-2 rounded-full bg-[#E67E22]" />
          <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-[#1F1F1F]">
            Cobro activo
          </span>
          <span className="font-mono text-[11px] text-[#6B6660]">
            · Mesa {selectedBill.tableLabel} · {selectedBill.zoneName}
          </span>
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-3">
        {showStaffLinks && (
          <>
            <Link
              href="/cocina"
              className="flex items-center gap-1.5 rounded-md border border-[#d8cec2] px-3 py-1.5 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
            >
              <ChefHat className="size-3.5" strokeWidth={1.8} />
              Cocina
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-md border border-[#d8cec2] px-3 py-1.5 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
            >
              <LayoutGrid className="size-3.5" strokeWidth={1.8} />
              Dashboard
            </Link>
          </>
        )}
        {/* Avatar */}
        <div className="flex items-center gap-2 rounded-full border border-[#d8cec2] px-2.5 py-1.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#6B4F3A] font-mono text-[9px] font-bold text-white">
            {initials}
          </span>
          <span className="text-[12px] font-medium">{user?.name ?? "—"}</span>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   LEFT PANEL — Lista de mesas + detalle
───────────────────────────────────────────── */
function LeftPanel({
  bills,
  selectedId,
  onSelect,
  bill,
  homeHref,
  showTableSelector,
  split,
  onCancelSplit,
}: {
  bills: Bill[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  bill: Bill | null;
  homeHref: string;
  showTableSelector: boolean;
  split: { parts: SplitPart[]; paidCount: number } | null;
  onCancelSplit: () => void;
}) {
  return (
    <aside className="animate-salon-sidebar stagger-children flex flex-col overflow-y-auto border-r border-[#d8cec2] bg-white">
      {/* Zona superior: el desglose de la división si la cuenta se dividió;
          si no, el listado de mesas (solo cajero). En modo mesero sin
          división, este espacio queda vacío a propósito. */}
      {split ? (
        <SplitBreakdown split={split} onCancel={onCancelSplit} />
      ) : showTableSelector ? (
        <div className="border-b border-[#d8cec2] px-5 py-4">
          <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
            MESAS ESPERANDO CUENTA · {bills.length}
          </span>
          <div className="mt-3 flex flex-col gap-1.5">
            {bills.length === 0 ? (
              <EmptyLeft homeHref={homeHref} />
            ) : (
              bills.map((b) => (
                <button
                  key={b.tableId}
                  onClick={() => onSelect(b.tableId)}
                  className={`flex items-center justify-between rounded-[10px] px-4 py-3 text-left transition-colors ${
                    b.tableId === selectedId
                      ? "border border-[#E67E22] bg-[#FBE7D6]"
                      : "border border-[#EDE6DC] hover:bg-[#F7F3EE]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full font-mono text-[13px] font-bold ${
                        b.tableId === selectedId
                          ? "bg-[#E67E22] text-white"
                          : "bg-[#EDE6DC] text-[#6B4F3A]"
                      }`}
                    >
                      {b.tableLabel}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-semibold">
                        Mesa {b.tableLabel}
                      </span>
                      <span className="text-[11px] text-[#6B6660]">
                        {b.zoneName} · {b.partySize}p
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[13px] font-bold text-[#1F1F1F]">
                    {b.totalLabel}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Detalle de la mesa seleccionada */}
      {bill ? (
        <>
          {/* Cabecera de mesa */}
          <div className="flex items-start justify-between border-b border-[#d8cec2] px-5 py-5">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
                CUENTA ACTIVA
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[36px] font-bold leading-none">
                  {bill.tableLabel}
                </span>
                <span className="text-[12px] text-[#6B6660]">
                  {bill.zoneName} · {bill.partySize} personas
                </span>
              </div>
              {bill.mesero && (
                <span className="text-[11px] text-[#A89D8E]">
                  Mesero: {bill.mesero}
                </span>
              )}
            </div>
          </div>

          {/* Lista de productos */}
          <div className="flex flex-col gap-0 border-b border-[#d8cec2] px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
                PRODUCTOS ORDENADOS
              </span>
              <span className="font-mono text-[10px] text-[#6B6660]">
                {bill.lines.length} líneas
              </span>
            </div>
            {bill.lines.length === 0 ? (
              <span className="text-[12px] text-[#A89D8E]">
                Sin productos registrados para esta mesa.
              </span>
            ) : (
              bill.lines.map((l, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-[#F2F3F0] py-3 last:border-0"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#F2F3F0] font-mono text-[10px] font-semibold text-[#6B4F3A]">
                    {l.qty}
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[12.5px] font-medium leading-tight">
                      {l.name}
                    </span>
                    {l.mods && (
                      <span className="text-[10.5px] text-[#6B6660]">
                        {l.mods}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11.5px] text-[#1F1F1F]">
                    {l.unitPrice > 0
                      ? formatQ(l.lineTotal)
                      : "—"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          <div className="flex flex-col gap-2.5 px-5 py-5">
            <BillRow label="Subtotal" value={formatQ(bill.subtotal)} />
            <BillRow
              label="IVA (12%)"
              value={formatQ(bill.iva)}
              accent
            />
            <div className="h-px bg-[#EDE6DC]" />
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold">Total</span>
              <span className="font-mono text-[16px] font-bold">
                {bill.totalLabel}
              </span>
            </div>
          </div>
        </>
      ) : (
        <EmptyLeft homeHref={homeHref} />
      )}
    </aside>
  );
}

function BillRow({
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

/* ─────────────────────────────────────────────
   Desglose de la división — ocupa el espacio del selector de mesas cuando
   la cuenta se dividió. Muestra cada parte y su estado (cobrada / por cobrar
   / pendiente) y el progreso del cobro.
───────────────────────────────────────────── */
function SplitBreakdown({
  split,
  onCancel,
}: {
  split: { parts: SplitPart[]; paidCount: number };
  onCancel: () => void;
}) {
  const { parts, paidCount } = split;
  const total = parts.reduce((a, p) => a + p.amount, 0);
  const paid = parts.slice(0, paidCount).reduce((a, p) => a + p.amount, 0);
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <div className="border-b border-[#d8cec2] px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          CUENTA DIVIDIDA · {paidCount}/{parts.length}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[#C2410C] hover:underline"
        >
          Cancelar división
        </button>
      </div>

      {/* Progreso del cobro */}
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-[#6B6660]">Cobrado</span>
        <span className="font-mono font-semibold text-[#1F1F1F]">
          {formatQ(paid)} <span className="text-[#A89D8E]">/ {formatQ(total)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#EDE6DC]">
        <div
          className="h-full rounded-full bg-[#7C8A6A] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Partes */}
      <div className="mt-3.5 flex flex-col gap-1.5">
        {parts.map((p, i) => {
          const status =
            i < paidCount ? "paid" : i === paidCount ? "current" : "pending";
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-[10px] border px-3.5 py-2.5 transition-colors"
              style={{
                borderColor: status === "current" ? "#E67E22" : "#EDE6DC",
                background:
                  status === "current"
                    ? "#FBE7D6"
                    : status === "paid"
                      ? "#F7F3EE"
                      : "#FFFFFF",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-7 items-center justify-center rounded-full font-mono text-[11px] font-bold"
                  style={{
                    background:
                      status === "paid"
                        ? "#7C8A6A"
                        : status === "current"
                          ? "#E67E22"
                          : "#EDE6DC",
                    color: status === "pending" ? "#6B4F3A" : "#FFFFFF",
                  }}
                >
                  {status === "paid" ? (
                    <CircleCheck className="size-3.5" strokeWidth={2.4} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-semibold">{p.label}</span>
                  <span
                    className="font-mono text-[9px] font-semibold tracking-[0.08em]"
                    style={{
                      color:
                        status === "paid"
                          ? "#7C8A6A"
                          : status === "current"
                            ? "#C2410C"
                            : "#A89D8E",
                    }}
                  >
                    {status === "paid"
                      ? "COBRADO"
                      : status === "current"
                        ? "POR COBRAR"
                        : "PENDIENTE"}
                  </span>
                </div>
              </div>
              <span
                className="font-mono text-[13px] font-bold"
                style={{ color: status === "pending" ? "#A89D8E" : "#1F1F1F" }}
              >
                {formatQ(p.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyLeft({ homeHref }: { homeHref: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[#F2F3F0]">
        <Receipt className="size-6 text-[#A89D8E]" strokeWidth={1.5} />
      </span>
      <span className="text-[14px] font-semibold text-[#1F1F1F]">
        Ninguna mesa en cobro
      </span>
      <p className="max-w-[240px] text-[12px] leading-relaxed text-[#6B6660]">
        Cuando un mesero solicite la cuenta desde Mesa activa, la mesa
        aparecerá aquí lista para cobrar.
      </p>
      <Link
        href={homeHref}
        className="mt-2 rounded-[10px] border border-[#EDE6DC] bg-white px-4 py-2.5 text-[12.5px] font-medium text-[#1F1F1F] hover:bg-[#F7F3EE]"
      >
        Ir al salón en vivo →
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CENTER PANEL — Método de pago + numpad
───────────────────────────────────────────── */
const QUICK_AMOUNTS = ["Q50", "Q100", "Q200", "Q500", "Exacto"];
const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "←"],
];

function CenterPanel({
  bill,
  method,
  onMethod,
  amount,
  exactAmount,
  onKey,
  onQuick,
  onConfirm,
  onSplit,
  cancelHref,
  split,
}: {
  bill: Bill | null;
  method: PayMethod;
  onMethod: (m: PayMethod) => void;
  amount: string;
  exactAmount: string;
  onKey: (k: string) => void;
  onQuick: (v: string) => void;
  onConfirm: () => void;
  onSplit: () => void;
  cancelHref: string;
  split: { parts: SplitPart[]; paidCount: number } | null;
}) {
  const displayAmount = amount || exactAmount;
  // Índice (1-based) de la parte que se está cobrando, si hay división.
  const partNo = split ? split.paidCount + 1 : 0;
  const confirmLabel = !bill
    ? "Confirmar cobro"
    : split
      ? `Cobrar parte ${partNo} de ${split.parts.length} · ${formatQ(Number(displayAmount))}`
      : `Confirmar cobro ${formatQ(Number(displayAmount))}`;

  return (
    <section className="animate-salon-main flex flex-col gap-0 overflow-y-auto bg-[#F2F3F0]">
      {/* Title strip */}
      <div className="flex items-center justify-between border-b border-[#d8cec2] bg-white px-7 py-5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            {split ? "COBRO DIVIDIDO" : "PROCESAR PAGO"}
          </span>
          <span className="text-[20px] font-bold leading-tight">
            {!bill
              ? "Selecciona una mesa"
              : split
                ? `Cobrar parte ${partNo} de ${split.parts.length} · Mesa ${bill.tableLabel}`
                : `Mesa ${bill.tableLabel} · ${bill.zoneName}`}
          </span>
        </div>
        {bill && (
          <span className="rounded-full bg-[#FBE7D6] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-[#C2410C]">
            {split
              ? `${split.parts[split.paidCount]?.label ?? "Parte"} · ${partNo}/${split.parts.length}`
              : "ESPERANDO CUENTA"}
          </span>
        )}
      </div>

      <div className="stagger-children flex flex-1 flex-col gap-5 p-7">
        {/* Payment methods */}
        <div className="grid grid-cols-4 gap-2.5">
          {(["efectivo", "tarjeta", "transferencia", "mixto"] as PayMethod[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => onMethod(m)}
                className={`flex flex-col items-center justify-center gap-2 rounded-[14px] py-4 transition-colors ${
                  method === m
                    ? "bg-[#1F1F1F] text-[#FAF5EB]"
                    : "border border-[#d8cec2] bg-white text-[#6B4F3A] hover:bg-[#F7F3EE]"
                }`}
              >
                <span
                  className={
                    method === m ? "text-[#E67E22]" : "text-[#6B4F3A]"
                  }
                >
                  {METHOD_ICONS[m]}
                </span>
                <span className="text-[11.5px] font-medium">
                  {METHOD_LABELS[m]}
                </span>
              </button>
            ),
          )}
        </div>

        {/* Amount display */}
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#d8cec2] bg-white py-7">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B6660]">
            MONTO A COBRAR
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-bold text-[#6B4F3A]">
              Q
            </span>
            <span className="font-mono text-[52px] font-bold leading-none tracking-[-0.02em]">
              {displayAmount}
            </span>
          </div>
          {amount && Number(amount) > Number(exactAmount) && (
            <span className="font-mono text-[11px] text-[#7C8A6A]">
              Vuelto: {formatQ(Number(amount) - Number(exactAmount))}
            </span>
          )}
          {!amount && (
            <span className="font-mono text-[11px] text-[#A89D8E]">
              Monto exacto · toca un número para cambiar
            </span>
          )}
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-5 gap-2">
          {QUICK_AMOUNTS.map((q) => {
            const isExacto = q === "Exacto";
            const val = isExacto
              ? exactAmount
              : q.replace("Q", "").replace(",", "");
            const isActive =
              (isExacto && !amount) || (!isExacto && amount === val);
            return (
              <button
                key={q}
                onClick={() => (isExacto ? onQuick("") : onQuick(val))}
                className={`rounded-[10px] py-2.5 font-mono text-[12px] font-medium transition-colors ${
                  isActive
                    ? "bg-[#1F1F1F] text-white"
                    : "border border-[#d8cec2] bg-white text-[#1F1F1F] hover:bg-[#F7F3EE]"
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>

        {/* Numpad */}
        <div className="flex flex-col gap-2">
          {NUMPAD_KEYS.map((row, ri) => (
            <div key={ri} className="grid grid-cols-3 gap-2">
              {row.map((k) => (
                <button
                  key={k}
                  onClick={() => onKey(k)}
                  className={`flex items-center justify-center rounded-[12px] py-4 font-mono text-[20px] font-semibold transition-colors ${
                    k === "←"
                      ? "border border-[#d8cec2] bg-white text-[#6B4F3A] hover:bg-[#F2F3F0]"
                      : "border border-[#d8cec2] bg-white hover:bg-[#F2F3F0]"
                  }`}
                >
                  {k === "←" ? (
                    <Delete className="size-5" strokeWidth={1.8} />
                  ) : (
                    k
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => onKey("C")}
            className="rounded-[10px] border border-[#d8cec2] bg-white px-5 py-3 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
          >
            Limpiar
          </button>
          <button
            onClick={onSplit}
            disabled={!bill}
            className="flex items-center gap-2 rounded-[10px] border border-[#1F1F1F] bg-white px-5 py-3 text-[12px] font-semibold text-[#1F1F1F] transition-colors hover:bg-[#F7F3EE] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Split className="size-4" strokeWidth={1.9} />
            Dividir cuenta
          </button>
          <div className="flex-1" />
          <Link
            href={cancelHref}
            className="rounded-[10px] border border-[#d8cec2] bg-white px-5 py-3 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
          >
            Cancelar
          </Link>
          <button
            onClick={onConfirm}
            disabled={!bill}
            className="flex items-center gap-2.5 rounded-[10px] bg-[#E67E22] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(230,126,34,0.3)] transition-colors hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Receipt className="size-4" strokeWidth={2} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   RIGHT PANEL — Vista general
───────────────────────────────────────────── */
function RightPanel({
  bill,
  bills,
  totalTables,
  homeHref,
}: {
  bill: Bill | null;
  bills: Bill[];
  totalTables: number;
  homeHref: string;
}) {
  const grandTotal = bills.reduce((a, b) => a + b.total, 0);
  const pendingCount = bills.length;

  return (
    <aside className="animate-salon-detail stagger-children flex flex-col gap-0 overflow-y-auto border-l border-[#d8cec2] bg-white">
      {/* Header */}
      <div className="border-b border-[#d8cec2] px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
            VISTA GENERAL
          </span>
          <span className="font-mono text-[10px] text-[#A89D8E]">
            {pendingCount} / {totalTables} mesas
          </span>
        </div>
      </div>

      {/* Dark total card */}
      <div className="mx-5 mt-5 rounded-[16px] bg-[#1F1F1F] p-5">
        <span className="font-mono text-[9px] font-semibold tracking-[0.18em] text-[#A89D8E]">
          TOTAL PENDIENTE DE COBRO
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-[16px] font-bold text-[#E8B07F]">
            Q
          </span>
          <span className="font-mono text-[38px] font-bold leading-none tracking-[-0.02em] text-[#FAF5EB]">
            {grandTotal.toFixed(2)}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#6B6660]">
              MESAS EN ESPERA
            </span>
            <span className="font-mono text-[11px] font-bold text-[#FAF5EB]">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#6B6660]">
              COMENSALES TOTALES
            </span>
            <span className="font-mono text-[11px] font-bold text-[#FAF5EB]">
              {bills.reduce((a, b) => a + b.partySize, 0)}p
            </span>
          </div>
        </div>
      </div>

      {/* Desglose de la mesa seleccionada */}
      {bill && (
        <div className="mx-5 mt-4 rounded-[14px] border border-[#EDE6DC] p-4">
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            DESGLOSE · MESA {bill.tableLabel}
          </span>
          <div className="mt-3 flex flex-col gap-2">
            <BillRow label="Subtotal" value={formatQ(bill.subtotal)} />
            <BillRow label="IVA (12%)" value={formatQ(bill.iva)} accent />
            <div className="h-px bg-[#EDE6DC]" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold">Total</span>
              <span className="font-mono text-[14px] font-bold">
                {bill.totalLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de todas las mesas pendientes */}
      {bills.length > 0 && (
        <div className="mx-5 mt-4 flex flex-col gap-2">
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            CUENTAS PENDIENTES
          </span>
          {bills.map((b) => (
            <div
              key={b.tableId}
              className={`flex items-center justify-between rounded-[10px] px-4 py-3 ${
                b.tableId === bill?.tableId
                  ? "border border-[#E67E22] bg-[#FBE7D6]"
                  : "border border-[#EDE6DC] bg-[#FAF5EB]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex size-7 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                    b.tableId === bill?.tableId
                      ? "bg-[#E67E22] text-white"
                      : "bg-[#EDE6DC] text-[#6B4F3A]"
                  }`}
                >
                  {b.tableLabel}
                </span>
                <span className="text-[12px] font-medium">{b.zoneName}</span>
              </div>
              <span className="font-mono text-[12px] font-bold">
                {b.totalLabel}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-auto flex flex-col gap-2 p-5">
        <button className="flex items-center justify-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-white py-2.5 text-[12.5px] font-medium text-[#1F1F1F] hover:bg-[#F7F3EE]">
          <Printer className="size-3.5" strokeWidth={1.8} />
          Imprimir pre-cuenta
        </button>
        <Link
          href={homeHref}
          className="flex items-center justify-center gap-2 rounded-[10px] bg-[#1F1F1F] py-3 text-[12.5px] font-semibold text-[#FAF5EB] hover:bg-[#3a322c]"
        >
          <LayoutGrid className="size-3.5" strokeWidth={1.8} />
          Ver salón en vivo
        </Link>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   CONFIRMACIÓN
───────────────────────────────────────────── */
function ConfirmScreen({
  tableLabel,
  onNext,
  homeHref,
}: {
  tableLabel: string;
  onNext: () => void;
  homeHref: string;
}) {
  return (
    <div className="cobro-stagger flex h-screen flex-col items-center justify-center gap-8 bg-[#FAF5EB] font-jakarta">
      {/* Header minimal */}
      <div className="absolute inset-x-0 top-0 flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-white px-8">
        <span className="font-jakarta text-[15px] font-bold tracking-[0.1em] text-[#C2410C]">
          EMBER · CAJA
        </span>
        <span className="rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-[#7C8A6A]">
          COBRO COMPLETADO · Mesa {tableLabel}
        </span>
      </div>

      {/* Centro ceremonial */}
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="animate-cobro-check relative flex size-20 items-center justify-center rounded-[24px] bg-[#7C8A6A]/10">
          <span className="animate-cobro-ring absolute inset-0 rounded-[24px] bg-[#7C8A6A]/25" />
          <CircleCheck
            className="relative size-10 text-[#7C8A6A]"
            strokeWidth={1.5}
          />
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#7C8A6A]">
            OPERACIÓN COMPLETADA
          </span>
          <h1 className="font-jakarta text-[36px] font-bold tracking-[-0.015em] text-[#1F1F1F]">
            Confirmación enviada
          </h1>
          <p className="text-[14px] text-[#6B6660]">
            El cobro quedó registrado y la mesa pasó a limpieza.
          </p>
        </div>
      </div>

      {/* Detalles */}
      <div className="flex gap-8">
        <InfoChip label="Mesa" value={`Mesa ${tableLabel}`} />
        <InfoChip label="Estado" value="Éxito verificado" green />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        <Link
          href={homeHref}
          className="flex items-center gap-2 rounded-[12px] border border-[#EDE6DC] bg-white px-6 py-3 text-[13px] font-medium text-[#1F1F1F] hover:bg-[#F7F3EE]"
        >
          <LayoutGrid className="size-4" strokeWidth={1.8} />
          Volver al salón
        </Link>
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-[12px] bg-[#E67E22] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(230,126,34,0.25)] hover:bg-[#c2410c]"
        >
          <Receipt className="size-4" strokeWidth={2} />
          Ver siguiente cuenta
        </button>
      </div>

      {/* Info cards */}
      <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
        <InfoCard
          icon={<ChefHat className="size-4 text-[#E67E22]" strokeWidth={1.8} />}
          title="Equipo avisado"
          desc="La mesa quedó en estado de limpieza pendiente."
        />
        <InfoCard
          icon={
            <Receipt className="size-4 text-[#4E7DA6]" strokeWidth={1.8} />
          }
          title="Historial EMBER"
          desc="El cobro se registró en el historial del turno."
        />
        <InfoCard
          icon={
            <CircleCheck
              className="size-4 text-[#7C8A6A]"
              strokeWidth={1.8}
            />
          }
          title="Siguiente paso"
          desc="Puedes asignar la mesa de nuevo cuando esté lista."
        />
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[12px] border border-[#EDE6DC] bg-white px-6 py-4">
      <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#A89D8E]">
        {label.toUpperCase()}
      </span>
      <span
        className={`text-[14px] font-bold ${
          green ? "text-[#7C8A6A]" : "text-[#1F1F1F]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-[#EDE6DC] bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12.5px] font-semibold">{title}</span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-[#6B6660]">{desc}</p>
    </div>
  );
}
