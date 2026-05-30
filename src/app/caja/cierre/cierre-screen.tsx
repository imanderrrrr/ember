"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  CircleCheck,
  CreditCard,
  Flame,
  Info,
  Layers,
  Lock,
  TriangleAlert,
} from "lucide-react";
import { closeShift } from "@/lib/sales-client";
import type { CashCloseData, CierreData } from "../_lib/cierre";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmtQ = (cents: number) =>
  "Q" +
  (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const signedQ = (cents: number) =>
  (cents < 0 ? "−" : cents > 0 ? "+" : "") + fmtQ(Math.abs(cents));

const METHODS: {
  key: string;
  label: string;
  icon: React.ReactNode;
  sub: string;
}[] = [
  { key: "efectivo", label: "Efectivo", icon: <Banknote className="size-[18px]" strokeWidth={1.9} />, sub: "Esperado en cajón" },
  { key: "tarjeta", label: "Tarjeta de crédito / débito", icon: <CreditCard className="size-[18px]" strokeWidth={1.9} />, sub: "Visa, Master, Amex" },
  { key: "transferencia", label: "Transferencia bancaria", icon: <ArrowLeftRight className="size-[18px]" strokeWidth={1.9} />, sub: "Conciliado vs banco" },
  { key: "mixto", label: "Pago mixto", icon: <Layers className="size-[18px]" strokeWidth={1.9} />, sub: "Efectivo + tarjeta" },
];

/* ─────────────────────────────────────────────
   Root
───────────────────────────────────────────── */
export function CierreScreen({
  cierre,
  cuentasPendientes,
  cashierName,
  dateLabel,
}: {
  cierre: CierreData;
  cuentasPendientes: number;
  cashierName: string;
  dateLabel: string;
}) {
  const router = useRouter();
  const [counted, setCounted] = useState<string>(
    (cierre.expectedCashCents / 100).toFixed(2),
  );
  const [notes, setNotes] = useState("");
  const [closing, setClosing] = useState(false);
  const [done, setDone] = useState<CashCloseData | null>(cierre.close);

  const countedCents = Math.round((parseFloat(counted) || 0) * 100);
  const differenceCents = countedCents - cierre.expectedCashCents;
  const hasDiff = Math.abs(differenceCents) >= 1;
  const ticketCents = cierre.count > 0 ? Math.round(cierre.totalCents / cierre.count) : 0;

  const pendientesOk = cuentasPendientes === 0;
  const diffJustified = !hasDiff || notes.trim().length > 0;
  const canClose = pendientesOk && diffJustified && !closing && cierre.count > 0;

  const cerrar = async () => {
    if (!canClose) return;
    setClosing(true);
    try {
      const res = await closeShift({
        serviceDate: cierre.serviceDate,
        countedCents,
        notes: notes.trim() || null,
        cashier: cashierName,
      });
      setDone(res.close);
      router.refresh();
    } catch (e) {
      console.error("[cierre] cerrar caja failed", e);
    } finally {
      setClosing(false);
    }
  };

  if (done) return <CajaCerrada close={done} />;

  // Monto máximo entre métodos para escalar las barras.
  const maxMethod = Math.max(
    1,
    ...METHODS.map((m) => cierre.byMethod[m.key]?.cents ?? 0),
  );

  return (
    <div className="flex min-h-screen w-full min-w-[1280px] flex-col bg-[#FAF5EB] font-jakarta text-[#1F1F1F]">
      {/* Header */}
      <header className="animate-salon-topbar flex h-16 shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md border border-[#EDE6DC] px-3 py-1.5 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F7F3EE]"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Dashboard
          </Link>
          <span className="h-5 w-px bg-[#EDE6DC]" />
          <span className="font-jakarta text-[15px] font-bold tracking-[0.1em] text-[#C2410C]">
            EMBER
          </span>
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#6B4F3A]">
            CAJA · CIERRE
          </span>
        </div>
        <span className="font-mono text-[11px] capitalize tracking-[0.08em] text-[#6B4F3A]">
          {dateLabel}
        </span>
      </header>

      <div className="flex flex-col gap-1 px-8 pb-2 pt-6">
        <h1 className="text-[26px] font-bold tracking-[-0.01em]">Cierre de caja</h1>
        <p className="text-[13px] text-[#6B6660]">
          Revisa las ventas del turno, cuadra el efectivo y cierra la caja.
        </p>
      </div>

      {/* Body — 3 columnas */}
      <div className="grid grid-cols-[380px_minmax(0,1fr)_420px] gap-6 p-8 pt-4">
        {/* ── IZQUIERDA ── */}
        <div className="animate-salon-sidebar flex flex-col gap-5">
          <ResumenCard
            cierre={cierre}
            cashierName={cashierName}
            ticketCents={ticketCents}
            cuentasPendientes={cuentasPendientes}
            dateLabel={dateLabel}
          />
          <PendientesCard pendientes={cuentasPendientes} />
        </div>

        {/* ── CENTRO ── */}
        <div className="animate-salon-main flex flex-col gap-6">
          <CuadreCard
            expectedCents={cierre.expectedCashCents}
            openingCents={cierre.openingCents}
            counted={counted}
            onCounted={setCounted}
            differenceCents={differenceCents}
            hasDiff={hasDiff}
          />
          <MethodsCard cierre={cierre} maxMethod={maxMethod} />
        </div>

        {/* ── DERECHA ── */}
        <div className="animate-salon-detail flex flex-col gap-5">
          <TotalsCard
            cierre={cierre}
            differenceCents={differenceCents}
            pendientes={cuentasPendientes}
          />
          <ObsCard notes={notes} onNotes={setNotes} required={hasDiff} />
          <CtaCard
            canClose={canClose}
            closing={closing}
            pendientesOk={pendientesOk}
            diffJustified={diffJustified}
            hasDiff={hasDiff}
            onClose={cerrar}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Cards
───────────────────────────────────────────── */
function Eyebrow({ children, color = "#c2410c" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="font-mono text-[10px] font-semibold tracking-[0.16em]"
      style={{ color }}
    >
      {children}
    </span>
  );
}

function ResumenCard({
  cierre,
  cashierName,
  ticketCents,
  cuentasPendientes,
  dateLabel,
}: {
  cierre: CierreData;
  cashierName: string;
  ticketCents: number;
  cuentasPendientes: number;
  dateLabel: string;
}) {
  const rows: { label: string; value: string; accent?: boolean }[] = [
    { label: "Cuentas cobradas", value: String(cierre.count) },
    { label: "Cuentas pendientes", value: String(cuentasPendientes), accent: cuentasPendientes > 0 },
    { label: "Ticket promedio", value: fmtQ(ticketCents) },
    { label: "Subtotal", value: fmtQ(cierre.subtotalCents) },
    { label: "IVA (12%)", value: fmtQ(cierre.ivaCents) },
    { label: "Cajero responsable", value: cashierName },
  ];
  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Eyebrow>RESUMEN DEL TURNO</Eyebrow>
          <span className="text-[18px] font-bold capitalize">{dateLabel.split(" · ")[0]}</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#fbe7d6] px-2.5 py-1.5">
          <span className="size-1.5 rounded-full bg-[#e67e22]" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#c2410c]">
            {cierre.closed ? "Cerrada" : "En cierre"}
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-1.5 border-b border-[#EDE6DC] pb-4">
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#A89D8E]">
          VENTAS DEL TURNO
        </span>
        <span className="text-[38px] font-bold leading-none tracking-[-0.02em]">
          {fmtQ(cierre.totalCents)}
        </span>
      </div>
      <div className="flex flex-col">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between border-b border-[#EDE6DC] py-3 last:border-0"
          >
            <span className="text-[12px] text-[#6b4f3a]">{r.label}</span>
            <span
              className="font-mono text-[13px] font-semibold"
              style={{ color: r.accent ? "#c2410c" : "#1F1F1F" }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PendientesCard({ pendientes }: { pendientes: number }) {
  const ok = pendientes === 0;
  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-[#1F1F1F] p-6">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: ok ? "#2c3326" : "#3a322c" }}
        >
          {ok ? (
            <CircleCheck className="size-4 text-[#7C8A6A]" strokeWidth={2} />
          ) : (
            <TriangleAlert className="size-4 text-[#E67E22]" strokeWidth={2} />
          )}
        </span>
        <span className="text-[14px] font-bold text-[#FAF5EB]">
          {ok ? "Sin cuentas pendientes" : `${pendientes} cuentas pendientes`}
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-[#A89D8E]">
        {ok
          ? "Todas las mesas del turno fueron cobradas. Puedes cerrar caja."
          : "Hay cuentas pendientes antes de cerrar caja. Termina de cobrar o solicita autorización del encargado."}
      </p>
      {!ok && (
        <Link
          href="/caja"
          className="flex items-center justify-center gap-2 rounded-[10px] bg-[#e67e22] py-2.5 text-[12px] font-semibold text-white hover:bg-[#c2410c]"
        >
          Ir a cobrar cuentas
        </Link>
      )}
    </section>
  );
}

function CuadreCard({
  expectedCents,
  openingCents,
  counted,
  onCounted,
  differenceCents,
  hasDiff,
}: {
  expectedCents: number;
  openingCents: number;
  counted: string;
  onCounted: (v: string) => void;
  differenceCents: number;
  hasDiff: boolean;
}) {
  const diffColor = differenceCents < 0 ? "#C2410C" : differenceCents > 0 ? "#7C8A6A" : "#1F1F1F";
  return (
    <section className="flex flex-col gap-5 rounded-[18px] border border-[#EDE6DC] bg-white p-7">
      <div className="flex flex-col gap-1">
        <Eyebrow>CUADRE DE CAJA</Eyebrow>
        <h3 className="text-[18px] font-bold">Cuenta el cajón antes de cuadrar</h3>
      </div>
      <div className="grid grid-cols-3 gap-3.5">
        {/* Esperado */}
        <div className="flex flex-col gap-2 rounded-[14px] border border-[#EDE6DC] bg-[#f7f3ee] p-[18px]">
          <span className="font-mono text-[9px] tracking-[0.14em] text-[#A89D8E]">
            EFECTIVO ESPERADO
          </span>
          <span className="text-[24px] font-bold tracking-[-0.01em]">
            {fmtQ(expectedCents)}
          </span>
          <span className="text-[11px] text-[#6b4f3a]">
            Apertura {fmtQ(openingCents)} + ventas efectivo
          </span>
        </div>
        {/* Contado (input) */}
        <div className="flex flex-col gap-2 rounded-[14px] bg-[#1F1F1F] p-[18px]">
          <span className="font-mono text-[9px] tracking-[0.14em] text-[#A89D8E]">
            EFECTIVO CONTADO
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[22px] font-semibold text-[#A89D8E]">Q</span>
            <input
              inputMode="decimal"
              value={counted}
              onChange={(e) => onCounted(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full bg-transparent text-[24px] font-bold tracking-[-0.01em] text-white outline-none"
            />
          </div>
          <span className="text-[11px] text-[#A89D8E]">Conteo manual del cajón</span>
        </div>
        {/* Diferencia */}
        <div
          className="flex flex-col gap-2 rounded-[14px] border p-[18px]"
          style={{
            background: hasDiff ? "#fbe7d6" : "#f7f3ee",
            borderColor: hasDiff ? "#f4daba" : "#EDE6DC",
          }}
        >
          <span
            className="font-mono text-[9px] tracking-[0.14em]"
            style={{ color: hasDiff ? "#c2410c" : "#A89D8E" }}
          >
            DIFERENCIA
          </span>
          <span className="text-[24px] font-bold tracking-[-0.01em]" style={{ color: diffColor }}>
            {signedQ(differenceCents)}
          </span>
          <span className="text-[11px]" style={{ color: hasDiff ? "#c2410c" : "#6b4f3a" }}>
            {hasDiff ? "Justifica para cerrar" : "Cajón cuadrado"}
          </span>
        </div>
      </div>
      {hasDiff && (
        <div className="flex items-center gap-3 rounded-[14px] border border-[#f4daba] bg-[#fbe7d6] p-4">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#f4daba]">
            <TriangleAlert className="size-[18px] text-[#C2410C]" strokeWidth={2} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold">
              Justifica la diferencia de {signedQ(differenceCents)}
            </span>
            <span className="text-[11px] leading-snug text-[#c2410c]">
              Escribe el motivo en las observaciones para poder cerrar caja.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function MethodsCard({
  cierre,
  maxMethod,
}: {
  cierre: CierreData;
  maxMethod: number;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex flex-col gap-1">
        <Eyebrow>CONCILIACIÓN POR MÉTODO DE PAGO</Eyebrow>
        <h3 className="text-[18px] font-bold">Pagos registrados durante el turno</h3>
      </div>
      <div className="flex flex-col">
        {METHODS.map((m) => {
          const data = cierre.byMethod[m.key] ?? { cents: 0, count: 0 };
          const pct = Math.round((data.cents / maxMethod) * 100);
          const dark = m.key === "tarjeta" || m.key === "transferencia";
          return (
            <div
              key={m.key}
              className="flex items-center gap-4 border-b border-[#EDE6DC] py-3.5 last:border-0"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  background: m.key === "efectivo" ? "#fbe7d6" : "#f7f3ee",
                  color: m.key === "efectivo" ? "#C2410C" : "#1F1F1F",
                }}
              >
                {m.icon}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13px] font-semibold">{m.label}</span>
                <span className="text-[11px] text-[#6b4f3a]">
                  {data.count}{" "}
                  {data.count === 1 ? "transacción" : "transacciones"} · {m.sub}
                </span>
              </div>
              <div className="h-1.5 w-[120px] shrink-0 overflow-hidden rounded-full bg-[#F4ECDD]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: dark ? "#1F1F1F" : "#e67e22" }}
                />
              </div>
              <span className="w-[92px] shrink-0 text-right font-mono text-[14px] font-semibold">
                {fmtQ(data.cents)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TotalsCard({
  cierre,
  differenceCents,
  pendientes,
}: {
  cierre: CierreData;
  differenceCents: number;
  pendientes: number;
}) {
  const rows = [
    { label: "Total cobrado", value: fmtQ(cierre.totalCents) },
    { label: "Subtotal", value: fmtQ(cierre.subtotalCents) },
    { label: "IVA (12%)", value: fmtQ(cierre.ivaCents) },
    { label: "Efectivo esperado", value: fmtQ(cierre.expectedCashCents) },
  ];
  const diffColor = differenceCents < 0 ? "#e67e22" : differenceCents > 0 ? "#A8C18B" : "#FAF5EB";
  const ok = pendientes === 0 && Math.abs(differenceCents) < 1;
  return (
    <section className="flex flex-col gap-5 rounded-[18px] bg-[#1F1F1F] p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Eyebrow color="#e67e22">RESUMEN FINAL DEL TURNO</Eyebrow>
          <span className="text-[18px] font-bold text-[#FAF5EB]">Listo para cuadrar</span>
        </div>
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#3a322c]">
          <Flame className="size-[18px] text-[#e67e22]" strokeWidth={1.9} />
        </span>
      </div>
      <div className="flex flex-col gap-1.5 border-y border-[#3a322c] py-4">
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#A89D8E]">
          TOTAL DEL TURNO
        </span>
        <span className="text-[44px] font-bold leading-none tracking-[-0.02em] text-[#FAF5EB]">
          {fmtQ(cierre.totalCents)}
        </span>
        <span className="text-[11px] text-[#A89D8E]">
          {cierre.count} {cierre.count === 1 ? "cuenta cobrada" : "cuentas cobradas"}
        </span>
      </div>
      <div className="flex flex-col">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between border-b border-[#3a322c] py-2.5 last:border-0"
          >
            <span className="text-[12px] text-[#A89D8E]">{r.label}</span>
            <span className="font-mono text-[13px] font-semibold text-[#FAF5EB]">
              {r.value}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2.5">
          <span className="text-[12px] font-medium text-[#f4daba]">Diferencia de caja</span>
          <span className="font-mono text-[14px] font-bold" style={{ color: diffColor }}>
            {signedQ(differenceCents)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-[12px] border border-[#3a322c] bg-[#1f1f1f] p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full" style={{ background: ok ? "#7C8A6A" : "#e67e22" }} />
          <span className="font-mono text-[9px] tracking-[0.14em] text-[#A89D8E]">
            ESTADO GENERAL
          </span>
        </div>
        <span className="text-[13px] font-semibold text-[#FAF5EB]">
          {ok
            ? "Caja cuadrada · sin pendientes"
            : `${pendientes > 0 ? `${pendientes} pendientes` : "Cuadrado"}${
                Math.abs(differenceCents) >= 1 ? " · diferencia detectada" : ""
              }`}
        </span>
      </div>
    </section>
  );
}

function ObsCard({
  notes,
  onNotes,
  required,
}: {
  notes: string;
  onNotes: (v: string) => void;
  required: boolean;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[18px] border border-[#EDE6DC] bg-white p-5">
      <div className="flex items-center justify-between">
        <Eyebrow color="#6b4f3a">OBSERVACIONES DEL CIERRE</Eyebrow>
        {required && (
          <span className="rounded-full bg-[#fbe7d6] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-[#c2410c]">
            REQUERIDO
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        rows={3}
        placeholder={
          required
            ? "Justifica la diferencia del cajón…"
            : "Notas del turno (opcional)…"
        }
        className="w-full resize-none rounded-[12px] border border-[#EDE6DC] bg-[#f7f3ee] px-3.5 py-3 text-[12.5px] text-[#1F1F1F] outline-none placeholder:text-[#A89D8E] focus:border-[#E67E22]"
      />
    </section>
  );
}

function CtaCard({
  canClose,
  closing,
  pendientesOk,
  diffJustified,
  hasDiff,
  onClose,
}: {
  canClose: boolean;
  closing: boolean;
  pendientesOk: boolean;
  diffJustified: boolean;
  hasDiff: boolean;
  onClose: () => void;
}) {
  const blockedMsg = !pendientesOk
    ? "Resuelve las cuentas pendientes para cerrar caja."
    : hasDiff && !diffJustified
      ? "Justifica la diferencia en observaciones para cerrar."
      : null;
  return (
    <section className="flex flex-col gap-3.5 rounded-[18px] border border-[#EDE6DC] bg-white p-6">
      {blockedMsg && (
        <div className="flex items-center gap-2.5 rounded-[10px] border border-[#f4daba] bg-[#fbe7d6] px-3 py-2.5">
          <Info className="size-3.5 shrink-0 text-[#C2410C]" strokeWidth={2} />
          <span className="text-[11px] leading-snug text-[#c2410c]">{blockedMsg}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        disabled={!canClose}
        className="flex items-center justify-center gap-2.5 rounded-[14px] bg-[#e67e22] py-4 shadow-[0_6px_16px_rgba(230,126,34,0.28)] transition-colors hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Lock className="size-4 text-white" strokeWidth={2.2} />
        <span className="text-[15px] font-bold text-white">
          {closing ? "Cerrando caja…" : "Cerrar caja"}
        </span>
      </button>
      <p className="text-center text-[11px] leading-snug text-[#6b4f3a]">
        Bloqueará cambios financieros del turno y emitirá el reporte de cierre.
      </p>
      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-2 rounded-[12px] border border-[#EDE6DC] bg-white py-3 text-[12px] font-semibold text-[#1F1F1F] hover:bg-[#F7F3EE]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Volver al dashboard
      </Link>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Confirmación de cierre
───────────────────────────────────────────── */
function CajaCerrada({ close }: { close: CashCloseData }) {
  const diff = close.differenceCents;
  const diffColor = diff < 0 ? "#C2410C" : diff > 0 ? "#7C8A6A" : "#7C8A6A";
  return (
    <div className="cobro-stagger flex h-screen flex-col items-center justify-center gap-8 bg-[#FAF5EB] font-jakarta">
      <div className="absolute inset-x-0 top-0 flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-white px-8">
        <span className="font-jakarta text-[15px] font-bold tracking-[0.1em] text-[#C2410C]">
          EMBER · CAJA
        </span>
        <span className="rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-[#7C8A6A]">
          CAJA CERRADA
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <span className="animate-cobro-check relative flex size-20 items-center justify-center rounded-[24px] bg-[#7C8A6A]/10">
          <span className="animate-cobro-ring absolute inset-0 rounded-[24px] bg-[#7C8A6A]/25" />
          <Lock className="relative size-9 text-[#7C8A6A]" strokeWidth={1.6} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#7C8A6A]">
            TURNO CERRADO
          </span>
          <h1 className="text-[36px] font-bold tracking-[-0.015em]">Caja cerrada</h1>
          <p className="text-[14px] text-[#6B6660]">
            El cierre quedó registrado con el cuadre del turno.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <CerradaChip label="Total del turno" value={fmtQ(close.totalCents)} />
        <CerradaChip label="Cobros" value={String(close.salesCount)} />
        <CerradaChip
          label="Diferencia"
          value={signedQ(close.differenceCents)}
          color={diffColor}
        />
      </div>

      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-[12px] bg-[#1F1F1F] px-6 py-3 text-[13px] font-semibold text-[#FAF5EB] hover:bg-[#0e0a08]"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Volver al dashboard
      </Link>
    </div>
  );
}

function CerradaChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[12px] border border-[#EDE6DC] bg-white px-6 py-4">
      <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#A89D8E]">
        {label.toUpperCase()}
      </span>
      <span
        className="font-mono text-[16px] font-bold"
        style={{ color: color ?? "#1F1F1F" }}
      >
        {value}
      </span>
    </div>
  );
}
