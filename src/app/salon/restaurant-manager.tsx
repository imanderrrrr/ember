"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Calendar,
  ChefHat,
  Clock,
  DoorOpen,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  List,
  LogOut,
  Minus,
  MousePointerClick,
  MoreVertical,
  Moon,
  Move,
  Plus,
  Receipt,
  Search,
  Sparkles,
  SquarePen,
  SquareUser,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { updateTable } from "./_lib/client-api";
import { OrderModal } from "./order-modal";
import type { FloorPlan, SalonTable, Shape, TableStatus, Zone } from "./_lib/types";
import { STATUS_COLOR, STATUS_LABEL } from "./_lib/types";
import { ZonesPanel } from "./zones-panel";
import { listReservationsByTable } from "@/app/reservas/_lib/client-api";
import type { ReservationDTO } from "@/app/reservas/_lib/types";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import { formatQ, type Bill } from "@/app/caja/_lib/billing";

type Status = TableStatus;

const COLOR = STATUS_COLOR;

/** Usuario de sesión que se muestra en el TopBar. */
type SessionUser = {
  name: string;
  role: string | null;
  avatarInitials: string | null;
};

/** Etiqueta legible para el rol crudo de la DB (ej. gerente_operativo). */
const ROLE_LABEL: Record<string, string> = {
  gerente_operativo: "Gerente operativo",
  anfitrion: "Anfitrión",
  mesero: "Mesero",
  cocina: "Cocina",
  caja: "Caja",
  admin: "Administrador",
};

function roleLabel(role: string | null): string {
  if (!role) return "En turno";
  return (
    ROLE_LABEL[role] ??
    role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")
  );
}

/** Iniciales de respaldo a partir del nombre si la DB no las trae. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Decoradores visuales temporales por etiqueta de mesa para timers del
 * módulo de pedidos, que aún no existe. Las horas de reserva ya vienen del
 * backend y se mezclan abajo por `tableId`.
 *
 * - `timer`            → cronómetro visible bajo el número (mm:ss o hh:mm:ss).
 * - `star`             → indicador de "mesa especial" (aniversario, VIP).
 */
const TABLE_DECOR: Record<
  string,
  { timer?: string; star?: boolean }
> = {
  // Salón principal
  "02": { timer: "01:12" },
  "06": { timer: "00:35" },
  "04": { timer: "00:45" },
  "07": { timer: "01:24:38", star: true },
  "08": { timer: "01:45" },
  // Terraza
  T2: { timer: "00:55" },
  T3: { timer: "01:30" },
  T8: { timer: "00:20" },
  // Barra
  B2: { timer: "00:45" },
  B3: { timer: "01:10" },
  B5: { timer: "01:55" },
  // VIP
  V1: { timer: "02:10", star: true },
  V2: { timer: "00:30" },
};

/**
 * Texto secundario compacto para mesas reales (sin cronómetro curado): así una
 * mesa que el mesero acaba de enviar a cocina, o que pasa a esperando cuenta,
 * muestra su estado bajo el número en vez de quedar sin etiqueta. Las mesas
 * demo siguen mostrando su cronómetro (TABLE_DECOR), fieles al diseño.
 */
const SUBLABEL_FALLBACK: Record<"ocupada" | "cocina" | "esperando", string> = {
  ocupada: "OCUPADA",
  cocina: "EN COCINA",
  esperando: "CUENTA",
};

