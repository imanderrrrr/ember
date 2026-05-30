"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  CircleCheck,
  ClipboardPen,
  ConciergeBell,
  Eye,
  Layers,
  MousePointerClick,
  Pointer,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import { FloorPlanCanvas } from "@/app/salon/restaurant-manager";
import { UserMenu } from "@/app/dashboard/user-menu";
import { formatQ } from "@/app/salon/_lib/menu";
import { updateTable } from "@/app/salon/_lib/client-api";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  type FloorPlan,
  type SalonTable,
} from "@/app/salon/_lib/types";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import type { Bill } from "@/app/caja/_lib/billing";

/** El customerName del seed a veces es un placeholder tipo "Mesa 02"; en ese
 *  caso no lo tratamos como cliente real. */
function realClientName(table: SalonTable): string | null {
  const n = table.customerName?.trim();
  if (!n) return null;
  if (/^mesa\b/i.test(n)) return null;
  return n;
}

type SessionUser = {
  name: string;
  role: string | null;
  avatarInitials: string | null;
};

export function WaiterSalon({
  plan,
  reservations,
  user,
  billByTable,
}: {
  plan: FloorPlan;
  reservations: ReservationDTO[];
  user: SessionUser | null;
  /** Factura real por mesa (id → Bill) armada desde las órdenes de cocina. */
  billByTable: Record<string, Bill>;
}) {
  const router = useRouter();
  // El mapa del mesero refleja en vivo los cambios de estado (cocina marca
  // listo, mesas que se liberan, etc.) sin recargar.
  useLiveRefresh(4000);

  const zones = useMemo(
    () => [...plan.zones].sort((a, b) => a.ord - b.ord),
    [plan.zones],
  );
  const [activeZoneId, setActiveZoneId] = useState<string>(
    zones[0]?.id ?? "",
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const zoneNameById = useMemo(
    () => new Map(plan.zones.map((z) => [z.id, z.name])),
    [plan.zones],
  );

  const activeZone = zones.find((z) => z.id === activeZoneId) ?? zones[0] ?? null;
  const activeZoneTables = plan.tables.filter(
    (t) => t.zoneId === activeZone?.id,
  );
  const activeZoneShapes = plan.shapes.filter(
    (s) => s.zoneId === activeZone?.id || s.zoneId === null,
  );
  const tableCountByZone = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of plan.tables) m.set(t.zoneId, (m.get(t.zoneId) ?? 0) + 1);
    return m;
  }, [plan.tables]);

  // La selección se resuelve sobre TODAS las mesas para que el rail pinte la
  // ficha aunque la mesa viva en otra zona (al cambiar de zona la limpiamos).
  const selectedTable =
    plan.tables.find((t) => t.id === selectedTableId) ?? null;

  const totalSeats = activeZoneTables.reduce((acc, t) => acc + t.seats, 0);
  const occupiedSeats = activeZoneTables
    .filter(
      (t) =>
        t.status === "ocupada" ||
        t.status === "cocina" ||
        t.status === "esperando",
    )
    .reduce((acc, t) => acc + t.seats, 0);

  const displayName = user?.name ?? "Mesero";

  // Factura real de la mesa seleccionada (si tiene órdenes); alimenta el rail.
  const selectedBill = selectedTable
    ? billByTable[selectedTable.id] ?? null
    : null;

  // "Tomar pedido" lleva a la pantalla Mesa activa (toma de pedido a pantalla
  // completa) de la mesa seleccionada.
  const takeOrder = () => {
    if (selectedTable) router.push(`/mesero/mesa/${selectedTable.id}`);
  };

  // "Cobrar" lleva a la pantalla de cobro (Caja) con esta mesa preseleccionada.
  // Solo aplica a mesas en estado "esperando" (cuenta solicitada).
  const cobrar = () => {
    if (selectedTable) router.push(`/mesero/mesa/${selectedTable.id}/cobrar`);
  };

  // "Liberar mesa" es el paso final del ciclo: tras cobrar, la mesa queda en
  // "limpieza"; cuando el mesero termina de limpiarla la libera (→ "libre") y
  // vuelve a quedar disponible. Cambio de estado real + refresco del plano.
  const [liberating, setLiberating] = useState(false);
  const liberar = async () => {
    if (!selectedTable || liberating) return;
    setLiberating(true);
    try {
      await updateTable(selectedTable.id, { status: "libre" });
      setSelectedTableId(null); // la mesa liberada ya no necesita ficha
      router.refresh(); // re-fetch del plano (server component) al instante
    } catch (e) {
      console.error("[mesero] liberar mesa failed", e);
    } finally {
      setLiberating(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-[1024px] flex-col bg-[#F7F3EE] font-sans text-[#1F1F1F]">
      {/* Top bar */}
      <header className="flex h-[60px] w-full shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <span className="block size-[30px] rounded-full bg-[#1F1F1F]" />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#1F1F1F]">
                CASA OLIVAR
              </span>
              <span className="text-[14px] font-semibold leading-tight">
                Salón en vivo
              </span>
            </div>
          </div>
          <span className="h-[30px] w-px bg-[#EDE6DC]" />
          <div className="flex items-center gap-2 rounded-full bg-[#FBE7D6] py-[7px] pl-3 pr-3.5">
            <ConciergeBell className="size-3.5 text-[#C2410C]" strokeWidth={1.8} />
            <span className="text-[12px] font-semibold text-[#7A2E14]">
              Modo mesero
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] py-2 pl-3 pr-3.5">
            <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
            <span className="text-[12px] font-medium">
              Turno Cena · 18:30—23:00
            </span>
          </div>
          <span className="h-7 w-px bg-[#EDE6DC]" />
          <UserMenu />
        </div>
      </header>

      {/* Zone tabs */}
      <div className="flex h-[58px] w-full shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-6">
        <div className="flex items-center gap-2">
          {zones.map((z) => {
            const active = z.id === activeZone?.id;
            const count = tableCountByZone.get(z.id) ?? 0;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => {
                  setActiveZoneId(z.id);
                  setSelectedTableId(null);
                }}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 transition-colors ${
                  active
                    ? "bg-[#1F1F1F] text-[#FAF5EB]"
                    : "border border-[#EDE6DC] bg-[#F7F3EE] text-[#1F1F1F] hover:bg-[#EDE6DC]/50"
                }`}
              >
                <span className="text-[13px] font-semibold">{z.name}</span>
                <span
                  className={`flex items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                    active
                      ? "bg-white/20 text-[#FAF5EB]"
                      : "bg-[#EDE6DC] text-[#6B4F3A]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 rounded-full border border-[#EDE6DC] bg-white py-[7px] pl-3 pr-3.5">
            <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
            <span className="text-[11px] text-[#6B6660]">En vivo · hace 2s</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[12px] text-[#6B6660]">Aforo</span>
            <span className="font-mono text-[13px] font-semibold">
              {occupiedSeats} / {totalSeats}
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-h-0 flex-1">
        {/* Floor plan column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[46px] shrink-0 items-center justify-between px-6">
            <div className="flex items-center gap-2.5">
              <Layers className="size-[15px] text-[#6B4F3A]" strokeWidth={1.8} />
              <span className="text-[14px] font-semibold">
                {activeZone?.name ?? "Sin zona"}
              </span>
              <span className="text-[13px] text-[#6B6660]">
                · {activeZoneTables.length} mesas
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#FBE7D6] py-1.5 pl-3 pr-3.5">
              <Pointer className="size-3.5 text-[#C2410C]" strokeWidth={1.8} />
              <span className="text-[11px] font-semibold text-[#7A2E14]">
                Toca una mesa para tomar el pedido
              </span>
            </div>
          </div>
          <div className="flex flex-1 justify-center overflow-auto px-6 pb-6">
            <FloorPlanCanvas
              tables={activeZoneTables}
              shapes={activeZoneShapes}
              reservations={reservations}
              zoneNameById={zoneNameById}
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
            />
          </div>
        </div>

        {/* Right rail */}
        <aside className="flex min-h-0 w-[340px] shrink-0 flex-col border-l border-[#EDE6DC] bg-white">
          {selectedTable ? (
            <WaiterTableRail
              table={selectedTable}
              zoneName={zoneNameById.get(selectedTable.zoneId) ?? null}
              waiterName={displayName}
              bill={selectedBill}
              onTakeOrder={takeOrder}
              onCobrar={cobrar}
              onLiberar={liberar}
              liberating={liberating}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#F7F3EE] shadow-[0_2px_8px_rgba(31,31,31,0.06)]">
                <MousePointerClick
                  className="size-5 text-[#6B4F3A]"
                  strokeWidth={1.8}
                />
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#6B4F3A]">
                NINGUNA MESA SELECCIONADA
              </span>
              <p className="max-w-[240px] text-[12px] leading-[1.55] text-[#6B6660]">
                Toca una mesa en el plano para ver su ficha y tomar el pedido.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function WaiterTableRail({
  table,
  zoneName,
  waiterName,
  bill,
  onTakeOrder,
  onCobrar,
  onLiberar,
  liberating,
}: {
  table: SalonTable;
  zoneName: string | null;
  waiterName: string;
  bill: Bill | null;
  onTakeOrder: () => void;
  onCobrar: () => void;
  onLiberar: () => void;
  liberating: boolean;
}) {
  const color = STATUS_COLOR[table.status];
  const isRound = table.shape === "round";
  const client = realClientName(table);
  const isEsperando = table.status === "esperando";
  const isLimpieza = table.status === "limpieza";

  // Pedido real de la mesa (órdenes de cocina vía buildBillForTable). Coincide
  // con lo que cobrará la pantalla de cobro; nada de datos mock.
  const lines = bill?.lines ?? [];
  const hasOrder = lines.length > 0;
  const units = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = bill?.subtotal ?? 0;
  const iva = bill?.iva ?? 0;
  const total = bill?.total ?? 0;

  return (
    <>
      {/* Contenido scrolleable — llena el alto disponible */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          MESA SELECCIONADA
        </span>

        <div
          className="flex items-center gap-3.5 rounded-2xl p-4"
          style={{ background: "#FBE7D6", border: "1.5px solid #E67E22" }}
        >
          <span
            className="flex size-14 shrink-0 items-center justify-center bg-white"
            style={{
              borderRadius: isRound ? 999 : 14,
              border: `2.5px solid ${color}`,
            }}
          >
            <span className="text-[22px] font-bold">{table.label}</span>
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[16px] font-bold">Mesa {table.label}</span>
              <span
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5"
                style={{ background: color }}
              >
                <span className="size-1.5 rounded-full bg-white" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-white">
                  {STATUS_LABEL[table.status]}
                </span>
              </span>
            </div>
            <span className="text-[12px] text-[#7A2E14]">
              {zoneName ?? "—"} · {table.seats} personas
            </span>
          </div>
        </div>

        {/* Datos rápidos */}
        <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-[#F7F3EE]">
          <InfoRow label="Capacidad" value={`${table.seats} personas`} />
          <InfoRow label="Mesero asignado" value={waiterName} />
          <InfoRow label="Cliente" value={client ?? "Sin asignar"} muted={!client} />
        </div>

        {/* Estado: limpieza pendiente · pedido en curso · sin pedido */}
        {isLimpieza ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[#EDE6DC] bg-white px-4 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#EEF1E9]">
              <Sparkles className="size-4 text-[#7C8A6A]" strokeWidth={1.6} />
            </span>
            <span className="text-[12.5px] font-semibold text-[#1F1F1F]">
              Cobro completado
            </span>
            <span className="text-[11px] leading-[1.4] text-[#6B6660]">
              La mesa está en limpieza. Libérala cuando esté lista para volver
              a usarse.
            </span>
          </div>
        ) : hasOrder ? (
          <div className="flex flex-col gap-2.5 rounded-xl border border-[#EDE6DC] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
                PEDIDO ACTUAL
              </span>
              <span className="font-mono text-[10px] text-[#a89d8e]">
                {units} {units === 1 ? "ítem" : "ítems"}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] font-semibold text-[#6B4F3A]">
                    {l.qty}×
                  </span>
                  <span className="flex-1 truncate text-[12.5px]">{l.name}</span>
                  <span className="font-mono text-[11.5px] text-[#6B4F3A]">
                    {l.unitPrice > 0 ? formatQ(l.lineTotal) : "—"}
                  </span>
                </div>
              ))}
            </div>
            <span className="h-px w-full bg-[#EDE6DC]" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6B6660]">Subtotal</span>
                <span className="font-mono text-[11px]">{formatQ(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6B6660]">IVA (12%)</span>
                <span className="font-mono text-[11px]">{formatQ(iva)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold tracking-[0.08em]">
                  TOTAL
                </span>
                <span className="font-mono text-[15px] font-bold">
                  {formatQ(total)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#EDE6DC] bg-[#F7F3EE] px-4 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-white">
              <Receipt className="size-4 text-[#a89d8e]" strokeWidth={1.6} />
            </span>
            <span className="text-[12.5px] font-semibold text-[#1F1F1F]">
              Mesa sin pedido
            </span>
            <span className="text-[11px] leading-[1.4] text-[#6B6660]">
              Toca “Tomar pedido” para abrir la comanda en Mesa activa.
            </span>
          </div>
        )}
      </div>

      {/* Footer fijo con la acción principal */}
      <div className="flex flex-col gap-2.5 border-t border-[#EDE6DC] bg-white p-5">
        {isLimpieza ? (
          <>
            {/* Mesa en limpieza → la acción es liberarla (limpieza → libre). */}
            <button
              type="button"
              onClick={onLiberar}
              disabled={liberating}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#7C8A6A] shadow-[0_6px_16px_rgba(124,138,106,0.28)] transition-colors hover:bg-[#6b785b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CircleCheck className="size-[18px] text-white" strokeWidth={2} />
              <span className="text-[15px] font-bold text-white">
                {liberating ? "Liberando…" : "Liberar mesa"}
              </span>
              {!liberating && (
                <ArrowRight className="size-4 text-white" strokeWidth={2.2} />
              )}
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-white transition-colors hover:bg-[#F7F3EE]"
            >
              <Eye className="size-[15px] text-[#1F1F1F]" strokeWidth={1.8} />
              <span className="text-[13px] font-semibold">Ver ficha de la mesa</span>
            </button>
          </>
        ) : isEsperando ? (
          <>
            {/* Mesa esperando cuenta → la acción principal es cobrar. */}
            <button
              type="button"
              onClick={onCobrar}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#E67E22] shadow-[0_6px_16px_rgba(230,126,34,0.25)] transition-colors hover:bg-[#c2410c]"
            >
              <Banknote className="size-[18px] text-white" strokeWidth={2} />
              <span className="text-[15px] font-bold text-white">Cobrar cuenta</span>
              {hasOrder && (
                <span className="font-mono text-[13px] font-semibold text-white/90">
                  · {formatQ(total)}
                </span>
              )}
              <ArrowRight className="size-4 text-white" strokeWidth={2.2} />
            </button>
            {/* Botón aparte: seguir agregando al pedido antes de cobrar. */}
            <button
              type="button"
              onClick={onTakeOrder}
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-white transition-colors hover:bg-[#F7F3EE]"
            >
              <ClipboardPen className="size-[15px] text-[#1F1F1F]" strokeWidth={1.8} />
              <span className="text-[13px] font-semibold">Continuar pedido</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onTakeOrder}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#E67E22] shadow-[0_6px_16px_rgba(230,126,34,0.25)] transition-colors hover:bg-[#c2410c]"
            >
              <ClipboardPen className="size-[18px] text-white" strokeWidth={2} />
              <span className="text-[15px] font-bold text-white">
                {hasOrder ? "Continuar pedido" : "Tomar pedido"}
              </span>
              <ArrowRight className="size-4 text-white" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-white transition-colors hover:bg-[#F7F3EE]"
            >
              <Eye className="size-[15px] text-[#1F1F1F]" strokeWidth={1.8} />
              <span className="text-[13px] font-semibold">Ver ficha de la mesa</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

function InfoRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-white px-3.5 py-3">
      <span className="text-[12px] text-[#6B6660]">{label}</span>
      <span
        className="text-[12px] font-semibold"
        style={{ color: muted ? "#a89d8e" : "#1F1F1F" }}
      >
        {value}
      </span>
    </div>
  );
}
