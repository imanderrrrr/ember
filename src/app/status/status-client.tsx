"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Badge as BadgeVM,
  ComponentVM,
  DayPoint,
  IconKind,
  StatusVM,
} from "./_lib/status";

/* ─── Tokens del diseño (Pencil · Status · Honest) ──────────────────────── */
const C = {
  bg: "#0e0a08",
  surface: "#161210",
  surface2: "#120d0a",
  border: "#241c16",
  border2: "#2a231d",
  text: "#faf5eb",
  muted: "#8a8078",
  muted2: "#6b6660",
  faint: "#4f4943",
  flame: "#e0772f",
  gold: "#d4a574",
  amber: "#a89d8e",
  ok: "#6aa64f",
  warn: "#e0972f",
  down: "#d24a26",
  nodata: "#2a231d",
  nodataLeg: "#4a423b",
} as const;

const BADGE: Record<BadgeVM["variant"], { bg: string; border: string; dot: string; text: string }> = {
  ok: { bg: "#16241a", border: "#2f6b3f", dot: "#6aa64f", text: "#9bd07a" },
  warn: { bg: "#2a1f10", border: "#7a5a1f", dot: "#e0972f", text: "#f0c987" },
  down: { bg: "#241210", border: "#7c2d12", dot: "#d24a26", text: "#ff9a7a" },
};

