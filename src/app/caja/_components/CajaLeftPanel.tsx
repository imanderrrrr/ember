"use client";

import Link from "next/link";
import { CircleCheck, Receipt } from "lucide-react";
import { formatQ, type Bill } from "../_lib/billing";
import type { SplitPart } from "../split-bill-modal";

export function BillRow({
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

export function SplitBreakdown({
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

export function EmptyLeft({ homeHref }: { homeHref: string }) {
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

export function CajaLeftPanel({
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
          si no, el listado de mesas (solo cajero). */}
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
                    {l.unitPrice > 0 ? formatQ(l.lineTotal) : "—"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          <div className="flex flex-col gap-2.5 px-5 py-5">
            <BillRow label="Subtotal" value={formatQ(bill.subtotal)} />
            <BillRow label="IVA (12%)" value={formatQ(bill.iva)} accent />
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
