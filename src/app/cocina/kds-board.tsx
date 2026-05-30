"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  ArrowRight,
  Bell,
  ChefHat,
  ChevronDown,
  Flame,
  LayoutGrid,
  Package,
  Search,
  Sparkles,
  Timer,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { UserMenu } from "@/app/dashboard/user-menu";
import { updateTable } from "@/app/salon/_lib/client-api";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import { updateKitchenOrder } from "./_lib/orders";
import {
  STATION_LABEL,
  STATION_TABS,
  formatTimer,
  type Station,
  type Ticket,
  type TicketStatus,
} from "./_lib/kds-data";

export function KdsBoard({
  initialTickets,
  dateLabel,
  timeLabel,
}: {
  initialTickets: Ticket[];
  dateLabel: string;
  timeLabel: string;
}) {
  const [activeStation, setActiveStation] = useState<Station | "todos">("todos");
  const [notified, setNotified] = useState<Set<string>>(new Set());
  // Overlay optimista sobre los datos del servidor: cambios de estado y
  // entregas que el cocinero hace en este board, antes de que el siguiente
  // poll confirme. `nowMs` es el reloj para los cronómetros en vivo.
  const [overrides, setOverrides] = useState<Map<string, TicketStatus>>(new Map());
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [nowMs, setNowMs] = useState(0);
  const [prevInit, setPrevInit] = useState(initialTickets);

  // Polling: re-consulta las órdenes del servidor sin recargar. Cuando el
  // mesero envía un pedido nuevo, aparece aquí solo; cuando otro cocinero
  // avanza un estado, también se refleja.
  useLiveRefresh(4000);

  // Reloj para los cronómetros: el cálculo de "ahora" vive en el callback del
  // intervalo (no en el render ni síncrono en el effect), manteniendo el render
  // puro. El primer tick llega a ~1s del montaje.
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Cuando llega data fresca del servidor (poll), reconciliamos el overlay
  // optimista con la nueva verdad: conservamos SOLO los cambios que el backend
  // aún no refleja. Así, si un poll llega antes de que el PATCH se propague, el
  // ticket no parpadea de vuelta; y en cuanto el servidor confirma (o deja de
  // devolver la orden entregada), el overlay se limpia solo. Patrón de "ajustar
  // estado al cambiar prop" ejecutado en render (no en effect).
  if (initialTickets !== prevInit) {
    setPrevInit(initialTickets);
    setOverrides((prev) => {
      const next = new Map<string, TicketStatus>();
      for (const [id, status] of prev) {
        const server = initialTickets.find((t) => t.id === id);
        // Mantener el override solo si el servidor todavía no lo refleja.
        if (server && server.status !== status) next.set(id, status);
      }
      return next;
    });
    setRemoved((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        // Seguir ocultando mientras el servidor aún devuelva la orden (el
        // "entregada" no se ha propagado); al filtrarse, dejamos de ocultar.
        if (initialTickets.some((t) => t.id === id)) next.add(id);
      }
      return next;
    });
  }

  // Tickets a mostrar: órdenes del servidor + overlay optimista + cronómetro.
  const tickets = useMemo<Ticket[]>(
    () =>
      initialTickets
        .filter((t) => !removed.has(t.id))
        .map((t) => ({
          ...t,
          status: overrides.get(t.id) ?? t.status,
          elapsedSec:
            t.startedAtMs != null && nowMs > 0
              ? Math.max(0, Math.floor((nowMs - t.startedAtMs) / 1000))
              : t.elapsedSec,
        })),
    [initialTickets, overrides, removed, nowMs],
  );

  const visible = useMemo(
    () =>
      activeStation === "todos"
        ? tickets
        : tickets.filter((t) => t.station === activeStation),
    [tickets, activeStation],
  );

  // Una orden activa que supera su objetivo se considera "demorada" (se mueve
  // a esa columna automáticamente), sin tocar su estado real en el backend.
  const effectiveStatus = (t: Ticket): TicketStatus =>
    (t.status === "nueva" || t.status === "preparacion") &&
    t.elapsedSec > t.targetSec
      ? "demorada"
      : t.status;

  const byStatus = (s: TicketStatus) =>
    visible.filter((t) => effectiveStatus(t) === s);
  const nuevas = byStatus("nueva");
  const preparacion = byStatus("preparacion");
  const listas = byStatus("lista");
  const demoradas = byStatus("demorada");

  // Métricas en vivo (sobre todos los tickets activos, no solo el filtro).
  const active = tickets.filter((t) => t.status !== "lista");
  const avgDelaySec =
    active.length > 0
      ? Math.round(active.reduce((a, t) => a + t.elapsedSec, 0) / active.length)
      : 0;
  const criticas = tickets.filter((t) => effectiveStatus(t) === "demorada").length;

  const advance = (id: string, to: TicketStatus) => {
    const ticket = tickets.find((t) => t.id === id);
    // Optimista: el ticket se mueve de columna ya; el siguiente poll lo
    // confirma desde el backend.
    setOverrides((prev) => new Map(prev).set(id, to));
    if (ticket?.orderId && (to === "preparacion" || to === "lista")) {
      updateKitchenOrder(ticket.orderId, to).catch((e) =>
        console.error("[cocina] updateKitchenOrder failed", e),
      );
    }
  };

  const deliver = (t: Ticket) => {
    // Optimista: se quita del board; el backend marca entregada y libera la
    // mesa (→ esperando cuenta), lo que el salón en vivo verá en su próximo
    // refresco.
    setRemoved((prev) => new Set(prev).add(t.id));
    if (t.orderId) {
      updateKitchenOrder(t.orderId, "entregada").catch((e) =>
        console.error("[cocina] updateKitchenOrder failed", e),
      );
    }
    if (t.tableId) {
      updateTable(t.tableId, { status: "esperando" }).catch((e) =>
        console.error("[cocina] updateTable failed", e),
      );
    }
  };

  const toggleNotify = (id: string) =>
    setNotified((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-[#FAF5EB] font-jakarta text-[#1F1F1F]">
      <Header dateLabel={dateLabel} timeLabel={timeLabel} />
      <ControlBar
        activeStation={activeStation}
        onStation={setActiveStation}
        avgDelay={formatTimer(avgDelaySec)}
        criticas={criticas}
      />
      <div className="flex min-h-0 flex-1 gap-7 overflow-hidden p-8">
        {tickets.length === 0 ? (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
              <ChefHat className="size-7 text-[#A89D8E]" strokeWidth={1.5} />
            </span>
            <span className="text-[16px] font-semibold">
              Sin comandas en cocina
            </span>
            <p className="max-w-[320px] text-[13px] leading-[1.5] text-[#6b6660]">
              Cuando un mesero envíe un pedido a cocina aparecerá aquí
              automáticamente, listo para preparar.
            </p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 gap-[18px] overflow-x-auto">
            <Column
              dot="#E67E22"
              countBg="#fbe7d6"
              countFg="#C2410C"
              title="NUEVAS"
              subtitle="Recién ingresadas · sin tocar"
              count={nuevas.length}
              headerCard
            >
            {nuevas.map((t) => (
              <TicketCard
                key={t.id}
                t={t}
                notified={notified.has(t.id)}
                onAdvance={advance}
                onDeliver={deliver}
                onNotify={toggleNotify}
              />
            ))}
          </Column>

          <Column
            dot="#C2410C"
            countBg="#1F1F1F"
            countFg="#FAF5EB"
            title="EN PREPARACIÓN"
            subtitle="Brigada activa · línea caliente"
            count={preparacion.length}
            headerCard
          >
            {preparacion.map((t) => (
              <TicketCard
                key={t.id}
                t={t}
                notified={notified.has(t.id)}
                onAdvance={advance}
                onDeliver={deliver}
                onNotify={toggleNotify}
              />
            ))}
          </Column>

          <Column
            dot="#7c8a6a"
            countBg="#7c8a6a"
            countFg="#FAF5EB"
            title="LISTAS PARA SERVIR"
            subtitle="Listas para retiro · acción del salón"
            count={listas.length}
          >
            {listas.map((t) => (
              <TicketCard
                key={t.id}
                t={t}
                notified={notified.has(t.id)}
                onAdvance={advance}
                onDeliver={deliver}
                onNotify={toggleNotify}
              />
            ))}
          </Column>

          <Column
            dot="#C2410C"
            countBg="#C2410C"
            countFg="#FAF5EB"
            title="DEMORADAS"
            subtitle="Pasaron del tiempo objetivo · prioridad alta"
            count={demoradas.length}
            titleColor="#C2410C"
          >
            {demoradas.map((t) => (
              <TicketCard
                key={t.id}
                t={t}
                notified={notified.has(t.id)}
                onAdvance={advance}
                onDeliver={deliver}
                onNotify={toggleNotify}
              />
            ))}
            </Column>
          </div>
        )}

        <SidePanel
          tickets={tickets}
          counts={{
            nuevas: tickets.filter((t) => effectiveStatus(t) === "nueva").length,
            preparacion: tickets.filter((t) => effectiveStatus(t) === "preparacion")
              .length,
            listas: tickets.filter((t) => t.status === "lista").length,
            demoradas: criticas,
          }}
          avgDelaySec={avgDelaySec}
        />
      </div>
    </div>
  );
}

/* ============ HEADER ============ */

function Header({
  dateLabel,
  timeLabel,
}: {
  dateLabel: string;
  timeLabel: string;
}) {
  return (
    <header className="flex h-[97px] shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-10">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3.5">
          <span className="font-jakarta text-[22px] font-bold tracking-[0.18em] text-[#C2410C]">
            EMBER
          </span>
          <span className="h-[18px] w-px bg-[#D8CEC2]" />
          <span className="text-[16px] font-semibold">Casa Olivar</span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#1F1F1F] px-2.5 py-1">
            <Flame className="size-3 text-[#E67E22]" strokeWidth={2} />
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#FAF5EB]">
              COCINA EN VIVO
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] tracking-[0.12em] text-[#6B4F3A]">
            {dateLabel} · {timeLabel}
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="font-mono text-[11px] tracking-[0.12em] text-[#6B4F3A]">
            TURNO CENA · T2
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
            <span className="text-[11px] font-semibold text-[#7c8a6a]">
              Servicio activo · brigada en línea
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex w-[240px] items-center gap-2 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3.5 py-2.5">
          <Search className="size-[13px] text-[#A89D8E]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#A89D8E]">
            Buscar mesa, comanda, platillo...
          </span>
        </div>
        <button className="flex size-[38px] items-center justify-center rounded-[10px] border border-[#EDE6DC] bg-white">
          <Bell className="size-[15px] text-[#1F1F1F]" strokeWidth={1.8} />
        </button>
        <UserMenu />
        <Link
          href="/salon"
          className="flex items-center gap-2.5 rounded-[10px] bg-[#1F1F1F] px-[18px] py-3 shadow-[0_6px_14px_rgba(31,31,31,0.1)] transition-opacity hover:opacity-90"
        >
          <LayoutGrid className="size-3.5 text-[#FAF5EB]" strokeWidth={1.8} />
          <span className="text-[13px] font-semibold text-[#FAF5EB]">
            Ir al salón en vivo
          </span>
        </Link>
      </div>
    </header>
  );
}

/* ============ CONTROL BAR ============ */

function ControlBar({
  activeStation,
  onStation,
  avgDelay,
  criticas,
}: {
  activeStation: Station | "todos";
  onStation: (s: Station | "todos") => void;
  avgDelay: string;
  criticas: number;
}) {
  return (
    <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-[#EDE6DC] bg-white px-10">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[9px] font-semibold tracking-[0.15em] text-[#A89D8E]">
          ESTACIÓN
        </span>
        <div className="flex items-center gap-1 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] p-1">
          {STATION_TABS.map((tab) => {
            const active = tab.key === activeStation;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStation(tab.key)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-[#1F1F1F] text-[#FAF5EB]"
                    : "text-[#6B4F3A] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#A89D8E]">
            DEMORA PROM.
          </span>
          <div className="flex items-end gap-1">
            <span className="text-[18px] font-bold leading-none">{avgDelay}</span>
            <span className="text-[11px] font-medium text-[#A89D8E]">min</span>
          </div>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#c2410c]">
            CRÍTICAS
          </span>
          <div className="flex items-end gap-1">
            <span className="text-[18px] font-bold leading-none text-[#C2410C]">
              {criticas}
            </span>
            <span className="text-[11px] font-medium text-[#c2410c]">órdenes</span>
          </div>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <button className="flex items-center gap-1.5 rounded-[10px] border border-[#EDE6DC] bg-white px-3 py-2">
          <ArrowDownUp className="size-[13px] text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] font-semibold">Tiempo de ingreso</span>
          <ChevronDown className="size-3 text-[#A89D8E]" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

/* ============ COLUMN ============ */

function Column({
  dot,
  countBg,
  countFg,
  title,
  subtitle,
  count,
  titleColor,
  headerCard,
  children,
}: {
  dot: string;
  countBg: string;
  countFg: string;
  title: string;
  subtitle: string;
  count: number;
  titleColor?: string;
  headerCard?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-w-[300px] flex-1 flex-col gap-3.5">
      <div
        className={`flex items-center justify-between ${
          headerCard
            ? "rounded-[14px] border border-[#EDE6DC] bg-white px-3.5 py-2.5"
            : "px-0.5 pb-2 pt-0.5"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="rounded-full"
            style={{ width: 10, height: 10, background: dot }}
          />
          <div className="flex flex-col gap-0.5">
            <span
              className="font-mono text-[11px] font-bold tracking-[0.16em]"
              style={{ color: titleColor ?? "#1F1F1F" }}
            >
              {title}
            </span>
            <span className="text-[11px] font-medium text-[#A89D8E]">
              {subtitle}
            </span>
          </div>
        </div>
        <span
          className="flex items-center justify-center rounded-full px-2.5 py-1 font-mono text-[11px] font-bold"
          style={{ background: countBg, color: countFg }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto pb-2">
        {children}
      </div>
    </div>
  );
}

/* ============ TICKET CARD ============ */

function ItemRow({ item, muted }: { item: Ticket["items"][number]; muted?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="font-mono text-[12px] font-bold text-[#C2410C]">
        {item.qty}×
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span
          className={`text-[13px] ${muted ? "font-medium" : "font-semibold"} text-[#1F1F1F]`}
        >
          {item.name}
        </span>
        {item.mods && (
          <span
            className={`text-[11px] ${
              muted ? "italic text-[#A89D8E]" : "font-medium text-[#6B4F3A]"
            }`}
          >
            {muted ? item.mods : `· ${item.mods}`}
          </span>
        )}
      </div>
    </div>
  );
}

function StationChip({ station }: { station: Station }) {
  if (station === "parrilla") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-[#1F1F1F] px-2.5 py-1">
        <Flame className="size-2.5 text-[#E67E22]" strokeWidth={2} />
        <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#FAF5EB]">
          PARRILLA
        </span>
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#EDE6DC] bg-white px-2.5 py-1">
      <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#1F1F1F]">
        {STATION_LABEL[station].toUpperCase()}
      </span>
    </span>
  );
}

function TicketCard({
  t,
  notified,
  onAdvance,
  onDeliver,
  onNotify,
}: {
  t: Ticket;
  notified: boolean;
  onAdvance: (id: string, to: TicketStatus) => void;
  onDeliver: (t: Ticket) => void;
  onNotify: (id: string) => void;
}) {
  // Estado efectivo: una orden activa vencida se pinta como Demorada.
  const eff: TicketStatus =
    (t.status === "nueva" || t.status === "preparacion") &&
    t.elapsedSec > t.targetSec
      ? "demorada"
      : t.status;
  if (eff === "nueva") return <NuevaCard t={t} onAdvance={onAdvance} />;
  if (eff === "preparacion") return <PrepCard t={t} onAdvance={onAdvance} />;
  if (eff === "lista")
    return (
      <ListaCard t={t} notified={notified} onDeliver={onDeliver} onNotify={onNotify} />
    );
  return (
    <DemoraCard t={t} notified={notified} onAdvance={onAdvance} onNotify={onNotify} />
  );
}

function NuevaCard({
  t,
  onAdvance,
}: {
  t: Ticket;
  onAdvance: (id: string, to: TicketStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#EDE6DC] bg-white p-[18px]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold">
            Mesa {t.tableLabel} · {t.zoneName}
          </span>
          <span className="text-[11px] font-medium text-[#A89D8E]">
            Comanda {t.comanda} · {t.comensales} comensales
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[18px] font-bold tracking-[0.06em]">
            {formatTimer(t.elapsedSec)}
          </span>
          <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#A89D8E]">
            INGRESÓ {t.ingreso}
          </span>
        </div>
      </div>
      <span className="h-px w-full bg-[#EDE6DC]" />
      <div className="flex flex-col gap-2">
        {t.items.map((it, i) => (
          <ItemRow key={i} item={it} />
        ))}
      </div>
      {t.note && (
        <div className="flex items-center gap-2 rounded-[10px] bg-[#fbe7d6] px-2.5 py-2">
          <TriangleAlert className="size-3.5 shrink-0 text-[#C2410C]" strokeWidth={2} />
          <span className="text-[12px] font-semibold text-[#C2410C]">{t.note}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <StationChip station={t.station} />
        <CategoryChip label={t.category} />
        <span className="rounded-full bg-[#fbe7d6] px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.12em] text-[#C2410C]">
          NUEVA
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#A89D8E]">
          Mesero · {t.mesero}
        </span>
        <button
          type="button"
          onClick={() => onAdvance(t.id, "preparacion")}
          className="flex items-center gap-1.5 rounded-[10px] bg-[#1F1F1F] px-3 py-2 transition-opacity hover:opacity-90"
        >
          <span className="text-[12px] font-semibold text-[#FAF5EB]">
            Asumir orden
          </span>
          <ArrowRight className="size-3 text-[#E67E22]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function PrepCard({
  t,
  onAdvance,
}: {
  t: Ticket;
  onAdvance: (id: string, to: TicketStatus) => void;
}) {
  const stages = t.stages ?? { done: 0, total: t.items.length };
  const pct = stages.total > 0 ? Math.round((stages.done / stages.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#EDE6DC] bg-white p-[18px]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold">
            Mesa {t.tableLabel} · {t.zoneName}
          </span>
          <span className="text-[11px] font-medium text-[#A89D8E]">
            Comanda {t.comanda} · {t.comensales} comensales
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="flex items-center gap-1.5 rounded-lg bg-[#fbe7d6] px-2 py-1">
            <Timer className="size-2.5 text-[#C2410C]" strokeWidth={2} />
            <span className="font-mono text-[14px] font-bold tracking-[0.04em] text-[#C2410C]">
              {formatTimer(t.elapsedSec)}
            </span>
          </span>
          <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#A89D8E]">
            INGRESÓ {t.ingreso}
          </span>
        </div>
      </div>
      <span className="h-px w-full bg-[#EDE6DC]" />
      <div className="flex flex-col gap-2">
        {t.items.map((it, i) => (
          <ItemRow key={i} item={it} />
        ))}
      </div>
      <div className="flex flex-col gap-1.5 rounded-[12px] bg-[#FAF5EB] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#A89D8E]">
            AVANCE DE LÍNEA
          </span>
          <span className="font-mono text-[9px] font-bold tracking-[0.08em]">
            {stages.done} / {stages.total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EDE6DC]">
          <div
            className="h-full rounded-full bg-[#C2410C] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StationChip station={t.station} />
        <CategoryChip label={t.category} />
        {t.vip && (
          <span className="rounded-full bg-[#fbe7d6] px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.12em] text-[#C2410C]">
            VIP
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#A89D8E]">
          Brigada · {t.mesero}
        </span>
        <button
          type="button"
          onClick={() => onAdvance(t.id, "lista")}
          className="flex items-center gap-1.5 rounded-[10px] bg-[#E67E22] px-3 py-2 transition-colors hover:bg-[#c2410c]"
        >
          <span className="text-[12px] font-bold text-[#1F1F1F]">Marcar listo</span>
        </button>
      </div>
    </div>
  );
}

function ListaCard({
  t,
  notified,
  onDeliver,
  onNotify,
}: {
  t: Ticket;
  notified: boolean;
  onDeliver: (t: Ticket) => void;
  onNotify: (id: string) => void;
}) {
  const dark = t.variant === "vip";
  const cream = t.variant === "takeaway";
  const bg = dark ? "#1F1F1F" : cream ? "#fbe7d6" : "#FFFFFF";
  const fg = dark ? "#FAF5EB" : "#1F1F1F";
  const sub = dark ? "#A89D8E" : "#6B4F3A";
  const sep = dark ? "#3a322c" : "#EDE6DC";
  return (
    <div
      className="flex flex-col gap-3 rounded-[18px] p-[18px]"
      style={{
        background: bg,
        border: dark ? "none" : `1px solid ${cream ? "#E8B07F" : "#EDE6DC"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-semibold" style={{ color: fg }}>
            Mesa {t.tableLabel} · {t.zoneName}
          </span>
          <span
            className="font-mono text-[9px] tracking-[0.12em]"
            style={{ color: dark ? "#A89D8E" : "#A89D8E" }}
          >
            INGRESO {t.ingreso}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-bold tracking-[0.04em] text-[#7c8a6a]">
            00:00 · LISTO
          </span>
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#A89D8E]">
            OBJETIVO {formatTimer(t.targetSec)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: sub }}>
          {t.comanda}
        </span>
        <span className="size-[3px] rounded-full bg-[#d8cec2]" />
        <span className="text-[11px]" style={{ color: sub }}>
          Mesero {t.mesero}
        </span>
        <span className="size-[3px] rounded-full bg-[#d8cec2]" />
        <span className="text-[11px]" style={{ color: sub }}>
          {t.comensales} comensales
        </span>
      </div>
      <span className="h-px w-full" style={{ background: sep }} />
      <div className="flex flex-col gap-2">
        {t.items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <span className="font-mono text-[12px] font-bold text-[#C2410C]">
              {it.qty}×
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-[13px] font-medium" style={{ color: fg }}>
                {it.name}
              </span>
              {it.mods && (
                <span className="text-[11px] italic text-[#A89D8E]">{it.mods}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-[12px] px-2.5 py-1"
          style={{
            background: dark ? "#3a322c" : "#FAF5EB",
            border: dark ? "none" : "1px solid #EDE6DC",
          }}
        >
          <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#6B4F3A]">
            {STATION_LABEL[t.station].toUpperCase()}
          </span>
        </span>
        <span className="rounded-[12px] bg-[#7c8a6a] px-2.5 py-1">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#FAF5EB]">
            LISTO
          </span>
        </span>
        {t.vip && (
          <span className="rounded-[12px] bg-[#E67E22] px-2.5 py-1">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#1F1F1F]">
              VIP
            </span>
          </span>
        )}
      </div>
      <div className="flex gap-2 pt-1.5">
        <button
          type="button"
          onClick={() => onNotify(t.id)}
          className="flex flex-1 items-center justify-center rounded-[12px] px-3 py-2.5"
          style={{ background: notified ? "#7c8a6a" : "#C2410C" }}
        >
          <span className="text-[12px] font-semibold text-[#FAF5EB]">
            {notified ? "Salón avisado ✓" : "Avisar a salón"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDeliver(t)}
          className="flex flex-1 items-center justify-center rounded-[12px] bg-white px-3 py-2.5"
          style={{ border: "1px solid #EDE6DC" }}
        >
          <span className="text-[12px] font-medium text-[#1F1F1F]">
            Marcar entregado
          </span>
        </button>
      </div>
    </div>
  );
}

function DemoraCard({
  t,
  notified,
  onAdvance,
  onNotify,
}: {
  t: Ticket;
  notified: boolean;
  onAdvance: (id: string, to: TicketStatus) => void;
  onNotify: (id: string) => void;
}) {
  const over = t.elapsedSec - t.targetSec;
  return (
    <div className="flex overflow-hidden rounded-[18px] border-[1.5px] border-[#E8B07F] bg-[#fbe7d6]">
      <span className="w-1 shrink-0 bg-[#C2410C]" />
      <div className="flex flex-1 flex-col gap-3 p-[18px] pl-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-semibold">
              Mesa {t.tableLabel} · {t.zoneName}
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#C2410C]">
              INGRESO {t.ingreso} · {t.items.length} PLATOS DEMORADOS
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="flex items-center gap-1.5">
              <Flame className="size-3.5 text-[#C2410C]" strokeWidth={2} />
              <span className="font-mono text-[13px] font-bold tracking-[0.04em] text-[#C2410C]">
                {formatTimer(t.elapsedSec)} · DEMORA
              </span>
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B4F3A]">
              OBJETIVO {formatTimer(t.targetSec)} · +{formatTimer(over > 0 ? over : 0)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-[#6B4F3A]">
            {t.comanda}
          </span>
          <span className="size-[3px] rounded-full bg-[#d8cec2]" />
          <span className="text-[11px] text-[#6B4F3A]">Mesera {t.mesero}</span>
          <span className="size-[3px] rounded-full bg-[#d8cec2]" />
          <span className="text-[11px] text-[#6B4F3A]">{t.comensales} comensales</span>
        </div>
        <span className="h-px w-full bg-[#EDE6DC]" />
        <div className="flex flex-col gap-2">
          {t.items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-mono text-[12px] font-bold text-[#C2410C]">
                {it.qty}×
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[13px] font-medium text-[#1F1F1F]">
                  {it.name}
                </span>
                {it.mods && (
                  <span className="text-[11px] italic text-[#A89D8E]">{it.mods}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-[12px] border border-[#EDE6DC] bg-[#FAF5EB] px-2.5 py-1">
            <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#6B4F3A]">
              {STATION_LABEL[t.station].toUpperCase()}
            </span>
          </span>
          <span className="rounded-[12px] bg-[#1F1F1F] px-2.5 py-1">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#E67E22]">
              CRÍTICA
            </span>
          </span>
          {t.glutenFree && (
            <span className="rounded-[12px] bg-[#1F1F1F] px-2.5 py-1">
              <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#FAF5EB]">
                GLUTEN
              </span>
            </span>
          )}
        </div>
        {t.reclamos != null && (
          <div className="flex items-center gap-1.5">
            <TriangleAlert className="size-3 text-[#C2410C]" strokeWidth={2} />
            <span className="font-mono text-[10px] tracking-[0.06em] text-[#C2410C]">
              Reclamado ×{t.reclamos} · último {t.lastReclamo}
            </span>
          </div>
        )}
        <div className="flex gap-2 pt-1.5">
          <button
            type="button"
            onClick={() => onAdvance(t.id, "preparacion")}
            className="flex flex-1 items-center justify-center rounded-[12px] bg-[#1F1F1F] px-3 py-2.5"
          >
            <span className="text-[12px] font-semibold text-[#FAF5EB]">
              Asumir por brigada
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNotify(t.id)}
            className="flex flex-1 items-center justify-center rounded-[12px] border border-[#EDE6DC] bg-[#fbe7d6] px-3 py-2.5"
          >
            <span className="text-[12px] font-medium text-[#1F1F1F]">
              {notified ? "Chef avisado ✓" : "Avisar al chef"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#EDE6DC] bg-white px-2.5 py-1">
      <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#1F1F1F]">
        {label}
      </span>
    </span>
  );
}

/* ============ SIDE PANEL ============ */

function SidePanel({
  tickets,
  counts,
  avgDelaySec,
}: {
  tickets: Ticket[];
  counts: { nuevas: number; preparacion: number; listas: number; demoradas: number };
  avgDelaySec: number;
}) {
  // Carga por estación (sobre tickets activos).
  const active = tickets.filter((t) => t.status !== "lista");
  const stationCounts = new Map<Station, number>();
  for (const t of active)
    stationCounts.set(t.station, (stationCounts.get(t.station) ?? 0) + 1);
  const maxStation = Math.max(1, ...stationCounts.values());
  const topStations = (["parrilla", "platos", "entradas"] as Station[]).map((s) => ({
    station: s,
    count: stationCounts.get(s) ?? 0,
    pct: Math.round(((stationCounts.get(s) ?? 0) / maxStation) * 100),
  }));
  const leadStation = topStations[0];

  // Platillo líder (item más frecuente).
  const itemCounts = new Map<string, number>();
  for (const t of tickets)
    for (const it of t.items)
      itemCounts.set(it.name, (itemCounts.get(it.name) ?? 0) + it.qty);
  let leadItem = "—";
  let leadItemQty = 0;
  for (const [name, qty] of itemCounts)
    if (qty > leadItemQty) {
      leadItem = name;
      leadItemQty = qty;
    }

  const metaSec = 13 * 60 + 24;
  const avgPct = Math.min(100, Math.round((avgDelaySec / (20 * 60)) * 100));

  return (
    <aside className="flex w-[380px] shrink-0 flex-col gap-[18px] overflow-y-auto">
      {/* Resumen del servicio */}
      <div className="flex flex-col gap-[18px] rounded-2xl border border-[#EDE6DC] bg-white p-[22px] shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold">
              Resumen del servicio · Cocina
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#fbe7d6] px-2 py-1">
              <span className="size-1.5 rounded-full bg-[#E67E22]" />
              <span className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#C2410C]">
                EN VIVO
              </span>
            </span>
          </div>
          <span className="text-[12px] text-[#6b6660]">
            Resumen operativo en tiempo real
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-[#EDE6DC]">
          <StatCell label="NUEVAS" value={counts.nuevas} labelColor="#c2410c" />
          <StatCell label="EN PREPARACIÓN" value={counts.preparacion} labelColor="#c2410c" />
          <StatCell label="LISTAS" value={counts.listas} labelColor="#7c8a6a" />
          <StatCell
            label="DEMORADAS"
            value={counts.demoradas}
            labelColor="#7a2e14"
            valueColor="#c95a3d"
          />
        </div>
      </div>

      {/* Tiempo promedio */}
      <div className="flex flex-col gap-4 rounded-2xl bg-[#1F1F1F] p-[22px]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#E8B07F]">
            TIEMPO PROMEDIO DE PREPARACIÓN
          </span>
          <Timer className="size-4 text-[#E8B07F]" strokeWidth={1.8} />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-[42px] font-bold leading-none text-[#FAF5EB]">
            {formatTimer(avgDelaySec)}
          </span>
          <span className="pb-2 text-[14px] font-medium text-[#6b6660]">min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3 text-[#e67e22]" strokeWidth={2} />
          <span className="text-[12px] font-medium text-[#a89d8e]">
            {avgDelaySec > metaSec ? "+" : "−"}
            {formatTimer(Math.abs(avgDelaySec - metaSec))} vs meta del turno (13:24)
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0E0A08]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${avgPct}%`,
                background: "linear-gradient(90deg, #A05A1A, #FF8400)",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#6b6660]">
              META 13:24
            </span>
            <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#E8B07F]">
              ACTUAL {formatTimer(avgDelaySec)}
            </span>
          </div>
        </div>
      </div>

      {/* Estación con mayor carga */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#EDE6DC] bg-white p-5 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#c2410c]">
            ESTACIÓN CON MAYOR CARGA
          </span>
          <span className="flex size-7 items-center justify-center rounded-full bg-[#fbe7d6]">
            <ChefHat className="size-3.5 text-[#C2410C]" strokeWidth={1.8} />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[24px] font-bold">
            {STATION_LABEL[leadStation.station]}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#fbe7d6] px-2.5 py-1.5">
            <span className="size-[5px] rounded-full bg-[#E67E22]" />
            <span className="text-[11px] font-semibold text-[#c2410c]">
              {leadStation.count} órdenes activas
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {topStations.map((s, i) => (
            <div key={s.station} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium">
                  {STATION_LABEL[s.station]}
                </span>
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.12em]"
                  style={{ color: i === 0 ? "#c2410c" : "#6b6660" }}
                >
                  {s.pct}%
                </span>
              </div>
              <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#f7f3ee]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.pct}%`, background: i === 0 ? "#E67E22" : "#C2410C" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platillo líder */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-[#E8B07F] bg-[#fbe7d6] p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#E8B07F] bg-white">
          <Flame className="size-5 text-[#C2410C]" strokeWidth={1.8} />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#c2410c]">
            PLATILLO CON MAYOR SALIDA
          </span>
          <span className="text-[18px] font-semibold">{leadItem}</span>
          <span className="text-[12px] font-medium text-[#7a2e14]">
            {leadItemQty} órdenes en cocina
          </span>
        </div>
      </div>

      {/* Ember Insight */}
      <div className="flex flex-col gap-3.5 rounded-2xl bg-[#1F1F1F] p-[22px]">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#1f1f1f] ring-1 ring-[#3a322c]">
            <Sparkles className="size-3 text-[#e67e22]" strokeWidth={2} />
          </span>
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#e67e22]">
            EMBER INSIGHT · RECOMENDACIÓN
          </span>
        </div>
        <p className="text-[13px] font-medium leading-[1.5] text-[#FAF5EB]">
          Conviene reforzar emplatado en los próximos 20 min. La{" "}
          {STATION_LABEL[leadStation.station]} concentra el {leadStation.pct}% de la
          carga.
        </p>
        <span className="h-px w-full bg-[#3a322c]" />
        <p className="text-[11px] font-medium italic leading-[1.4] text-[#c2410c]">
          “El pase define el ritmo del salón.”
        </p>
      </div>

      {/* Alertas operativas */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EDE6DC] bg-white p-5 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#7a2e14]">
            ALERTAS OPERATIVAS
          </span>
          <span className="rounded-full bg-[#fbe7d6] px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-[#7a2e14]">
            2
          </span>
        </div>
        <AlertItem
          icon={<TriangleAlert className="size-3.5 text-[#c95a3d]" strokeWidth={1.8} />}
          title="Mesa 07 supera tiempo promedio"
          sub="+04:18 sobre el promedio"
        />
        <AlertItem
          icon={<Package className="size-3.5 text-[#c95a3d]" strokeWidth={1.8} />}
          title="Cocina sin morcilla en stock"
          sub="Sustituir o retirar del menú"
        />
      </div>
    </aside>
  );
}

function StatCell({
  label,
  value,
  labelColor,
  valueColor,
}: {
  label: string;
  value: number;
  labelColor: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-white p-3.5">
      <span
        className="font-mono text-[9px] font-semibold tracking-[0.14em]"
        style={{ color: labelColor }}
      >
        {label}
      </span>
      <span
        className="text-[30px] font-bold leading-none"
        style={{ color: valueColor ?? "#1F1F1F" }}
      >
        {value}
      </span>
    </div>
  );
}

function AlertItem({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] bg-[#fbe7d6] px-3 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-semibold text-[#1F1F1F]">{title}</span>
        <span className="text-[11px] font-medium text-[#7a2e14]">{sub}</span>
      </div>
    </div>
  );
}