export function RestaurantManager({
  plan,
  activeZoneId,
  reservations,
  serviceDate,
  user,
  billByTable,
}: {
  plan: FloorPlan;
  activeZoneId: string | null;
  reservations: ReservationDTO[];
  serviceDate: string;
  user: SessionUser | null;
  /** Pedido real por mesa (id → Bill) desde las órdenes de cocina. */
  billByTable: Record<string, Bill>;
}) {
  // Salón en vivo: refresca los estados de mesa en tiempo real (cambios del
  // mesero y de cocina aparecen sin recargar).
  useLiveRefresh(4000);

  const activeZone =
    plan.zones.find((z) => z.id === activeZoneId) ?? plan.zones[0] ?? null;
  const activeZoneTables = plan.tables.filter((t) => t.zoneId === activeZone?.id);
  const activeZoneShapes = plan.shapes.filter(
    (s) => s.zoneId === activeZone?.id || s.zoneId === null,
  );

  // Selección local en cliente: no necesitamos persistirla en URL todavía
  // porque el detalle vive enteramente en este panel. Si en el futuro
  // queremos deep-linking a una mesa, lo movemos a `?mesa=<id>`.
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Vista del área principal — toggle Plano/Lista del sub-header.
  const [view, setView] = useState<"plano" | "lista">("plano");

  // La selección se resuelve sobre TODAS las mesas del plano (no solo la zona
  // activa), para que la búsqueda pueda seleccionar una mesa de otra zona y
  // el panel derecho la muestre incluso mientras la zona termina de cambiar.
  const selectedTable =
    plan.tables.find((t) => t.id === selectedTableId) ?? null;
  const zoneNameById = new Map(plan.zones.map((z) => [z.id, z.name]));

  const router = useRouter();
  const [, startSearchNav] = useTransition();

  // Al elegir un resultado de búsqueda: seleccionamos la mesa y, si vive en
  // otra zona, cambiamos la zona activa (?zone=) para que aparezca en el plano.
  const handlePickResult = (tableId: string, zoneId: string) => {
    setSelectedTableId(tableId);
    if (zoneId !== activeZone?.id) {
      startSearchNav(() => router.push(`/salon?zone=${zoneId}`));
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-[1600px] flex-col bg-[#F7F3EE] font-sans text-[#1F1F1F]">
      <TopBar
        tables={plan.tables}
        zones={plan.zones}
        reservations={reservations}
        onPickResult={handlePickResult}
        user={user}
      />
      <div className="flex flex-1 min-h-[1028px]">
        <LeftSidebar zones={plan.zones} tables={plan.tables} activeZoneId={activeZone?.id ?? null} />
        <MainFloorPlan
          zone={activeZone}
          tables={activeZoneTables}
          shapes={activeZoneShapes}
          reservations={reservations}
          zoneNameById={zoneNameById}
          selectedTableId={selectedTableId}
          onSelectTable={setSelectedTableId}
          view={view}
          onChangeView={setView}
        />
        <RightDetailPanel
          table={selectedTable}
          reservations={reservations}
          zoneName={selectedTable ? zoneNameById.get(selectedTable.zoneId) ?? null : null}
          serviceDate={serviceDate}
          bill={selectedTable ? billByTable[selectedTable.id] ?? null : null}
          onClose={() => setSelectedTableId(null)}
        />
      </div>
    </div>
  );
}

/* ============ TOP BAR ============ */

function TopBar({
  tables,
  zones,
  reservations,
  onPickResult,
  user,
}: {
  tables: SalonTable[];
  zones: Zone[];
  reservations: ReservationDTO[];
  onPickResult: (tableId: string, zoneId: string) => void;
  user: SessionUser | null;
}) {
  const displayName = user?.name ?? "Usuario";
  const displayRole = roleLabel(user?.role ?? null);
  const displayInitials = user?.avatarInitials || initialsFrom(displayName);
  return (
    <header className="animate-salon-topbar flex h-[72px] w-full items-center justify-between border-b border-[#EDE6DC] bg-white px-7">
      {/* Left */}
      <div className="flex items-center gap-[18px]">
        <Link
          href="/dashboard"
          className="group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[#6B4F3A] transition-colors hover:bg-[#F7F3EE]"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft
            className="size-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={1.8}
          />
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em]">
            DASHBOARD
          </span>
        </Link>
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2.5">
          <span className="block size-[30px] rounded-full bg-[#1F1F1F]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#1F1F1F]">
              CASA OLIVAR
            </span>
            <span className="text-[18px] font-semibold leading-tight">Salón en vivo</span>
          </div>
        </div>
        <span className="h-9 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-[#6B6660]">Sáb, 02 mayo 2026</span>
            <span className="font-mono text-[14px] font-semibold text-[#1F1F1F]">21:48</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">TURNO</span>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
              <span className="text-[13px] font-medium text-[#1F1F1F]">
                Cena · 18:30—23:00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3.5">
        <SearchBox
          tables={tables}
          zones={zones}
          reservations={reservations}
          onPickResult={onPickResult}
        />
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <Link
          href="/salon/edit"
          className="flex items-center gap-2 rounded-[10px] border border-[#1F1F1F] bg-white px-4 py-2.5 hover:bg-[#F7F3EE]"
        >
          <LayoutGrid className="size-3.5 text-[#1F1F1F]" strokeWidth={1.8} />
          <span className="text-[13px] font-medium">Modo edición</span>
        </Link>
        <Link
          href="/reservas/nueva"
          className="flex items-center gap-2 rounded-[10px] bg-[#E67E22] px-[18px] py-2.5 transition-colors hover:bg-[#c2410c]"
        >
          <Plus className="size-3.5 text-white" strokeWidth={2.2} />
          <span className="text-[13px] font-semibold text-white">Nueva reserva</span>
        </Link>
        {/* Solo visible para roles de cocina */}
        {(user?.role === "cocina" || user?.role === "chef") && (
          <Link
            href="/cocina"
            className="flex items-center gap-2 rounded-[10px] bg-[#4E7DA6] px-[18px] py-2.5 transition-opacity hover:opacity-90"
          >
            <ChefHat className="size-3.5 text-white" strokeWidth={1.8} />
            <span className="text-[13px] font-semibold text-white">Cocina en vivo</span>
          </Link>
        )}
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#6B4F3A]">
            <span className="font-mono text-[10px] font-bold tracking-[0.04em] text-[#FAF5EB]">
              {displayInitials}
            </span>
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold leading-tight">{displayName}</span>
            <span className="text-[10px] text-[#6B6660]">{displayRole} · Activa</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============ SEARCH ============ */

type SearchResult = {
  kind: "mesa" | "cliente";
  tableId: string;
  zoneId: string;
  primary: string;
  secondary: string;
  status: Status;
};

/**
 * Buscador del salón en vivo. Indexa en cliente:
 *  - mesas por etiqueta (cualquier zona),
 *  - clientes sentados (customerName de la mesa),
 *  - clientes con reserva del día (customerName de la reserva), resolviendo
 *    la mesa por `tableId` o por snapshot zona+etiqueta.
 * Al elegir un resultado, sube el tableId+zoneId al manager para seleccionar
 * la mesa y, si hace falta, cambiar la zona activa.
 */
function SearchBox({
  tables,
  zones,
  reservations,
  onPickResult,
}: {
  tables: SalonTable[];
  zones: Zone[];
  reservations: ReservationDTO[];
  onPickResult: (tableId: string, zoneId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [prevQuery, setPrevQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const zoneNameById = useMemo(
    () => new Map(zones.map((z) => [z.id, z.name])),
    [zones],
  );

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];
    const seen = new Set<string>();
    const push = (r: SearchResult, key: string) => {
      if (seen.has(key)) return;
      seen.add(key);
      out.push(r);
    };

    // Mesas por etiqueta.
    for (const t of tables) {
      if (t.label.toLowerCase().includes(q)) {
        push(
          {
            kind: "mesa",
            tableId: t.id,
            zoneId: t.zoneId,
            primary: `Mesa ${t.label}`,
            secondary: `${zoneNameById.get(t.zoneId) ?? "—"} · ${STATUS_LABEL[t.status]}`,
            status: t.status,
          },
          `mesa:${t.id}`,
        );
      }
    }

    // Clientes sentados: solo mesas realmente en servicio (ocupada / en
    // cocina / esperando cuenta). Una mesa libre/reservada/limpieza no tiene
    // un comensal presente, aunque el seed traiga un customerName residual.
    const seatedStatuses: Status[] = ["ocupada", "cocina", "esperando"];
    for (const t of tables) {
      if (
        seatedStatuses.includes(t.status) &&
        t.customerName &&
        t.customerName.toLowerCase().includes(q)
      ) {
        push(
          {
            kind: "cliente",
            tableId: t.id,
            zoneId: t.zoneId,
            primary: t.customerName,
            secondary: `Sentado · Mesa ${t.label} · ${zoneNameById.get(t.zoneId) ?? "—"}`,
            status: t.status,
          },
          `cli-mesa:${t.id}`,
        );
      }
    }

    // Clientes con reserva del día.
    for (const r of reservations) {
      if (!r.customerName.toLowerCase().includes(q)) continue;
      const table =
        (r.tableId && tables.find((t) => t.id === r.tableId)) ||
        tables.find(
          (t) =>
            zoneNameById.get(t.zoneId) === r.zoneName &&
            t.label === r.tableLabel,
        );
      if (!table) continue;
      push(
        {
          kind: "cliente",
          tableId: table.id,
          zoneId: table.zoneId,
          primary: r.customerName,
          secondary: `Reserva ${r.timeSlot} · Mesa ${r.tableLabel} · ${r.zoneName}`,
          status: table.status,
        },
        `cli-res:${r.id}`,
      );
    }

    return out.slice(0, 8);
  }, [query, tables, reservations, zoneNameById]);

  // Reiniciar el item resaltado cuando cambia la búsqueda (reset en render,
  // sin effect).
  if (query !== prevQuery) {
    setPrevQuery(query);
    setHighlight(0);
  }

  // Atajo "/" para enfocar el buscador (ignora si ya se escribe en un campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable;
      if (typing) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cerrar al hacer click fuera.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (r: SearchResult | undefined) => {
    if (!r) return;
    onPickResult(r.tableId, r.zoneId);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const showDropdown = open && query.trim().length > 0;
  const mesas = results.filter((r) => r.kind === "mesa");
  const clientes = results.filter((r) => r.kind === "cliente");

  return (
    <div ref={boxRef} className="relative w-[320px]">
      <div
        className="flex items-center gap-2.5 rounded-[10px] border bg-[#F7F3EE] px-4 py-2.5 transition-colors"
        style={{ borderColor: showDropdown ? "#E67E22" : "#EDE6DC" }}
      >
        <Search className="size-4 shrink-0 text-[#6B6660]" strokeWidth={1.8} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (query) setQuery("");
              else inputRef.current?.blur();
              setOpen(false);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(results[highlight]);
            }
          }}
          placeholder="Buscar mesa o cliente"
          className="flex-1 bg-transparent text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#6B6660]"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              inputRef.current?.focus();
            }}
            className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[#6B6660] hover:bg-[#EDE6DC]"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        ) : (
          <span className="shrink-0 rounded border border-[#EDE6DC] bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#6B4F3A]">
            /
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[380px] overflow-hidden rounded-xl border border-[#EDE6DC] bg-white shadow-[0_12px_32px_rgba(31,27,22,0.14)]">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-5 py-7 text-center">
              <Search className="size-5 text-[#a89d8e]" strokeWidth={1.6} />
              <span className="text-[13px] font-medium text-[#1F1F1F]">
                Sin coincidencias
              </span>
              <span className="text-[11.5px] text-[#6B6660]">
                No encontramos mesas ni clientes para “{query.trim()}”.
              </span>
            </div>
          ) : (
            <div className="flex max-h-[420px] flex-col overflow-y-auto py-1.5">
              {mesas.length > 0 && (
                <SearchGroupLabel label="MESAS" count={mesas.length} />
              )}
              {mesas.map((r) => (
                <SearchResultRow
                  key={`mesa:${r.tableId}`}
                  result={r}
                  active={results[highlight] === r}
                  onPick={() => pick(r)}
                  onHover={() => setHighlight(results.indexOf(r))}
                />
              ))}
              {clientes.length > 0 && (
                <SearchGroupLabel label="CLIENTES" count={clientes.length} />
              )}
              {clientes.map((r) => (
                <SearchResultRow
                  key={`${r.secondary}:${r.tableId}`}
                  result={r}
                  active={results[highlight] === r}
                  onPick={() => pick(r)}
                  onHover={() => setHighlight(results.indexOf(r))}
                />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[#EDE6DC] bg-[#F7F3EE] px-3.5 py-2">
            <span className="font-mono text-[9.5px] tracking-[0.1em] text-[#6B6660]">
              ↑↓ NAVEGAR · ↵ ABRIR · ESC CERRAR
            </span>
            <span className="text-[10px] text-[#a89d8e]">
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchGroupLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3.5 pb-1 pt-2">
      <span className="font-mono text-[9.5px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
        {label}
      </span>
      <span className="font-mono text-[9.5px] text-[#a89d8e]">{count}</span>
    </div>
  );
}

function SearchResultRow({
  result,
  active,
  onPick,
  onHover,
}: {
  result: SearchResult;
  active: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onPick();
      }}
      onMouseEnter={onHover}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
      style={{ background: active ? "#F7F3EE" : "transparent" }}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: active ? "#FBE7D6" : "#F7F3EE" }}
      >
        {result.kind === "mesa" ? (
          <LayoutGrid className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
        ) : (
          <SquareUser className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-[#1F1F1F]">
          {result.primary}
        </span>
        <span className="truncate text-[11px] text-[#6B6660]">
          {result.secondary}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className="size-2 rounded-full"
          style={{ background: COLOR[result.status] }}
        />
        <span className="text-[10px] font-medium text-[#6B6660]">
          {STATUS_LABEL[result.status]}
        </span>
      </span>
    </button>
  );
}

/* ============ LEFT SIDEBAR ============ */

const FILTERS: { status: Status; label: string }[] = [
  { status: "libre", label: "Libre" },
  { status: "ocupada", label: "Ocupada" },
  { status: "reservada", label: "Reservada" },
  { status: "cocina", label: "En cocina" },
  { status: "esperando", label: "Esperando cuenta" },
  { status: "limpieza", label: "Limpieza pendiente" },
];

const LEGEND: { color: string; label: string }[] = [
  { color: "#7c8a6a", label: "Libre" },
  { color: "#C95A3D", label: "Ocupada" },
  { color: "#D8A641", label: "Reservada" },
  { color: "#4E7DA6", label: "En cocina" },
  { color: "#7D5BA6", label: "Esp. cuenta" },
  { color: "#a89d8e", label: "Limpieza" },
];

function LeftSidebar({
  zones,
  tables,
  activeZoneId,
}: {
  zones: Zone[];
  tables: SalonTable[];
  activeZoneId: string | null;
}) {
  /**
   * Cuenta total de mesas por estado en *todas* las zonas — alimenta los
   * filtros del sidebar. Los filtros aún no son interactivos en el live;
   * sirven como overview rápido.
   */
  const totals: Record<Status, number> = {
    libre: 0,
    ocupada: 0,
    reservada: 0,
    cocina: 0,
    esperando: 0,
    limpieza: 0,
  };
  for (const t of tables) totals[t.status] = (totals[t.status] ?? 0) + 1;

  return (
    <aside className="animate-salon-sidebar stagger-children flex w-[286px] flex-col border-r border-[#EDE6DC] bg-[#F7F3EE]">
      {/* Brand Block */}
      <div className="flex items-center gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <span className="block size-9 rounded-full bg-[#E67E22]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold leading-tight">Casa Olivar</span>
          <span className="text-[11px] text-[#6B6660]">Gestión de salón</span>
        </div>
      </div>

      {/* Zonas (componente cliente: cambiar / crear / eliminar) */}
      <ZonesPanel zones={zones} tables={tables} activeZoneId={activeZoneId} />

      {/* Filtros */}
      <section className="flex flex-col gap-2.5 border-b border-[#EDE6DC] p-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          FILTROS POR ESTADO
        </span>
        <div className="flex flex-col gap-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.status}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-[#EDE6DC]/40"
            >
              <span className="size-2 rounded-full" style={{ background: COLOR[f.status] }} />
              <span className="flex-1 text-left text-[12px] text-[#1F1F1F]">{f.label}</span>
              <span className="font-mono text-[11px] text-[#6B6660]">
                {String(totals[f.status]).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Leyenda */}
      <section className="flex flex-col gap-3 border-b border-[#EDE6DC] p-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          LEYENDA
        </span>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="block size-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-[11px]">{l.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />

      {/* Turno bottom */}
      <div className="flex items-center gap-2 px-6 pb-5 pt-4">
        <Moon className="size-3 text-[#7C8A6A]" strokeWidth={2} />
        <span className="font-mono text-[10px] text-[#6B6660]">
          Turno Cena · 18:30—23:00
        </span>
      </div>
    </aside>
  );
}

/* ============ MAIN FLOOR PLAN ============ */

function MainFloorPlan({
  zone,
  tables,
  shapes,
  reservations,
  zoneNameById,
  selectedTableId,
  onSelectTable,
  view,
  onChangeView,
}: {
  zone: { id: string; name: string } | null;
  tables: SalonTable[];
  shapes: Shape[];
  reservations: ReservationDTO[];
  zoneNameById: Map<string, string>;
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
  view: "plano" | "lista";
  onChangeView: (next: "plano" | "lista") => void;
}) {
  const totalSeats = tables.reduce((acc, t) => acc + t.seats, 0);
  const occupiedSeats = tables
    .filter((t) => t.status === "ocupada" || t.status === "cocina" || t.status === "esperando")
    .reduce((acc, t) => acc + t.seats, 0);

  return (
    <main className="animate-salon-main flex flex-1 flex-col bg-[#F7F3EE]">
      {/* Sub-header */}
      <div className="flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-[#F7F3EE] px-7">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[15px] font-semibold">{zone?.name ?? "Sin zona"}</span>
            <span className="text-[13px] text-[#6B6660]">· {tables.length} mesas</span>
          </div>
          <span className="h-6 w-px bg-[#EDE6DC]" />
          <div className="flex items-center gap-2 rounded-full border border-[#EDE6DC] bg-white px-3 py-1.5">
            <span className="block size-1.5 rounded-full bg-[#7C8A6A]" />
            <span className="text-[11px]">En vivo · sincronizado hace 2s</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2">
            <Users className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[12px] text-[#6B6660]">Aforo</span>
            <span className="font-mono text-[13px] font-semibold">
              {occupiedSeats} / {totalSeats}
            </span>
          </div>
          <div
            className="flex items-center gap-0.5 rounded-lg border border-[#EDE6DC] bg-white p-[3px]"
            role="tablist"
            aria-label="Vista del salón"
          >
            <ViewToggleBtn
              icon={<LayoutDashboard className="size-3" strokeWidth={2} />}
              label="Plano"
              active={view === "plano"}
              onClick={() => onChangeView("plano")}
            />
            <ViewToggleBtn
              icon={<List className="size-3" strokeWidth={2} />}
              label="Lista"
              active={view === "lista"}
              onClick={() => onChangeView("lista")}
            />
          </div>
        </div>
      </div>

      {/* Área principal: plano o lista. Mantenemos `p-6` para que ambas
          vistas compartan el mismo padding contra el sub-header / sidebars. */}
      <div className="flex flex-1 p-6">
        {view === "plano" ? (
          <FloorPlanCanvas
            tables={tables}
            shapes={shapes}
            reservations={reservations}
            zoneNameById={zoneNameById}
            selectedTableId={selectedTableId}
            onSelectTable={onSelectTable}
          />
        ) : (
          <TableListView
            tables={tables}
            reservations={reservations}
            zoneNameById={zoneNameById}
            selectedTableId={selectedTableId}
            onSelectTable={onSelectTable}
          />
        )}
      </div>
    </main>
  );
}

function ViewToggleBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
        active ? "bg-[#1F1F1F] text-white" : "text-[#6B6660] hover:bg-[#F7F3EE]"
      }`}
    >
      <span className={active ? "text-white" : "text-[#6B6660]"}>{icon}</span>
      <span
        className={`text-[12px] ${active ? "font-semibold text-white" : "text-[#6B6660]"}`}
      >
        {label}
      </span>
    </button>
  );
}

/* ============ TABLE LIST VIEW ============ */

/**
 * Vista alternativa al plano: las mismas mesas de la zona activa pero en
 * formato tabular. Comparte selección con el canvas — al hacer click en
 * una fila se prende la misma `selectedTableId` y el panel derecho pinta
 * la ficha. Volver a `Plano` mantiene la mesa seleccionada.
 *
 * Diseño: caja del mismo ancho que el canvas (920px) para que el switch
 * Plano ↔ Lista no haga "saltar" el layout. Si la lista crece, scrollea
 * dentro del contenedor.
 */
function TableListView({
  tables,
  reservations,
  zoneNameById,
  selectedTableId,
  onSelectTable,
}: {
  tables: SalonTable[];
  reservations: ReservationDTO[];
  zoneNameById: Map<string, string>;
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
}) {
  // Orden estable: por etiqueta de mesa. `localeCompare` con `numeric` para
  // que "02" venga antes de "10" y "B1" después de las numeradas.
  const sorted = [...tables].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }),
  );

  if (sorted.length === 0) {
    return (
      <div className="flex h-[900px] w-[920px] items-center justify-center rounded-lg border border-[#EDE6DC] bg-white">
        <span className="rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-4 py-2 text-[12px] text-[#6B6660]">
          Esta zona aún no tiene mesas.{" "}
          <Link href="/salon/edit" className="font-medium text-[#C2410C]">
            Configurar
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-[900px] w-[920px] flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-white">
      {/* Header de columnas — sticky para que se quede al hacer scroll. */}
      <div
        className="sticky top-0 z-10 grid items-center gap-3 border-b border-[#EDE6DC] bg-[#F7F3EE] px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]"
        style={{
          gridTemplateColumns: "64px 168px 96px 110px 1fr 1fr",
        }}
      >
        <span>MESA</span>
        <span>ESTADO</span>
        <span>CAPACIDAD</span>
        <span>COMENSALES</span>
        <span>CLIENTE</span>
        <span>NOTAS</span>
      </div>

      {/* Filas */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((t, i) => (
          <TableListRow
            key={t.id}
            table={t}
            reservation={nextReservationForTable(
              reservations,
              t,
              zoneNameById.get(t.zoneId),
            )}
            index={i}
            selected={t.id === selectedTableId}
            onSelect={() =>
              onSelectTable(t.id === selectedTableId ? null : t.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

function TableListRow({
  table,
  reservation,
  index,
  selected,
  onSelect,
}: {
  table: SalonTable;
  reservation: ReservationDTO | null;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = effectiveStatus(table, reservation);
  const color = COLOR[status];
  const customerName = table.customerName ?? reservation?.customerName ?? null;
  const notes = table.notes ?? reservation?.occasion ?? reservation?.notes ?? null;
  // Reusa la misma animación escalonada que las mesas del plano para que
  // al cambiar de vista no se sienta abrupto.
  const animStyle = { animationDelay: `${index * 30}ms` } as React.CSSProperties;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="animate-salon-table grid w-full items-center gap-3 border-b border-[#EDE6DC] px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#F7F3EE]"
      style={{
        gridTemplateColumns: "64px 168px 96px 110px 1fr 1fr",
        background: selected ? `${color}10` : undefined,
        // Borde izquierdo de color = indicador de selección, igual que el
        // anillo en el canvas pero adaptado a fila.
        boxShadow: selected ? `inset 3px 0 0 0 ${color}` : undefined,
        ...animStyle,
      }}
    >
      {/* MESA */}
      <span className="font-mono text-[15px] font-semibold leading-none text-[#1F1F1F]">
        {table.label}
      </span>

      {/* ESTADO */}
      <span
        className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px]"
        style={{ background: color }}
      >
        <span className="size-1.5 rounded-full bg-[#F7F3EE]" />
        <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#F7F3EE]">
          {STATUS_LABEL[status].toUpperCase()}
        </span>
      </span>

      {/* CAPACIDAD */}
      <span className="font-mono text-[12px] text-[#6B6660]">
        {table.seats} {table.seats === 1 ? "asiento" : "asientos"}
      </span>

      {/* COMENSALES — resalta si supera la capacidad. */}
      <span
        className={`font-mono text-[13px] font-medium ${
          table.partySize !== null && table.partySize > table.seats
            ? "text-[#C95A3D]"
            : "text-[#1F1F1F]"
        }`}
      >
        {table.partySize !== null ? table.partySize : "—"}
      </span>

      {/* CLIENTE */}
      <span
        className={`truncate text-[12.5px] ${
          customerName ? "text-[#1F1F1F]" : "text-[#a89d8e]"
        }`}
        title={customerName ?? undefined}
      >
        {customerName ?? "—"}
      </span>

      {/* NOTAS */}
      <span
        className={`truncate text-[12px] ${
          notes ? "text-[#6B4F3A]" : "text-[#a89d8e]"
        }`}
        title={notes ?? undefined}
      >
        {notes ?? "—"}
      </span>
    </button>
  );
}

export function FloorPlanCanvas({
  tables,
  shapes,
  reservations,
  zoneNameById,
  selectedTableId,
  onSelectTable,
}: {
  tables: SalonTable[];
  shapes: Shape[];
  reservations: ReservationDTO[];
  zoneNameById: Map<string, string>;
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
}) {
  return (
    <div
      className="relative h-[900px] w-[920px] overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#F7F3EE]"
      // Click sobre área vacía del canvas → deseleccionar.
      onClick={() => onSelectTable(null)}
    >
      {/* Grid */}
      {[120, 240, 360, 480, 600, 720, 840].map((x) => (
        <div
          key={`v${x}`}
          className="absolute top-0 h-[920px] w-px bg-[#EDE6DC] opacity-50"
          style={{ left: x }}
        />
      ))}
      {[120, 240, 360, 480, 600, 720, 840].map((y) => (
        <div
          key={`h${y}`}
          className="absolute left-0 h-px w-[920px] bg-[#EDE6DC] opacity-50"
          style={{ top: y }}
        />
      ))}

      {/* Walls */}
      <div className="absolute left-0 top-0 h-[3px] w-[920px] bg-[#6B4F3A]" />
      <div className="absolute bottom-[3px] left-0 h-[3px] w-[920px] bg-[#6B4F3A]" />
      <div className="absolute left-0 top-0 h-[900px] w-[3px] bg-[#6B4F3A]" />
      <div className="absolute right-0 top-0 h-[900px] w-[3px] bg-[#6B4F3A]" />

      {/* Window strips */}
      <div className="absolute top-0 h-[3px] w-[200px] bg-[#7C8A6A]" style={{ left: 60 }} />
      <div className="absolute top-0 h-[3px] w-[200px] bg-[#7C8A6A]" style={{ left: 320 }} />
      <div className="absolute top-0 h-[3px] w-[200px] bg-[#7C8A6A]" style={{ left: 580 }} />
      <span
        className="absolute font-mono text-[9px] tracking-[0.16em] text-[#7C8A6A]"
        style={{ left: 60, top: 14 }}
      >
        VENTANAL · TERRAZA
      </span>

      {/* Zone labels */}
      <span
        className="absolute font-mono text-[9px] tracking-[0.18em] text-[#a89d8e] opacity-70"
        style={{ left: 24, top: 42 }}
      >
        ZONA VENTANAL
      </span>
      <span
        className="absolute font-mono text-[9px] tracking-[0.18em] text-[#a89d8e] opacity-70"
        style={{ left: 430, top: 42 }}
      >
        ZONA INTERIOR
      </span>

      {/* Decorative shapes (from backend) */}
      {shapes.map((s) => (
        <LiveShape key={s.id} shape={s} />
      ))}

      {/* Tables (from backend).
          El delay base 460ms coincide con el final del fade-scale del main
          (180ms delay + 560ms duration = ~740ms), pero entran un poco antes
          para encadenar el efecto. 40ms entre mesas para el stagger fino. */}
      {tables.map((t, i) => {
        const delay = 460 + i * 40;
        const selected = t.id === selectedTableId;
        const decor = TABLE_DECOR[t.label] ?? {};
        const reservation = nextReservationForTable(
          reservations,
          t,
          zoneNameById.get(t.zoneId),
        );
        const handleClick = (e: React.MouseEvent) => {
          // Stop-propagation: evita que el click suba al canvas y nos
          // deseleccione inmediatamente.
          e.stopPropagation();
          onSelectTable(selected ? null : t.id);
        };
        return t.shape === "round" ? (
          <TableRound
            key={t.id}
            table={t}
            decor={decor}
            reservation={reservation}
            delay={delay}
            selected={selected}
            onClick={handleClick}
          />
        ) : (
          <TableRect
            key={t.id}
            table={t}
            decor={decor}
            reservation={reservation}
            delay={delay}
            selected={selected}
            onClick={handleClick}
          />
        );
      })}

      {/* Empty-zone hint */}
      {tables.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-lg border border-[#EDE6DC] bg-white/80 px-4 py-2 text-[12px] text-[#6B6660]">
            Esta zona aún no tiene mesas.{" "}
            <Link href="/salon/edit" className="font-medium text-[#C2410C]">
              Configurar
            </Link>
          </span>
        </div>
      )}

      {/* Edit Hint */}
      <Link
        href="/salon/edit"
        className="absolute flex h-9 items-center gap-2.5 rounded-full border border-[#EDE6DC] bg-white pl-3.5 pr-[18px] shadow-[0_2px_8px_rgba(31,31,31,0.07)] hover:bg-[#F7F3EE]"
        style={{ left: 170, top: 772, width: 280 }}
      >
        <Move className="size-[13px] text-[#E67E22]" strokeWidth={2} />
        <span className="text-[11px]">Activa modo edición para mover mesas</span>
        <span className="ml-auto rounded bg-[#f7f3ee] px-1.5 py-0.5 font-mono text-[9px] font-semibold">
          E
        </span>
      </Link>

      {/* Zoom Controls */}
      <div
        className="absolute flex flex-col items-center rounded-lg border border-[#EDE6DC] bg-white shadow-[0_4px_12px_rgba(31,31,31,0.09)]"
        style={{ left: 854, top: 736, width: 36, height: 130 }}
      >
        <button className="flex flex-1 items-center justify-center text-[#1F1F1F]">
          <Plus className="size-3.5" strokeWidth={2} />
        </button>
        <div className="h-px w-6 bg-[#EDE6DC]" />
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-[10px] font-semibold">100</span>
        </div>
        <div className="h-px w-6 bg-[#EDE6DC]" />
        <button className="flex flex-1 items-center justify-center text-[#1F1F1F]">
          <Minus className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <>
      <div
        className="absolute rounded-full bg-[#7C8A6A] opacity-70"
        style={{ left: x, top: y, width: 36, height: 36 }}
      />
      <div
        className="absolute rounded-full bg-[#7c8a6a]"
        style={{ left: x + 10, top: y + 10, width: 16, height: 16 }}
      />
    </>
  );
}

/**
 * Distribuye los asientos arriba/abajo para una mesa rectangular.
 * El editor permite que el usuario fije `seats`; este helper sólo decide
 * cómo dibujarlos.
 */
function chairsForRect(seats: number): [number, number] {
  if (seats <= 2) return [1, 1];
  if (seats === 3) return [2, 1];
  if (seats % 2 === 0) return [seats / 2, seats / 2];
  return [Math.ceil(seats / 2), Math.floor(seats / 2)];
}

/**
 * Render server-side de las formas decorativas. Cada `kind` tiene un
 * tratamiento visual distinto — la lógica espeja `ShapeNode` del editor
 * pero sin interactividad.
 */
function LiveShape({ shape }: { shape: Shape }) {
  const base = {
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
  };
  switch (shape.kind) {
    case "wall":
      return <div className="absolute bg-[#6B4F3A]" style={base} />;
    case "window":
      return (
        <>
          <div className="absolute bg-[#7C8A6A]" style={base} />
          {shape.label && (
            <span
              className="absolute font-mono text-[9px] tracking-[0.16em] text-[#7C8A6A]"
              style={{ left: shape.x, top: shape.y + 14 }}
            >
              {shape.label}
            </span>
          )}
        </>
      );
    case "door":
      return (
        <div className="absolute flex flex-col gap-1.5" style={base}>
          <div className="flex items-center gap-2">
            <DoorOpen className="size-3.5 text-[#6B4F3A]" strokeWidth={2} />
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#6B4F3A]">
              {(shape.label ?? "ENTRADA").toUpperCase()}
            </span>
          </div>
          <div className="h-0.5 w-full bg-[#6B4F3A]" />
        </div>
      );
    case "plant": {
      const size = Math.min(shape.width, shape.height);
      return (
        <>
          <div
            className="absolute rounded-full bg-[#7C8A6A] opacity-70"
            style={{ left: shape.x, top: shape.y, width: size, height: size }}
          />
          <div
            className="absolute rounded-full bg-[#7c8a6a]"
            style={{
              left: shape.x + size * 0.28,
              top: shape.y + size * 0.28,
              width: size * 0.44,
              height: size * 0.44,
            }}
          />
        </>
      );
    }
    case "column":
      return <div className="absolute bg-[#6B4F3A]" style={base} />;
    case "restroom":
      return (
        <div
          className="absolute flex flex-col items-center justify-center gap-1 rounded bg-[#D8CEC2] p-2.5"
          style={base}
        >
          <SquareUser className="size-[18px] text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B4F3A]">
            {(shape.label ?? "BAÑOS").toUpperCase()}
          </span>
        </div>
      );
    case "bar":
      return (
        <div
          className="absolute flex flex-col justify-center gap-1.5 rounded-md bg-[#1F1F1F] px-[18px] py-3.5"
          style={base}
        >
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#E67E22]">
            {(shape.label ?? "BARRA").toUpperCase()}
          </span>
        </div>
      );
    case "kitchen_pass":
      return (
        <div
          className="absolute flex flex-col gap-1.5 rounded-md bg-[#1F1F1F] px-[18px] py-3.5"
          style={base}
        >
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#E67E22]">
            {(shape.label ?? "PASE DE COCINA").toUpperCase()}
          </span>
          <div className="h-px w-full bg-[#3a322c]" />
          <span className="text-[11px] text-[#D8CEC2]">
            Servicio activo · Chef Vidal
          </span>
        </div>
      );
    case "divider":
      return <div className="absolute bg-[#D8CEC2] opacity-70" style={base} />;
    case "text":
      return (
        <span
          className="absolute whitespace-nowrap font-mono font-semibold tracking-[0.16em] text-[#6B4F3A]"
          style={{
            left: shape.x,
            top: shape.y,
            fontSize: shape.height,
            lineHeight: 1,
          }}
        >
          {shape.label ?? ""}
        </span>
      );
    default:
      return null;
  }
}

type TableDecor = { timer?: string; star?: boolean };

const ACTIVE_RESERVATION_STATUSES = new Set(["pending", "confirmed", "seated"]);

function isActiveReservation(r: ReservationDTO): boolean {
  return ACTIVE_RESERVATION_STATUSES.has(r.status);
}

function minutesOf(timeSlot: string): number {
  const [h, m] = timeSlot.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function reservationsForTable(
  reservations: ReservationDTO[],
  table: SalonTable,
  zoneName?: string | null,
): ReservationDTO[] {
  return allReservationsForTable(reservations, table, zoneName).filter(isActiveReservation);
}

function allReservationsForTable(
  reservations: ReservationDTO[],
  table: SalonTable,
  zoneName?: string | null,
): ReservationDTO[] {
  return reservations
    .filter((r) => {
      if (r.tableId) return r.tableId === table.id;
      return Boolean(
        zoneName &&
          r.zoneName === zoneName &&
          r.tableLabel === table.label,
      );
    })
    .sort((a, b) => minutesOf(a.timeSlot) - minutesOf(b.timeSlot));
}

function nextReservationForTable(
  reservations: ReservationDTO[],
  table: SalonTable,
  zoneName?: string | null,
): ReservationDTO | null {
  return reservationsForTable(reservations, table, zoneName)[0] ?? null;
}

function effectiveStatus(
  table: SalonTable,
  reservation: ReservationDTO | null,
): TableStatus {
  if (reservation && table.status === "libre") return "reservada";
  return table.status;
}

/**
 * Devuelve el texto secundario que aparece bajo el número de la mesa.
 * Mismo helper para round y rect para que la lógica sea consistente.
 */
function subLabelFor(
  table: SalonTable,
  decor: TableDecor,
  reservation: ReservationDTO | null,
): string | null {
  const status = effectiveStatus(table, reservation);
  switch (status) {
    case "libre":
      return `${table.seats}p · LIBRE`;
    case "limpieza":
      return "LIMPIEZA";
    case "ocupada":
    case "cocina":
    case "esperando":
      return decor.timer ?? SUBLABEL_FALLBACK[status];
    case "reservada":
      return reservation?.timeSlot ?? null;
    default:
      return null;
  }
}

function TableRound({
  table,
  decor,
  reservation,
  delay = 0,
  selected,
  onClick,
}: {
  table: SalonTable;
  decor: TableDecor;
  reservation: ReservationDTO | null;
  delay?: number;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const size = Math.min(table.width, table.height);
  const status = effectiveStatus(table, reservation);
  const color = COLOR[status];
  const chairColor = status === "limpieza" ? "#EDE6DC" : "#D8CEC2";
  const positions = chairLayoutRound(size, table.seats);
  const animStyle = { animationDelay: `${delay}ms` } as React.CSSProperties;
  const sub = subLabelFor(table, decor, reservation);
  return (
    <>
      {positions.map((p, i) => (
        <div
          key={i}
          className="animate-salon-table pointer-events-none absolute rounded-full"
          style={{
            ...animStyle,
            left: table.x + p.cx - 8,
            top: table.y + p.cy - 8,
            width: 16,
            height: 16,
            background: chairColor,
          }}
        />
      ))}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Mesa ${table.label}`}
        aria-pressed={selected ?? false}
        className="animate-salon-table absolute flex flex-col items-center justify-center bg-white transition-shadow hover:shadow-[0_4px_12px_rgba(31,31,31,0.12)] focus:outline-none"
        style={{
          ...animStyle,
          left: table.x,
          top: table.y,
          width: size,
          height: size,
          borderRadius: "9999px",
          border: `${selected ? 2.5 : 2}px solid ${color}`,
          boxShadow: selected
            ? `0 0 0 3px ${color}33, 0 4px 14px ${color}33`
            : "0 2px 8px rgba(31,31,31,0.07)",
          cursor: "pointer",
        }}
      >
        <span
          className="font-mono font-semibold leading-none text-[#1F1F1F]"
          style={{ fontSize: size >= 90 ? 20 : 18 }}
        >
          {table.label}
        </span>
        {sub && (
          <span
            className="mt-0.5 font-mono leading-none tracking-[0.04em]"
            style={{
              fontSize: 9,
              color,
            }}
          >
            {sub}
          </span>
        )}
        {decor.star && (
          <Sparkles
            className="absolute -right-1 -top-1 size-3.5"
            strokeWidth={2}
            style={{ color: "#E67E22" }}
          />
        )}
      </button>
    </>
  );
}

function chairLayoutRound(size: number, chairs: number) {
  // Returns positions relative to top-left of table bbox.
  // 4 chairs: top, right, bottom, left
  // 6 chairs: top-left, top-right, right, bottom-right, bottom-left, left
  if (chairs === 4) {
    return [
      { cx: size / 2, cy: -6 },
      { cx: size + 6, cy: size / 2 },
      { cx: size / 2, cy: size + 6 },
      { cx: -6, cy: size / 2 },
    ];
  }
  // 6 chairs around a round table
  return [
    { cx: size * 0.27, cy: -6 },
    { cx: size * 0.77, cy: -6 },
    { cx: size + 6, cy: size / 2 },
    { cx: size * 0.77, cy: size + 6 },
    { cx: size * 0.27, cy: size + 6 },
    { cx: -6, cy: size / 2 },
  ];
}

function TableRect({
  table,
  decor,
  reservation,
  delay = 0,
  selected,
  onClick,
}: {
  table: SalonTable;
  decor: TableDecor;
  reservation: ReservationDTO | null;
  delay?: number;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const { x, y, width: w, height: h } = table;
  const status = effectiveStatus(table, reservation);
  const color = COLOR[status];
  const chairColor = status === "limpieza" ? "#EDE6DC" : "#D8CEC2";
  const [top, bottom] = chairsForRect(table.seats);
  const chairs = (count: number, atTop: boolean) => {
    const arr: { cx: number; cy: number }[] = [];
    for (let i = 0; i < count; i++) {
      const cx = ((i + 1) * w) / (count + 1);
      const cy = atTop ? -10 : h + 10;
      arr.push({ cx, cy });
    }
    return arr;
  };
  const animStyle = { animationDelay: `${delay}ms` } as React.CSSProperties;
  const sub = subLabelFor(table, decor, reservation);
  const reservationLine = reservation
    ? [reservation.timeSlot, reservation.customerName].filter(Boolean).join(" · ")
    : null;

  // Layout:
  //   - Rects "anchos" (w >= 140) muestran número + columna info horizontal.
  //     Línea 1: "Xp · STATUS" siempre. Línea 2: timer / hora · cliente.
  //   - Rects "pequeños" (w < 140) muestran número con sub-label debajo,
  //     centrado. Aplica a 03, 09, 10 y los puestos de barra.
  const wide = w >= 140;

  return (
    <>
      {[...chairs(top, true), ...chairs(bottom, false)].map((p, i) => (
        <div
          key={i}
          className="animate-salon-table pointer-events-none absolute"
          style={{
            ...animStyle,
            left: x + p.cx - 7,
            top: y + p.cy - 7,
            width: 14,
            height: 14,
            background: chairColor,
            borderRadius: 3,
          }}
        />
      ))}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Mesa ${table.label}`}
        aria-pressed={selected ?? false}
        className="animate-salon-table absolute flex items-center bg-white transition-shadow hover:shadow-[0_4px_12px_rgba(31,31,31,0.12)] focus:outline-none"
        style={{
          ...animStyle,
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 8,
          border: `${selected ? 2.5 : 2}px solid ${color}`,
          boxShadow: selected
            ? `0 0 0 3px ${color}33, 0 4px 14px ${color}33`
            : "0 2px 8px rgba(31,31,31,0.07)",
          cursor: "pointer",
          padding: wide ? "0 14px" : "0 8px",
          gap: wide ? 14 : 6,
          justifyContent: wide ? "flex-start" : "center",
        }}
      >
        {wide ? (
          <>
            <span className="font-mono text-[18px] font-semibold leading-none text-[#1F1F1F]">
              {table.label}
            </span>
            <span
              className="h-7 w-px"
              style={{ background: `${color}33` }}
            />
            <div className="flex flex-col items-start gap-1 leading-none">
              <span
                className="font-mono text-[10px] font-semibold tracking-[0.06em]"
                style={{ color }}
              >
                {table.seats}p · {STATUS_LABEL[status].toUpperCase()}
              </span>
              <span
                className="font-mono text-[11px] leading-none text-[#1F1F1F]"
              >
                {status === "reservada" ? reservationLine ?? sub ?? "—" : sub ?? "—"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-0.5 leading-none">
            <span className="font-mono text-[15px] font-semibold leading-none text-[#1F1F1F]">
              {table.label}
            </span>
            {sub && (
              <span
                className="font-mono text-[9px] leading-none tracking-[0.04em]"
                style={{ color }}
              >
                {sub}
              </span>
            )}
          </div>
        )}
        {decor.star && (
          <Sparkles
            className="absolute -right-1.5 -top-1.5 size-4 rounded-full bg-white p-0.5"
            strokeWidth={2}
            style={{ color: "#E67E22" }}
          />
        )}
      </button>
    </>
  );
}

/* ============ RIGHT DETAIL PANEL ============ */

/**
 * El pedido y el estado del pedido siguen siendo mock — pertenecen al
 * módulo POS/órdenes que todavía no existe. Se queda visible para que el
 * panel mantenga su balance visual hasta que se conecte el backend real.
 */
const RESERVATION_STATUS_LABEL: Record<ReservationDTO["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  seated: "Sentada",
  cancelled: "Cancelada",
  completed: "Completada",
};

function formatReservationDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-GT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function RightDetailPanel({
  table,
  reservations,
  zoneName,
  serviceDate,
  bill,
  onClose,
}: {
  table: SalonTable | null;
  reservations: ReservationDTO[];
  zoneName: string | null;
  serviceDate: string;
  bill: Bill | null;
  onClose: () => void;
}) {
  if (!table) {
    return (
      <aside className="animate-salon-detail flex w-[344px] flex-col items-center justify-center gap-3 border-l border-[#EDE6DC] bg-[#F7F3EE] px-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(31,31,31,0.06)]">
          <MousePointerClick
            className="size-5 text-[#6B4F3A]"
            strokeWidth={1.8}
          />
        </span>
        <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#6B4F3A]">
          NINGUNA MESA SELECCIONADA
        </span>
        <p className="max-w-[240px] text-[12px] leading-[1.55] text-[#6B6660]">
          Toca una mesa en el plano para ver su ficha rápida y cambiar su estado.
        </p>
      </aside>
    );
  }
  // `key={table.id}` reinicia el estado interno (form fields) cuando cambia
  // la mesa seleccionada. Sin esto los inputs guardarían el texto de la mesa
  // anterior.
  return (
    <TableDetail
      key={table.id}
      table={table}
      zoneName={zoneName}
      serviceDate={serviceDate}
      initialReservations={reservationsForTable(reservations, table, zoneName)}
      bill={bill}
      onClose={onClose}
    />
  );
}

function TableDetail({
  table,
  zoneName,
  serviceDate,
  initialReservations,
  bill,
  onClose,
}: {
  table: SalonTable;
  zoneName: string | null;
  serviceDate: string;
  initialReservations: ReservationDTO[];
  bill: Bill | null;
  onClose: () => void;
}) {
  // Pedido real de la mesa (órdenes de cocina).
  const orderLines = bill?.lines ?? [];
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState<TableStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<TableStatus>(() => table.status);

  // Modal "Abrir pedido". Abrirlo no cambia ningún estado por sí solo —
  // el estado solo cambia cuando el modal dispara "Enviar a cocina".
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);

  const nextReservation = initialReservations[0] ?? null;
  const displayStatus =
    nextReservation && status === "libre" ? "reservada" : status;
  const statusColor = COLOR[displayStatus];

  // El "Pedido actual" solo se muestra cuando la mesa está EN SERVICIO
  // (ocupada / en cocina / esperando cuenta) y ya tiene pedido. Una mesa libre,
  // reservada o en limpieza no muestra pedido aunque queden órdenes viejas.
  const inService =
    status === "ocupada" || status === "cocina" || status === "esperando";
  const hasOrder = inService && orderLines.length > 0;

  const setStatusTo = async (next: TableStatus) => {
    if (next === status || saving) return;
    setError(null);
    setSaving(next);
    setStatus(next); // optimista
    try {
      await updateTable(table.id, { status: next });
      startTransition(() => router.refresh());
    } catch (e) {
      console.error("[salon] updateTable failed", e);
      setStatus(table.status); // revertir
      setError("No se pudo guardar el cambio");
    } finally {
      setSaving(null);
    }
  };

  /** Handler que pasamos al modal — al enviar a cocina, cambia el estado y
   *  cierra. Si falla la API, dejamos el modal abierto para que el usuario
   *  vea el error y pueda reintentar. */
  const handleSendToKitchen = async () => {
    if (saving) return;
    setError(null);
    setSaving("cocina");
    try {
      await updateTable(table.id, { status: "cocina" });
      setStatus("cocina");
      setOrderModalOpen(false);
      startTransition(() => router.refresh());
    } catch (e) {
      console.error("[salon] send-to-kitchen failed", e);
      setError("No se pudo enviar a cocina");
    } finally {
      setSaving(null);
    }
  };

  return (
    <aside className="animate-salon-detail stagger-children flex w-[344px] flex-col overflow-y-auto border-l border-[#EDE6DC] bg-[#F7F3EE]">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
              MESA
            </span>
            <span className="font-mono text-[42px] font-medium leading-none text-[#1F1F1F]">
              {table.label}
            </span>
            <div
              className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px]"
              style={{ background: statusColor }}
            >
              <span className="size-1.5 rounded-full bg-[#F7F3EE]" />
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#F7F3EE]">
                {STATUS_LABEL[displayStatus].toUpperCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha"
            className="flex size-8 items-center justify-center rounded-lg border border-[#EDE6DC] hover:bg-white"
          >
            <MoreVertical className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Stats Row: Capacidad real · Proxima reserva · Mesero (mock) */}
      <div className="flex gap-3 border-b border-[#EDE6DC] px-6 py-4">
        <Stat
          label="CAPACIDAD"
          value={`${table.seats} ${table.seats === 1 ? "persona" : "personas"}`}
        />
        <Stat label="RESERVA" value={nextReservation?.timeSlot ?? "—"} mono />
        <Stat label="MESERO">
          <div className="flex items-center gap-1.5">
            <span className="block size-[18px] rounded-full bg-[#7C8A6A]" />
            <span className="text-[12px] font-medium">Andrés López</span>
          </div>
        </Stat>
      </div>

      {/* Reservas reales de la mesa, alimentadas por backend. */}
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
            RESERVAS DE MESA
          </span>
          <button
            type="button"
            onClick={() => setReservationModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#EDE6DC] bg-white px-2.5 py-1.5 text-[11px] hover:bg-[#F7F3EE]"
          >
            <Calendar className="size-3 text-[#E67E22]" strokeWidth={1.8} />
            Ver
          </button>
        </div>
        {nextReservation ? (
          <button
            type="button"
            onClick={() => setReservationModalOpen(true)}
            className="flex items-start gap-3 rounded-lg border border-[#D8A64166] bg-[#D8A64112] px-3.5 py-3 text-left hover:bg-[#D8A6411f]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white">
              <Clock className="size-4 text-[#D8A641]" strokeWidth={1.8} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[13px] font-semibold text-[#1F1F1F]">
                {nextReservation.timeSlot} · {nextReservation.customerName}
              </span>
              <span className="text-[11.5px] leading-[1.35] text-[#6B6660]">
                {nextReservation.partySize} personas ·{" "}
                {RESERVATION_STATUS_LABEL[nextReservation.status]}
              </span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setReservationModalOpen(true)}
            className="flex items-start gap-3 rounded-lg border border-[#EDE6DC] bg-white px-3.5 py-3 text-left hover:bg-[#F7F3EE]"
          >
            <Info className="mt-0.5 size-4 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[12px] leading-[1.45] text-[#6B6660]">
              Sin reservas activas para esta mesa en {formatReservationDate(serviceDate)}.
            </span>
          </button>
        )}
      </div>

      {/* Pedido actual + estado — REAL (órdenes de cocina). Solo se muestra si
          la mesa ya tiene pedido; una mesa libre o sin orden no muestra nada. */}
      {hasOrder && (
        <>
          <div className="flex flex-col gap-3.5 border-b border-[#EDE6DC] px-6 py-5">
            <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
              PEDIDO ACTUAL
            </span>
            <div className="flex flex-col gap-2.5">
              {orderLines.map((l, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-[#6B4F3A]">
                    x{l.qty}
                  </span>
                  <span className="flex-1 text-[13px]">{l.name}</span>
                  <span className="font-mono text-[12px] text-[#6B4F3A]">
                    {l.unitPrice > 0 ? formatQ(l.lineTotal) : "—"}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-[#EDE6DC]" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em]">
                TOTAL
              </span>
              <span className="font-mono text-[18px] font-semibold">
                {formatQ(bill?.total ?? 0)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 border-b border-[#EDE6DC] px-6 py-5">
            <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
              ESTADO DEL PEDIDO
            </span>
            <OrderStepper status={displayStatus} />
          </div>
        </>
      )}

      {/* Notas — real desde DB. Oculto si la mesa no tiene notas. */}
      {table.notes && (
        <div className="flex flex-col gap-2.5 border-b border-[#EDE6DC] px-6 py-5">
          <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
            NOTAS
          </span>
          <div className="flex gap-2.5 rounded-lg bg-[#D8CEC2] px-3.5 py-3">
            <TriangleAlert
              className="size-3.5 shrink-0 text-[#7C8A6A]"
              strokeWidth={1.8}
            />
            <span className="text-[12px] leading-[1.4]">{table.notes}</span>
          </div>
        </div>
      )}

      {/* Acciones rápidas — 6 botones que disparan cambios de estado reales */}
      <div className="flex flex-col gap-3 px-6 py-5 pb-6">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          ACCIONES RÁPIDAS
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Abrir pedido: abre el modal de comanda (datos mock). Solo el
                botón "Enviar a cocina" dentro del modal cambia el estado a
                "cocina". Cancelar / cerrar no toca nada. */}
            <ActionBtn
              icon={<SquarePen className="size-3.5" strokeWidth={1.8} />}
              label="Abrir pedido"
              primary
              onClick={() => setOrderModalOpen(true)}
            />
            <ActionBtn
              icon={<Calendar className="size-3.5" strokeWidth={1.8} />}
              label="Reservar"
              onClick={() => setReservationModalOpen(true)}
            />
          </div>
          <div className="flex gap-2">
            <ActionBtn
              icon={<Users className="size-3.5" strokeWidth={1.8} />}
              label="Marcar ocupada"
              busy={saving === "ocupada"}
              onClick={() => void setStatusTo("ocupada")}
            />
            <ActionBtn
              icon={<Receipt className="size-3.5" strokeWidth={1.8} />}
              label="Solicitar cuenta"
              busy={saving === "esperando"}
              onClick={() => void setStatusTo("esperando")}
            />
          </div>
          <div className="flex gap-2">
            <ActionBtn
              icon={<Sparkles className="size-3.5" strokeWidth={1.8} />}
              label="Marcar limpieza"
              busy={saving === "limpieza"}
              onClick={() => void setStatusTo("limpieza")}
            />
            <ActionBtn
              icon={<LogOut className="size-3.5" strokeWidth={1.8} />}
              label="Liberar mesa"
              danger
              busy={saving === "libre"}
              onClick={() => void setStatusTo("libre")}
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

      {orderModalOpen && (
        <OrderModal
          table={table}
          sending={saving === "cocina"}
          onClose={() => {
            if (saving === "cocina") return;
            setOrderModalOpen(false);
          }}
          onSendToKitchen={handleSendToKitchen}
        />
      )}
      {reservationModalOpen && (
        <TableReservationsModal
          key={`${table.id}:${serviceDate}`}
          table={table}
          zoneName={zoneName}
          serviceDate={serviceDate}
          initialReservations={initialReservations}
          onClose={() => setReservationModalOpen(false)}
        />
      )}
    </aside>
  );
}

function TableReservationsModal({
  table,
  zoneName,
  serviceDate,
  initialReservations,
  onClose,
}: {
  table: SalonTable;
  zoneName: string | null;
  serviceDate: string;
  initialReservations: ReservationDTO[];
  onClose: () => void;
}) {
  const [rows, setRows] = useState<ReservationDTO[]>(initialReservations);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    listReservationsByTable({
      tableId: table.id,
      date: serviceDate,
      zoneName: zoneName ?? undefined,
      tableLabel: table.label,
    })
      .then((next) => {
        if (mounted) setRows(next);
      })
      .catch((e) => {
        console.error("[salon] listReservationsByTable failed", e);
        if (mounted) setLoadError("No se pudieron actualizar las reservaciones");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [serviceDate, table.id, table.label, zoneName]);

  const visibleRows = allReservationsForTable(rows, table, zoneName);
  const activeRows = visibleRows.filter(isActiveReservation);
  const inactiveRows = visibleRows.filter((r) => !isActiveReservation(r));
  const current = activeRows[0] ?? null;
  const next = activeRows[1] ?? null;
  const upcoming = activeRows.slice(2);
  const createHref = `/reservas/nueva?tableId=${encodeURIComponent(table.id)}&date=${encodeURIComponent(serviceDate)}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1F1F1F]/45 px-6 py-8"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="flex max-h-[88vh] w-[760px] flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] shadow-[0_24px_70px_rgba(31,31,31,0.24)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-reservations-title"
      >
        <header className="flex items-start justify-between border-b border-[#EDE6DC] bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E67E2214]">
              <Calendar className="size-5 text-[#E67E22]" strokeWidth={1.8} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
                {formatReservationDate(serviceDate).toUpperCase()}
              </span>
              <h2
                id="table-reservations-title"
                className="text-[22px] font-semibold leading-tight text-[#1F1F1F]"
              >
                Reservaciones de mesa
              </h2>
              <span className="text-[12px] text-[#6B6660]">
                {zoneName ?? "Salón"} · Mesa {table.label} · {table.seats}{" "}
                {table.seats === 1 ? "persona" : "personas"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reservaciones"
            className="flex size-8 items-center justify-center rounded-lg border border-[#EDE6DC] hover:bg-[#F7F3EE]"
          >
            <X className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#C95A3D33] bg-[#C95A3D0A] px-3 py-2 text-[12px] text-[#C95A3D]">
              <TriangleAlert className="mt-px size-3.5 shrink-0" strokeWidth={1.8} />
              <span>{loadError}</span>
            </div>
          )}

          <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
            <ReservationPanel
              title="Ahora"
              reservation={current}
              emptyText={loading ? "Actualizando..." : "Sin reserva activa"}
              featured
            />
            <ReservationPanel
              title="Siguiente"
              reservation={next}
              emptyText={loading ? "Actualizando..." : "Sin siguiente reserva"}
            />
          </div>

          <section className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
                PROXIMAS
              </span>
              <span className="font-mono text-[11px] text-[#6B6660]">
                {visibleRows.length} total
              </span>
            </div>
            <div className="flex flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-white">
              {upcoming.length > 0 ? (
                upcoming.map((reservation) => (
                  <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              ) : (
                <EmptyReservationRow
                  text={loading ? "Actualizando reservaciones..." : "No hay más reservas activas"}
                />
              )}
            </div>
          </section>

          {inactiveRows.length > 0 && (
            <section className="mt-5 flex flex-col gap-3">
              <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
                HISTORIAL
              </span>
              <div className="flex flex-col overflow-hidden rounded-lg border border-[#EDE6DC] bg-white opacity-80">
                {inactiveRows.map((reservation) => (
                  <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#EDE6DC] bg-white px-6 py-4">
          <span className="flex min-w-0 items-center gap-2 text-[12px] text-[#6B6660]">
            <Info className="size-3.5 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="truncate">
              Datos sincronizados desde backend por mesa y fecha.
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#EDE6DC] bg-white px-4 py-2 text-[12px] hover:bg-[#F7F3EE]"
            >
              Cerrar
            </button>
            <Link
              href={createHref}
              className="flex items-center gap-2 rounded-lg bg-[#E67E22] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#c2410c]"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Nueva reservación
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ReservationPanel({
  title,
  reservation,
  emptyText,
  featured,
}: {
  title: string;
  reservation: ReservationDTO | null;
  emptyText: string;
  featured?: boolean;
}) {
  return (
    <section className="flex min-h-[152px] flex-col gap-3 rounded-lg border border-[#EDE6DC] bg-white p-4">
      <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
        {title.toUpperCase()}
      </span>
      {reservation ? (
        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`flex shrink-0 items-center justify-center rounded-lg ${
                featured ? "size-12 bg-[#D8A6411f]" : "size-10 bg-[#F7F3EE]"
              }`}
            >
              <Clock
                className={featured ? "size-5 text-[#D8A641]" : "size-4 text-[#6B4F3A]"}
                strokeWidth={1.8}
              />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-[20px] font-semibold leading-none text-[#1F1F1F]">
                {reservation.timeSlot}
              </span>
              <span className="truncate text-[14px] font-semibold text-[#1F1F1F]">
                {reservation.customerName}
              </span>
              <span className="text-[12px] text-[#6B6660]">
                {reservation.partySize} personas ·{" "}
                {RESERVATION_STATUS_LABEL[reservation.status]}
              </span>
            </div>
          </div>
          {(reservation.occasion || reservation.notes) && (
            <span className="line-clamp-2 text-[12px] leading-[1.4] text-[#6B4F3A]">
              {reservation.occasion ?? reservation.notes}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center rounded-lg bg-[#F7F3EE] px-3 py-3 text-[12px] text-[#6B6660]">
          {emptyText}
        </div>
      )}
    </section>
  );
}

function ReservationRow({ reservation }: { reservation: ReservationDTO }) {
  return (
    <div className="grid grid-cols-[88px_1fr_108px] items-center gap-3 border-b border-[#EDE6DC] px-4 py-3 last:border-b-0">
      <span className="font-mono text-[14px] font-semibold text-[#1F1F1F]">
        {reservation.timeSlot}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-[#1F1F1F]">
          {reservation.customerName}
        </span>
        <span className="truncate text-[11.5px] text-[#6B6660]">
          {reservation.partySize} personas
          {reservation.occasion ? ` · ${reservation.occasion}` : ""}
        </span>
      </span>
      <span className="justify-self-end rounded-full bg-[#F7F3EE] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#6B4F3A]">
        {RESERVATION_STATUS_LABEL[reservation.status]}
      </span>
    </div>
  );
}

function EmptyReservationRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-4 text-[12px] text-[#6B6660]">
      <Info className="size-3.5 shrink-0 text-[#6B4F3A]" strokeWidth={1.8} />
      <span>{text}</span>
    </div>
  );
}

/**
 * Stepper del estado del pedido. Por ahora es decorativo, mapeando el
 * status de la mesa a la etapa visible:
 *   libre/reservada → "Pedido" (etapa 1, ninguna activa todavía)
 *   ocupada         → "Pedido" activo
 *   cocina          → "En cocina" activo
 *   esperando       → "Servido" activo
 *   limpieza        → "Pagado" activo
 */
function OrderStepper({ status }: { status: TableStatus }) {
  const steps = ["Pedido", "En cocina", "Servido", "Pagado"] as const;
  const activeIdx = (() => {
    if (status === "ocupada") return 0;
    if (status === "cocina") return 1;
    if (status === "esperando") return 2;
    if (status === "limpieza") return 3;
    return -1;
  })();

  return (
    <>
      <div className="flex items-center">
        {steps.map((_, i) => {
          const past = i < activeIdx;
          const active = i === activeIdx;
          return (
            <span key={i} className="flex flex-1 items-center last:flex-none">
              <span
                className={`block rounded-full ${
                  active ? "size-3.5 ring-[3px] ring-[#E67E2233]" : "size-2.5"
                }`}
                style={{
                  background: active
                    ? "#E67E22"
                    : past
                      ? "#1F1F1F"
                      : "#D8CEC2",
                }}
              />
              {i < steps.length - 1 && (
                <span
                  className="h-px flex-1"
                  style={{ background: past ? "#1F1F1F" : "#D8CEC2" }}
                />
              )}
            </span>
          );
        })}
      </div>
      <div className="flex justify-between">
        {steps.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] ${
              i === activeIdx
                ? "font-semibold text-[#E67E22]"
                : i < activeIdx
                  ? "text-[#1F1F1F]"
                  : "text-[#6B6660]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">{label}</span>
      {children ? (
        children
      ) : (
        <span className={`text-[12px] font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
      )}
    </div>
  );
}

function ActionBtn({
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