const DAY_COLOR: Record<DayPoint["status"], string> = {
  operational: C.ok,
  degraded: C.warn,
  down: C.down,
  nodata: C.nodata,
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function relativeTime(fromMs: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  if (s < 5) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.floor(m / 60)} h`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

/* ─── Íconos (SVG inline, sin dependencias) ─────────────────────────────── */
function Icon({ kind, size = 18, className }: { kind: IconKind | "alert"; size?: number; className?: string }) {
  const common = {
    className,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "monitor":
      return (
        <svg {...common} aria-hidden>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case "server":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="4" width="18" height="7" rx="1.5" />
          <rect x="3" y="13" width="18" height="7" rx="1.5" />
          <path d="M7 7.5h.01M7 16.5h.01" />
        </svg>
      );
    case "database":
      return (
        <svg {...common} aria-hidden>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common} aria-hidden>
          <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Badge (píldora con punto) ─────────────────────────────────────────── */
function Badge({ badge }: { badge: BadgeVM }) {
  const v = BADGE[badge.variant];
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-full px-3"
      style={{ backgroundColor: v.bg, border: `1px solid ${v.border}` }}
    >
      <span className="block size-[5px] rounded-full" style={{ backgroundColor: v.dot }} aria-hidden />
      <span
        className="font-mono text-[9px] font-semibold uppercase"
        style={{ color: v.text, letterSpacing: "0.14em" }}
      >
        {badge.text}
      </span>
    </span>
  );
}

/* ─── Caja de dato (stat / databox comparten estilo) ────────────────────── */
function DataBox({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div
      className="min-w-[180px] flex-1 rounded-[10px] px-3.5 py-2.5"
      style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
    >
      <div
        className="font-mono text-[9px] font-semibold uppercase"
        style={{ color: C.muted2, letterSpacing: "0.16em" }}
      >
        {label}
      </div>
      <div className="mt-1 text-[14px] font-semibold" style={{ color: valueColor ?? C.text }}>
        {value}
      </div>
    </div>
  );
}

/* ─── Barras de historial · 3 filas × 30 columnas ───────────────────────── */
function HistoryBars({
  history,
  onHover,
}: {
  history: DayPoint[];
  onHover: (d: DayPoint | null) => void;
}) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}
      onMouseLeave={() => onHover(null)}
    >
      {history.map((d) => (
        <span
          key={d.date}
          title={`${fmtDate(d.date)} · ${d.status === "nodata" ? "sin dato" : d.status}`}
          onMouseEnter={() => onHover(d)}
          className="h-3.5 rounded-[3px] transition-transform hover:scale-y-110"
          style={{
            backgroundColor: DAY_COLOR[d.status],
            border: d.status === "nodata" ? `1px solid ${C.border2}` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Tarjeta de componente ─────────────────────────────────────────────── */
function ComponentCard({ c }: { c: ComponentVM }) {
  const [hover, setHover] = useState<DayPoint | null>(null);

  const tooltipBody =
    hover === null
      ? "Pasa el cursor sobre un día. Donde no hay sondeo, falta feed de monitoreo para esa fecha."
      : hover.status === "nodata"
        ? `${fmtDate(hover.date)} — sin dato real: falta feed de monitoreo para esta fecha.`
        : `${fmtDate(hover.date)} — ${hover.total - hover.fails}/${hover.total} sondeos OK${
            hover.fails > 0 ? ` · ${hover.fails} con fallo` : ""
          }.`;

  const histRight = c.coverage === 0 ? "Sin historial real" : `${c.coverage}/90 días con datos`;

  return (
    <section
      className="rounded-2xl p-6"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: "#1f1710", border: `1px solid ${C.border}`, color: C.gold }}
            aria-hidden
          >
            <Icon kind={c.icon} />
          </span>
          <div>
            <h3 className="font-display text-[17px] font-semibold leading-tight" style={{ color: C.text }}>
              {c.name}
            </h3>
            <p className="mt-0.5 font-mono text-[11px]" style={{ color: C.muted }}>
              {c.slug}
            </p>
          </div>
        </div>
        <Badge badge={c.badge} />
      </div>

      {/* Descripción */}
      <p className="mt-3.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
        {c.description}
      </p>

      {/* Datos principales */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <DataBox
          label="Estado actual real"
          value={c.estadoActual}
          valueColor={
            c.state === "operational"
              ? C.ok
              : c.state === "degraded"
                ? C.warn
                : c.state === "down"
                  ? C.down
                  : C.amber
          }
        />
        <DataBox label="Disponibilidad 90 días" value={c.uptimeLabel} />
        <DataBox
          label="Dispositivo / contenedor"
          value={`${c.deployment.deviceName} · ${c.deployment.containerName}`}
          valueColor={c.deployment.configured ? C.text : C.amber}
        />
        <DataBox
          label="Host / puerto"
          value={`${c.deployment.deviceHost}${c.deployment.port ? `:${c.deployment.port}` : ""}`}
          valueColor={c.deployment.configured ? C.text : C.amber}
        />
        <DataBox
          label="Fuente"
          value={c.source}
          valueColor={c.sourceConnected ? C.text : C.amber}
        />
      </div>

      {/* Historial */}
      <div className="mt-5 flex items-center justify-between">
        <span
          className="font-mono text-[11px] font-semibold"
          style={{ color: C.amber, letterSpacing: "0.12em" }}
        >
          Historial visual · últimos 90 días
        </span>
        <span className="font-mono text-[10px]" style={{ color: C.muted2 }}>
          {histRight}
        </span>
      </div>
      <div className="mt-2.5">
        <HistoryBars history={c.history} onHover={setHover} />
      </div>

      {/* Tooltip por día (vivo) */}
      <div
        className="mt-4 max-w-md rounded-lg p-3"
        style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
      >
        <div
          className="font-mono text-[10px] font-semibold"
          style={{ color: C.flame, letterSpacing: "0.12em" }}
        >
          Tooltip por día
        </div>
        <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
          {tooltipBody}
        </p>
      </div>

      {/* Incidentes */}
      <div
        className="mt-3 flex items-start gap-2.5 rounded-lg p-3"
        style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
      >
        <span className="mt-px shrink-0" style={{ color: C.warn }} aria-hidden>
          <Icon kind="alert" size={15} />
        </span>
        <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
          Incidentes: no hay feed de incidentes conectado. Cuando exista, aquí se listará fecha,
          duración, causa y resolución; si el feed confirma cero incidentes, se mostrará claramente.
        </p>
      </div>
    </section>
  );
}

/* ─── Página (cliente) ──────────────────────────────────────────────────── */
const POLL_MS = 60_000;

export function StatusClient({ initial }: { initial: StatusVM }) {
  const [data, setData] = useState<StatusVM>(initial);
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) {
        setData((await res.json()) as StatusVM);
        setUpdatedAt(Date.now());
      }
    } catch {
      // conserva el último dato; reintenta en el próximo ciclo
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const runRefresh = () => {
      void refresh();
    };
    const initial = window.setTimeout(runRefresh, 0);
    const t = setInterval(runRefresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") runRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return (
    <main className="min-h-screen w-full" style={{ backgroundColor: C.bg, color: C.text }}>
      <div className="mx-auto w-full max-w-[1280px] px-10 py-10">
        {/* ─── Header card ─── */}
        <header
          className="flex flex-wrap items-start justify-between gap-4 rounded-2xl px-7 py-6"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
        >
          <div>
            <div
              className="font-mono text-[11px] font-semibold"
              style={{ color: C.flame, letterSpacing: "0.22em" }}
            >
              EMBER
            </div>
            <h1 className="mt-1.5 font-display text-[28px] font-bold leading-none" style={{ color: C.text }}>
              Estatus del sistema
            </h1>
            <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
              Pantalla visible aquí · monitoreo honesto sin métricas simuladas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.headerBadges.map((b) => (
              <Badge key={b.text} badge={b} />
            ))}
          </div>
        </header>

        {/* ─── Estado global + Leyenda ─── */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Global */}
          <div
            className="flex-1 rounded-2xl p-6"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <h2 className="text-[15px] font-bold" style={{ color: C.text }}>
              Estado global
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
              {data.global.desc}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {data.global.stats.map((s) => (
                <div
                  key={s.label}
                  className="min-w-[150px] flex-1 rounded-[10px] px-3.5 py-2.5"
                  style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
                >
                  <div
                    className="font-mono text-[9px] font-semibold uppercase"
                    style={{ color: C.muted2, letterSpacing: "0.16em" }}
                  >
                    {s.label}
                  </div>
                  <div className="mt-1 text-[15px] font-bold" style={{ color: C.text }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div
            className="w-full rounded-2xl p-6 lg:w-[416px]"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <div
              className="font-mono text-[11px] font-semibold"
              style={{ color: C.amber, letterSpacing: "0.18em" }}
            >
              Leyenda
            </div>
            <div className="mt-3.5 flex flex-col gap-3">
              <LegendRow color={C.ok} text="Operativo verificado" />
              <LegendRow color={C.warn} text="Degradado verificado" />
              <LegendRow color={C.down} text="Caído verificado" />
              <LegendRow color={C.nodataLeg} text="Sin historial suficiente" />
            </div>
          </div>
        </div>

        {/* ─── Tarjetas por componente ─── */}
        <div className="mt-6 flex flex-col gap-6">
          {data.components.map((c) => (
            <ComponentCard key={c.key} c={c} />
          ))}
        </div>

        {/* ─── Footer ─── */}
        <div className="mt-8" style={{ borderTop: `1px solid ${C.border}` }} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2">
          <p className="font-mono text-[10px]" style={{ color: C.faint, letterSpacing: "0.1em" }}>
            © 2026 EMBER · Restaurant OS — la disponibilidad se calcula solo con datos reales; esta
            pantalla no inventa métricas.
          </p>
          <p className="font-mono text-[10px]" style={{ color: C.faint, letterSpacing: "0.08em" }}>
            Actualizado {relativeTime(updatedAt, now)} · cada 60 s
          </p>
        </div>
      </div>
    </main>
  );
}

function LegendRow({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="block size-[11px] rounded-[3px]"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-[12px]" style={{ color: C.amber }}>
        {text}
      </span>
    </div>
  );
}
