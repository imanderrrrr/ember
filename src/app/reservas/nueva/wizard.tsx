"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  createReservation,
  getSalonFloorPlan,
  listMeseros,
  listReservationsByDate,
  type MeseroDTO,
  type ReservationDTO,
  type SalonFloorPlanDTO,
} from "./_lib/client-api";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Cake,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  FileText,
  GlassWater,
  HeartHandshake,
  Info,
  Leaf,
  Lightbulb,
  Minus,
  Phone,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Square,
  Star,
  TriangleAlert,
  User,
  Users,
  Utensils,
  WheatOff,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ============ STATE MODEL ============ */

interface ReservationDraft {
  date: string; // ISO yyyy-mm-dd
  dateLabel: string; // "Jueves 14 de mayo"
  timeSlot: string; // "19:00"
  partySize: number;
  tableId: string | null;
  tableLabel: string | null;
  zoneName: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  occasion: string | null;
  restrictions: string[];
  notes: string;
  /** Mesero responsable (nombre). Se elige del roster en el paso 4. */
  mesero: string;
}

/* ─── Date helpers ─── */

const DAYS_LONG = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** ISO yyyy-mm-dd de hoy según el reloj del sistema. */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "Lunes 25 de mayo" — usado en sidebars y cards de resumen. */
function formatDayLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_LONG[dt.getDay()]} ${d} de ${MONTHS_LONG[m - 1]}`;
}

/** "Lun 25 may" — usado en subtítulos compactos (paso 3). */
function formatDayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_SHORT[dt.getDay()]} ${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]}`;
}

/** "12s" / "3m" / "1h" — etiqueta compacta para el chip de borrador. */
function relTimeShort(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

const TODAY = todayISO();

const INITIAL_DRAFT: ReservationDraft = {
  date: TODAY,
  dateLabel: formatDayLong(TODAY),
  timeSlot: "19:00",
  partySize: 4,
  tableId: null,
  // En el paso 1 no hay mesa asignada todavía; se preasigna en paso 3.
  tableLabel: null,
  zoneName: null,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  occasion: null,
  restrictions: [],
  notes: "",
  mesero: "",
};

/** Clave de localStorage donde se guarda el borrador de la reserva en curso. */
const DRAFT_KEY = "ember:reserva-draft";

const TOTAL_STEPS = 5;

const STEP_META: { number: string; label: string; sub: string }[] = [
  { number: "01", label: "FECHA Y HORA", sub: "Define cuándo y cuántos" },
  { number: "02", label: "DISPONIBILIDAD", sub: "Valida capacidad y zonas" },
  { number: "03", label: "MESA Y ZONA", sub: "Asignación de mesa" },
  { number: "04", label: "CLIENTE", sub: "Datos del huésped" },
  { number: "05", label: "CONFIRMAR", sub: "Revisar y reservar" },
];

/** Tiempo restante mostrado en el TimeChip del progress, decrementa por paso. */
const TIME_REMAINING: Record<number, string> = {
  1: "3 min restantes",
  2: "2 min restantes",
  3: "1 min 30s restantes",
  4: "45 s restantes",
  5: "Casi listo",
};

/* ============ ZONES — fuente única para pasos 2 y 3 ============ */

type ZoneBadge = "PREFERIDA" | "DISPONIBLE" | "LIMITADA" | "CERRADA";

interface ZoneTable {
  tableId: string;
  id: string;
  shape: "round" | "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Capacidad real de la mesa — viene de salon_tables.seats. */
  seats: number;
  /** Texto en la mesa para "6 PAX". Solo se muestra para mesas grandes. */
  seatsLabel?: string;
  /** Texto bajo la mesa cuando está reservada para este turno (computado en runtime). */
  reservedBy?: string;
  fontSize?: number;
}

interface ZoneAlt {
  label: string;
  labelColor?: string;
  meta: string;
  chip: {
    icon?: "check" | "clock" | "x";
    text: string;
    tone: "good" | "warn" | "muted" | "bad";
  };
  dotColor: string;
  dotX: number;
  muted?: boolean;
}

interface ZoneDef {
  key: ZoneKey;
  /** Nombre completo que se muestra en sectors, sidebar, titles. */
  name: string;
  /** Versión corta para subtítulos compactos. */
  shortName: string;
  badge: ZoneBadge;
  /** Mesas totales de la zona — su counter aparece en sectores y sidebar.
   *  La cantidad libre (`available`) y el porcentaje de ocupación se
   *  derivan en cliente restando las reservas reales del día/hora. */
  total: number;
  /** Capacidad total en personas. */
  totalSeats: number;
  /** Si está cerrada, no se puede seleccionar en paso 2 ni llegar en paso 3. */
  disabled?: boolean;
  /** Sugerida por default; se preselecciona al entrar al paso 2. */
  preferred?: boolean;
  /** Texto del sub bajo el nombre en la card de sectors. */
  subline: string;
  /** Color del dot circular junto al nombre en el sector. */
  dotColor: string;
  /** Fondo del card en sector (PREFERIDA va destacada). */
  sectorBg: string;
  /** Recomendación de mesa para esta zona — null si no hay (zona cerrada). */
  recommendation: { tableId: string; reasons: string[] } | null;
  /** Layout del plano (vacío si la zona está cerrada). */
  tables: ZoneTable[];
  /** Cards alternativas dentro de la misma zona (paso 3). */
  alts: ZoneAlt[];
}

type ZoneKey = "terraza" | "salon" | "barra" | "privado";

/* ── ZONES dinámicas — derivadas del salón real ───────────────────────────
 * Antes había arrays hardcodeados (TERRAZA_TABLES, SALON_TABLES…) y un
 * `const ZONES` fijo con la lista de sectores. Ahora todo se construye al
 * vuelo desde `GET /api/salon/floor-plan` (zones + salon_tables).
 *
 * Si una zona no existe en el salón, no aparece en el wizard. La capacidad
 * (`seats`) viene real de la DB, así que la recomendación puede usarla.
 *
 * Para que la lista de zonas mantenga la armonía visual del .pen, la
 * primera zona del salón (por `ord`) recibe el badge PREFERIDA y el fondo
 * cream `#f7f3ee`; las demás van blancas con badge según ocupación.
 * ────────────────────────────────────────────────────────────────────── */

interface SalonFloorPlanLike {
  zones: { id: string; name: string; ord: number }[];
  tables: {
    id: string;
    zoneId: string;
    label: string;
    shape: "round" | "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    seats: number;
  }[];
}

const SHORT_NAME: Record<string, string> = {
  "Salón principal": "Salón",
  Terraza: "Terraza",
  Barra: "Barra",
  VIP: "VIP",
};

function buildZones(floorPlan: SalonFloorPlanLike): ZoneDef[] {
  const sorted = [...floorPlan.zones].sort((a, b) => a.ord - b.ord);
  return sorted.map((z, idx) => {
    const tables: ZoneTable[] = floorPlan.tables
      .filter((t) => t.zoneId === z.id)
      .map((t) => ({
        id: t.label,
        tableId: t.id,
        shape: t.shape,
        x: t.x,
        y: t.y,
        w: t.width,
        h: t.height,
        seats: t.seats,
        // Solo mostramos "X PAX" para mesas grandes — evita ruido visual.
        seatsLabel: t.seats >= 6 ? `${t.seats} PAX` : undefined,
        fontSize: t.seats >= 6 ? 16 : undefined,
      }));
    const totalSeats = tables.reduce((acc, t) => acc + t.seats, 0);
    const preferred = idx === 0;
    return {
      key: (z.id as ZoneKey) ?? z.name,
      name: z.name,
      shortName: SHORT_NAME[z.name] ?? z.name,
      // El badge real lo recalcula `badgeFor(zone, occupied)` en runtime,
      // pero ponemos un default razonable acá.
      badge: preferred ? "PREFERIDA" : "DISPONIBLE",
      total: tables.length,
      totalSeats,
      preferred,
      subline: `Capacidad ${totalSeats} personas`,
      dotColor: "#7c8a6a",
      sectorBg: preferred ? "#f7f3ee" : "#FFFFFF",
      // La recomendación se calcula dinámicamente en función del partySize
      // y reservas reales — ver `recommendForZone`. Acá la dejamos en null.
      recommendation: null,
      tables,
      // Alts también se computan dinámicamente en Step3.
      alts: [],
    };
  });
}

/** Recalcula el badge de una zona según cuántas mesas tiene libres ahora. */
function badgeFor(zone: ZoneDef, occupied: number): ZoneBadge {
  const free = zone.total - occupied;
  if (free <= 0) return "CERRADA";
  if (zone.preferred) return "PREFERIDA";
  if (free / zone.total <= 0.35) return "LIMITADA";
  return "DISPONIBLE";
}

function findZone(zones: ZoneDef[], name: string | null): ZoneDef | null {
  return zones.find((z) => z.name === name) ?? null;
}

function findDraftTable(
  zones: ZoneDef[],
  draft: ReservationDraft,
): { zone: ZoneDef; table: ZoneTable } | null {
  for (const zone of zones) {
    const table = zone.tables.find(
      (t) =>
        (draft.tableId && t.tableId === draft.tableId) ||
        (draft.tableLabel && t.id === draft.tableLabel),
    );
    if (table) return { zone, table };
  }
  return null;
}

function recommendedTableForDraft(
  zones: ZoneDef[],
  draft: ReservationDraft,
  reservations: ReservationDTO[],
): { zone: ZoneDef; table: ZoneTable } | null {
  const prefilled = findDraftTable(zones, draft);
  if (prefilled) return prefilled;

  const zone = findZone(zones, draft.zoneName) ?? zones.find((z) => !z.disabled);
  if (!zone) return null;
  const reservedSet = reservedTablesAt(
    reservations,
    zone.name,
    draft.timeSlot,
  );
  const recommendation = recommendForZone(
    zone,
    draft.partySize,
    new Set(reservedSet.keys()),
  );
  const table = recommendation.tableId
    ? zone.tables.find((t) => t.id === recommendation.tableId)
    : null;
  return table ? { zone, table } : null;
}

/**
 * Algoritmo de recomendación: dada una zona y un tamaño de grupo, sugiere
 * la mesa más pequeña que cubra al grupo y que no esté reservada en el
 * turno objetivo. Si ninguna mesa individual cubre, devuelve null y un
 * texto explicativo para mostrar al usuario (ej. "considera combinar mesas").
 */
function recommendForZone(
  zone: ZoneDef,
  partySize: number,
  reservedSet: Set<string>,
): { tableId: string | null; reasons: string[]; noFit?: boolean } {
  const available = zone.tables.filter((t) => !reservedSet.has(t.id));
  const fits = available.filter((t) => t.seats >= partySize);
  if (fits.length === 0) {
    const maxAvailable = available.reduce(
      (acc, t) => (t.seats > acc ? t.seats : acc),
      0,
    );
    return {
      tableId: null,
      reasons: [
        `Ningún mesa individual cubre ${partySize} personas en ${zone.shortName.toLowerCase()}.`,
        maxAvailable > 0
          ? `La mesa más grande aquí es para ${maxAvailable}.`
          : "No hay mesas libres en este sector.",
        "Considera combinar mesas en piso o probar otro sector.",
      ],
      noFit: true,
    };
  }
  // Elige la mesa con menor desperdicio de capacidad (closest fit).
  fits.sort((a, b) => a.seats - b.seats);
  const best = fits[0];
  const slack = best.seats - partySize;
  return {
    tableId: best.id,
    reasons: [
      slack === 0
        ? `Capacidad exacta (${best.seats} para ${partySize})`
        : slack <= 1
          ? `Capacidad ideal (${best.seats} para ${partySize})`
          : `Capacidad generosa (${best.seats} para ${partySize})`,
      "Disponible para tu fecha y hora",
      `Sector ${zone.shortName.toLowerCase()} con ${available.length} mesas libres`,
    ],
  };
}

/* ── Disponibilidad derivada de reservas reales ─────────────────────────
 * Helpers que devuelven cuántas mesas están ocupadas en un slot/zona dado,
 * filtrando la lista de reservas que el wizard tiene en memoria (la del
 * día seleccionado). Cuando no hay reservas, devuelven 0 — todo libre.
 * ──────────────────────────────────────────────────────────────────── */

function reservationsAtSlot(
  reservations: ReservationDTO[],
  timeSlot: string,
): ReservationDTO[] {
  return reservations.filter((r) => r.timeSlot === timeSlot);
}

function reservationsInZone(
  reservations: ReservationDTO[],
  zoneName: string,
  timeSlot?: string,
): ReservationDTO[] {
  return reservations.filter(
    (r) =>
      r.zoneName === zoneName &&
      (timeSlot === undefined || r.timeSlot === timeSlot),
  );
}

/** Devuelve el set de tableLabels reservados para una zona+hora específica. */
function reservedTablesAt(
  reservations: ReservationDTO[],
  zoneName: string,
  timeSlot: string,
): Map<string, ReservationDTO> {
  const map = new Map<string, ReservationDTO>();
  for (const r of reservations) {
    if (r.zoneName === zoneName && r.timeSlot === timeSlot) {
      map.set(r.tableLabel, r);
    }
  }
  return map;
}

/* ============ TOP-LEVEL ============ */

export function Wizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ReservationDraft>(INITIAL_DRAFT);
  const prefilledTableIdRef = useRef<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Estado del POST a /reservations: idle | submitting | error.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Borrador real: persistimos el draft en localStorage y mostramos hace
  // cuánto se guardó (reloj `now` que avanza cada segundo). `savedAt` es null
  // hasta el primer guardado real.
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const skipFirstPersistRef = useRef(true);

  // Reservas reales para la fecha elegida — la ocupación se deriva de aquí.
  // Cuando no hay reservas, todas las mesas/turnos aparecen libres.
  const [reservations, setReservations] = useState<ReservationDTO[]>([]);

  // Floor plan del salón — fuente de zonas, mesas y capacidades reales.
  // null mientras carga (mostramos skeleton de zonas).
  const [floorPlan, setFloorPlan] = useState<SalonFloorPlanDTO | null>(null);

  // Roster de meseros reales (rol = "mesero") para el selector de responsable.
  const [meseros, setMeseros] = useState<MeseroDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getSalonFloorPlan();
        if (!cancelled) setFloorPlan(fp);
      } catch (e) {
        console.error("[wizard] getSalonFloorPlan failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listMeseros();
        if (!cancelled) setMeseros(list);
      } catch (e) {
        console.error("[wizard] listMeseros failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Zonas derivadas: si aún no hay floor plan, lista vacía → los pasos 2 y
  // 3 muestran loading; el paso 1 funciona normal (no depende de zonas).
  const zones: ZoneDef[] = floorPlan ? buildZones(floorPlan) : [];
  const totalOpenTables = zones
    .filter((z) => !z.disabled)
    .reduce((acc, z) => acc + z.total, 0);

  useEffect(() => {
    const requestedTableId = searchParams.get("tableId");
    if (!requestedTableId || !floorPlan) return;
    if (prefilledTableIdRef.current === requestedTableId) return;

    const table = floorPlan.tables.find((t) => t.id === requestedTableId);
    const zone = table
      ? floorPlan.zones.find((z) => z.id === table.zoneId)
      : null;
    if (!table || !zone) return;

    const date = searchParams.get("date");
    const timeSlot = searchParams.get("timeSlot");
    prefilledTableIdRef.current = requestedTableId;
    window.queueMicrotask(() => {
      setDraft((prev) => ({
        ...prev,
        ...(date && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? { date, dateLabel: formatDayLong(date) }
          : {}),
        ...(timeSlot && /^([01]\d|2[0-3]):[0-5]\d$/.test(timeSlot)
          ? { timeSlot }
          : {}),
        zoneName: zone.name,
        tableId: table.id,
        tableLabel: table.label,
      }));
    });
  }, [floorPlan, searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listReservationsByDate(draft.date);
        if (!cancelled) setReservations(list);
      } catch (e) {
        console.error("[wizard] listReservationsByDate failed", e);
        if (!cancelled) setReservations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft.date]);

  // Restaura un borrador guardado al montar (post-hydration, vía microtask
  // para no romper la regla de setState-en-effect ni el render del servidor).
  useEffect(() => {
    let parsed: { draft?: Partial<ReservationDraft>; savedAt?: number } | null =
      null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    if (parsed?.draft) {
      const restored = parsed;
      window.queueMicrotask(() => {
        setDraft((prev) => ({ ...prev, ...restored.draft }));
        if (restored.savedAt) setSavedAt(restored.savedAt);
      });
    }
  }, []);

  // Persiste el draft en cada cambio (saltando el primer render para no
  // "guardar" el borrador vacío inicial). Sella la hora del guardado.
  useEffect(() => {
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return;
    }
    const ts = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, savedAt: ts }));
    } catch {
      // Sin localStorage (modo privado, etc.): el borrador no persiste, pero
      // el wizard sigue funcionando.
    }
    window.queueMicrotask(() => setSavedAt(ts));
  }, [draft]);

  // Reloj para el "hace X" del chip de borrador.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Etiqueta real del chip de borrador.
  const elapsedSec =
    savedAt != null && now > 0
      ? Math.max(0, Math.floor((now - savedAt) / 1000))
      : null;
  const draftLabel =
    savedAt == null
      ? "Borrador iniciado · ahora"
      : elapsedSec == null || elapsedSec < 5
        ? "Borrador guardado · ahora"
        : `Borrador guardado · hace ${relTimeShort(elapsedSec)}`;

  // Guardado manual (botón "Guardar borrador" del footer).
  const saveDraftNow = () => {
    const ts = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, savedAt: ts }));
    } catch {
      // ignore
    }
    setSavedAt(ts);
  };

  const goNext = () => {
    saveDraftNow(); // cada avance guarda el borrador del turno
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  /**
   * Convierte el draft del wizard en el payload que espera POST /reservations.
   * Si en algún paso quedó información a medias (por ejemplo zona null o
   * mesa sin asignar), caemos a defaults razonables antes de mandar.
   */
  const handleFinish = async () => {
    if (submitting) return;
    if (!draft.customerName.trim()) {
      setSubmitError("Agrega un cliente antes de confirmar la reserva.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    // Resolvemos la mesa/zona desde lo elegido en el wizard; si por algún
    // motivo el usuario nunca llegó a setear zona/mesa, caemos a la primera
    // zona disponible y a la primera mesa que cubra al grupo.
    const zone =
      findZone(zones, draft.zoneName) ??
      zones.find((z) => !z.disabled) ??
      null;
    if (!zone) {
      setSubmitError("No hay zonas disponibles para reservar.");
      setSubmitting(false);
      return;
    }
    const reservedSet = new Set(
      reservations
        .filter((r) => r.zoneName === zone.name && r.timeSlot === draft.timeSlot)
        .map((r) => r.tableLabel),
    );
    const rec = recommendForZone(zone, draft.partySize, reservedSet);
    const tableLabel = draft.tableLabel ?? rec.tableId ?? null;
    const table =
      (draft.tableId
        ? zone.tables.find((t) => t.tableId === draft.tableId)
        : null) ??
      (tableLabel ? zone.tables.find((t) => t.id === tableLabel) : null);
    if (!table) {
      setSubmitError("No hay una mesa disponible para esa reserva.");
      setSubmitting(false);
      return;
    }
    try {
      await createReservation({
        tableId: table.tableId,
        date: draft.date,
        timeSlot: draft.timeSlot,
        partySize: draft.partySize,
        zoneName: zone.name,
        tableLabel: table.id,
        customerName: draft.customerName,
        customerPhone: draft.customerPhone || null,
        customerEmail: draft.customerEmail || null,
        occasion: draft.occasion,
        restrictions: draft.restrictions,
        notes: draft.notes || null,
        mesero: draft.mesero || null,
      });
      // La reserva ya es real: descartamos el borrador local.
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      setConfirmed(true);
      setTimeout(() => router.push("/salon"), 1400);
    } catch (e) {
      console.error("[wizard] createReservation failed", e);
      setSubmitError(
        e instanceof Error ? e.message : "No se pudo guardar la reserva",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) return <SuccessScreen draft={draft} />;

  return (
    <div className="flex min-h-screen w-full min-w-[1600px] flex-col bg-[#faf5eb] text-[#1F1F1F]">
      <WizHeader chipText={draftLabel} />
      <WizProgress step={step} />
      <main className="flex flex-1 gap-6 px-7 py-6">
        <div className="flex flex-1 flex-col gap-5">
          {step === 1 && (
            <Step1
              draft={draft}
              onChange={setDraft}
              reservations={reservations}
              totalOpenTables={totalOpenTables}
              zones={zones}
            />
          )}
          {step === 2 && (
            <Step2
              draft={draft}
              onChange={setDraft}
              reservations={reservations}
              zones={zones}
            />
          )}
          {step === 3 && (
            <Step3
              draft={draft}
              onChange={setDraft}
              reservations={reservations}
              zones={zones}
            />
          )}
          {step === 4 && (
            <Step4 draft={draft} onChange={setDraft} meseros={meseros} />
          )}
          {step === 5 && <Step5 draft={draft} />}
        </div>
        {step === 2 ? (
          <Sidebar2
            draft={draft}
            reservations={reservations}
            zones={zones}
          />
        ) : step === 3 ? (
          <Sidebar3
            draft={draft}
            reservations={reservations}
            zones={zones}
          />
        ) : (
          <SummarySidebar draft={draft} step={step} />
        )}
      </main>
      <WizFooter
        step={step}
        onPrev={goPrev}
        onNext={goNext}
        onFinish={handleFinish}
        onSaveDraft={saveDraftNow}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  );
}

/* ============ HEADER (64h) ============ */

function WizHeader({ chipText }: { chipText: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#ede6dc] bg-white px-7">
      <div className="flex items-center gap-3.5">
        <div className="flex size-8 items-center justify-center rounded bg-[#1f1f1f]">
          <span className="font-mono text-[18px] font-semibold text-[#f7f3ee]">
            E
          </span>
        </div>
        <span
          className="font-mono text-[20px] font-semibold text-[#1f1f1f]"
          style={{ letterSpacing: "1px" }}
        >
          EMBER
        </span>
        <span className="h-5 w-px bg-[#ede6dc]" />
        <nav className="flex items-center gap-1.5 text-[13px]">
          <Link href="/salon" className="text-[#6b4f3a] hover:text-[#1F1F1F]">
            Casa Olivar
          </Link>
          <span className="text-[#a89d8e]">/</span>
          <Link href="/salon" className="text-[#6b4f3a] hover:text-[#1F1F1F]">
            Reservas
          </Link>
          <span className="text-[#a89d8e]">/</span>
          <span className="font-semibold text-[#1f1f1f]">Nueva reserva</span>
        </nav>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-[#e67e22] bg-[#f7f3ee] py-1.5 pl-3.5 pr-4">
        <span className="relative block size-3.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#e67e22] opacity-25" />
          <span className="absolute inset-[3.5px] rounded-full bg-[#e67e22]" />
        </span>
        <span className="text-[12px] text-[#6b4f3a]">{chipText}</span>
      </div>

      <div className="flex items-center gap-3.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#1f1f1f]">
          <span
            className="text-[11px] font-semibold text-[#f7f3ee]"
            style={{ letterSpacing: "0.5px" }}
          >
            SM
          </span>
        </span>
        <Link
          href="/salon"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[#6b4f3a] hover:bg-[#f7f3ee]"
        >
          <X className="size-3.5" strokeWidth={1.8} />
          <span className="text-[13px] font-medium">Cerrar</span>
        </Link>
      </div>
    </header>
  );
}

/* ============ PROGRESS (120h) ============ */

function WizProgress({ step }: { step: number }) {
  return (
    <div className="flex h-[120px] items-center justify-center border-b border-[#ede6dc] bg-white px-7">
      <div className="flex w-full items-center justify-between gap-6">
        <div className="flex-1" />

        <div className="flex items-center">
          {STEP_META.map((meta, i) => {
            const idx = i + 1;
            const active = idx === step;
            const past = idx < step;
            // El paso activo es ancho (200px) para hacer espacio al subtítulo;
            // los pasados muestran solo label en verde; los futuros muestran
            // solo label en gris.
            return (
              <div key={meta.label} className="flex items-center">
                <div
                  className="flex flex-col items-center gap-2"
                  style={{ width: active ? 200 : 140 }}
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-full"
                    style={{
                      background: active
                        ? "#e67e22"
                        : past
                          ? "#7c8a6a"
                          : "#f7f3ee",
                      border: active || past ? "none" : "1px solid #ede6dc",
                    }}
                  >
                    {past ? (
                      <Check className="size-4 text-white" strokeWidth={2.5} />
                    ) : (
                      <span
                        className="font-mono text-[13px] font-bold"
                        style={{
                          color: active ? "#FFFFFF" : "#a89d8e",
                        }}
                      >
                        {meta.number}
                      </span>
                    )}
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className="font-mono text-[11px] font-bold"
                      style={{
                        color: active
                          ? "#1f1f1f"
                          : past
                            ? "#5b6e48"
                            : "#a89d8e",
                        letterSpacing: "1.2px",
                      }}
                    >
                      {meta.label}
                    </span>
                    {active && (
                      <span className="text-[11px] text-[#6b4f3a]">
                        {meta.sub}
                      </span>
                    )}
                  </div>
                </div>
                {idx < TOTAL_STEPS && (
                  <div className="flex h-[42px] w-20 items-center justify-center">
                    <span
                      className="h-0.5 w-full"
                      style={{ background: idx < step ? "#7c8a6a" : "#ede6dc" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        <span className="flex items-center gap-2 rounded-full border border-[#ede6dc] bg-[#f7f3ee] px-3 py-1.5">
          <span className="block size-2 rounded-full bg-[#7c8a6a]" />
          <span className="text-[12px] text-[#6b4f3a]">
            Tiempo estimado · {TIME_REMAINING[step] ?? "—"}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ============ FOOTER (88h) ============ */

function WizFooter({
  step,
  onPrev,
  onNext,
  onFinish,
  onSaveDraft,
  submitting,
  submitError,
}: {
  step: number;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onSaveDraft: () => void;
  submitting?: boolean;
  submitError?: string | null;
}) {
  const isLast = step === TOTAL_STEPS;

  const leftLabel =
    step === 1
      ? "Volver al calendario semanal"
      : step === 2
        ? "Volver a Fecha y hora"
        : step === 3
          ? "Volver a Disponibilidad"
          : step === 4
            ? "Volver a Asignar mesa"
            : "Volver a Cliente";

  const continueLabel =
    step === 1
      ? "Continuar a Disponibilidad"
      : step === 2
        ? "Continuar a Asignar mesa"
        : step === 3
          ? "Continuar a Cliente"
          : "Continuar a Confirmación";

  const microText =
    step === 1
      ? "Necesitas fecha, hora y comensales para avanzar al siguiente paso"
      : step === 2
        ? "Capacidad validada. La mesa específica se confirma en el siguiente paso."
        : step === 5
          ? "Al confirmar enviaremos los datos al cliente y bloquearemos la mesa."
          : "Revisa cada bloque antes de continuar.";

  return (
    <footer className="flex h-[88px] flex-col border-t border-[#ede6dc] bg-white">
      <div className="flex flex-1 items-center justify-between gap-6 px-3 py-3">
        {step === 1 ? (
          <Link
            href="/salon"
            className="flex items-center gap-2 rounded-lg px-2 py-3 text-[#6b4f3a] hover:bg-[#f7f3ee]"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
            <span className="text-[13px] font-medium">{leftLabel}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-2 rounded-lg px-2 py-3 text-[#6b4f3a] hover:bg-[#f7f3ee]"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
            <span className="text-[13px] font-medium">{leftLabel}</span>
          </button>
        )}

        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const idx = i + 1;
              const active = idx === step;
              const past = idx < step;
              return (
                <span
                  key={i}
                  className="block rounded-full"
                  style={{
                    width: active ? 10 : 8,
                    height: active ? 10 : 8,
                    background: active
                      ? "#e67e22"
                      : past
                        ? "#7c8a6a"
                        : "#ede6dc",
                  }}
                />
              );
            })}
          </div>
          <span
            className="text-[11px] font-semibold text-[#6b4f3a]"
            style={{ letterSpacing: "0.5px" }}
          >
            Paso {step} de {TOTAL_STEPS}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex items-center justify-center gap-2 rounded-[10px] border border-[#ede6dc] bg-white py-3 pl-[18px] pr-[18px] hover:bg-[#f7f3ee]"
          >
            <Save className="size-3.5 text-[#6b4f3a]" strokeWidth={1.8} />
            <span className="text-[13px] font-bold text-[#6b4f3a]">
              Guardar borrador
            </span>
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={onFinish}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-[10px] py-3 pl-5 pr-5 text-white disabled:opacity-70"
              style={{
                background: "linear-gradient(180deg, #E07A3B 0%, #E8862E 100%)",
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              <CheckCircle2 className="size-4" strokeWidth={2} />
              <span className="text-[13px] font-bold">
                {submitting
                  ? "Guardando reserva…"
                  : "Reservar y notificar cliente"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center justify-center gap-2 rounded-[10px] py-3 pl-5 pr-5 text-white"
              style={{
                background: "linear-gradient(180deg, #E07A3B 0%, #E8862E 100%)",
              }}
            >
              <span className="text-[13px] font-bold">{continueLabel}</span>
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center px-2 pb-2">
        {submitError ? (
          <span className="rounded-md border border-[#C95A3D33] bg-[#C95A3D0A] px-2.5 py-1 text-[11px] font-medium text-[#C95A3D]">
            {submitError}
          </span>
        ) : (
          <span className="text-[11px] text-[#a89d8e]">{microText}</span>
        )}
      </div>
    </footer>
  );
}

/* ============ SUMMARY SIDEBAR (440w, right) ============ */

function SummarySidebar({
  draft,
  step,
}: {
  draft: ReservationDraft;
  step: number;
}) {
  const tablePrimary = draft.tableLabel ? `Mesa ${draft.tableLabel}` : "Por asignar";
  const tableSecondary = draft.zoneName
    ? draft.zoneName
    : "Se asigna en el paso 3";
  const tableStepLabel = draft.tableLabel ? "Preseleccionada" : "Paso 3";

  return (
    <aside className="flex h-fit w-[440px] shrink-0 flex-col gap-3.5 self-start rounded-2xl border border-[#ede6dc] bg-white p-[18px]">
      {/* Head */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            RESUMEN DE LA RESERVA
          </span>
          <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
            Borrador en curso
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[#ede6dc] px-2.5 py-1">
          <span
            className="font-mono text-[10px] font-bold text-[#6b4f3a]"
            style={{ letterSpacing: "0.8px" }}
          >
            {step} de {TOTAL_STEPS}
          </span>
        </span>
      </div>

      <span className="h-px w-full bg-[#ede6dc]" />

      {/* Fecha y hora — confirmado */}
      <SummaryCardConfirmed
        icon={CalendarClock}
        eyebrow="FECHA Y HORA"
        primary={`${draft.dateLabel} · ${draft.timeSlot}`}
        secondary="Turno cena · duración 90 min"
      />

      {/* Comensales — confirmado */}
      <SummaryCardConfirmed
        icon={Users}
        eyebrow="COMENSALES"
        primary={`${draft.partySize} ${draft.partySize === 1 ? "persona" : "personas"}`}
        secondary="Sugerencia: 1 trona infantil"
      />

      {/* Mesa — pendiente */}
      <SummaryCardPending
        icon={Square}
        eyebrow="MESA"
        primary={tablePrimary}
        secondary={tableSecondary}
        stepLabel={tableStepLabel}
      />

      {/* Cliente — pendiente */}
      <SummaryCardPending
        icon={User}
        eyebrow="CLIENTE"
        primary="Pendiente"
        secondary=""
        stepLabel="Paso 4"
      />

      {/* Tips card — dato del turno */}
      <div className="flex flex-col gap-3 rounded-xl bg-[#1f1f1f] p-4">
        <div className="flex items-center gap-2.5">
          <Lightbulb className="size-3.5 text-[#e8b07f]" strokeWidth={2} />
          <span
            className="font-mono text-[10px] font-bold text-[#e8b07f]"
            style={{ letterSpacing: "1.4px" }}
          >
            DATO DEL TURNO
          </span>
        </div>
        <span
          className="font-mono text-[14px] font-bold leading-[1.3] text-white"
          style={{ letterSpacing: "0px" }}
        >
          {draft.timeSlot} es la franja seleccionada para {draft.dateLabel}
        </span>
        <span className="text-[12px] leading-[1.45] text-[#d8cec2]">
          La disponibilidad se recalcula con el plano del salón y las reservas
          guardadas en backend para evitar dobles asignaciones.
        </span>
      </div>

      {/* Shortcuts */}
      <div className="flex flex-col gap-1.5 px-0.5 pt-1.5">
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          ATAJOS
        </span>
        <ShortcutRow keys="←  →" label="navegar entre días" />
        <ShortcutRow keys="+ / −" label="ajustar comensales" />
        <ShortcutRow keys="⏎" label="continuar a Disponibilidad" />
      </div>
    </aside>
  );
}

function SummaryCardConfirmed({
  icon: Icon,
  eyebrow,
  primary,
  secondary,
}: {
  icon: LucideIcon;
  eyebrow: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl bg-[#fbe7d6] p-3.5"
      style={{ border: "1.5px solid #e67e22" }}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="size-3.5 text-[#7a2e14]" strokeWidth={1.8} />
        <span
          className="font-mono text-[10px] font-bold text-[#7a2e14]"
          style={{ letterSpacing: "1.4px" }}
        >
          {eyebrow}
        </span>
        <span className="flex-1" />
        <span className="flex size-[18px] items-center justify-center rounded-full bg-[#e67e22]">
          <Check className="size-2.5 text-white" strokeWidth={3} />
        </span>
      </div>
      <span
        className="font-mono text-[18px] font-bold text-[#1f1f1f]"
        style={{ letterSpacing: "-0.2px" }}
      >
        {primary}
      </span>
      <span className="text-[12px] text-[#6b4f3a]">{secondary}</span>
    </div>
  );
}

function SummaryCardPending({
  icon: Icon,
  eyebrow,
  primary,
  secondary,
  stepLabel,
}: {
  icon: LucideIcon;
  eyebrow: string;
  primary: string;
  secondary: string;
  stepLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5">
      <div className="flex items-center gap-2.5">
        <Icon className="size-3.5 text-[#a89d8e]" strokeWidth={1.8} />
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          {eyebrow}
        </span>
        <span className="flex-1" />
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "0.8px" }}
        >
          {stepLabel}
        </span>
      </div>
      <span className="font-mono text-[16px] font-bold text-[#a89d8e]">
        {primary}
      </span>
      {secondary && (
        <span className="text-[11px] text-[#a89d8e]">{secondary}</span>
      )}
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[22px] items-center justify-center rounded-md border border-[#ede6dc] bg-[#f7f3ee] px-2">
        <span className="font-mono text-[11px] font-bold text-[#6b4f3a]">
          {keys}
        </span>
      </span>
      <span className="text-[11px] text-[#6b4f3a]">{label}</span>
    </div>
  );
}

/* ============ STEP 1 — Cuándo y para cuántos ============ */

type DayDot = "good" | "limited" | "closed";
interface DayCell {
  num: string;
  date: string; // ISO yyyy-mm-dd
  dot?: DayDot;
  /** Fecha anterior a hoy: visual muted + click bloqueado. */
  past?: boolean;
  /** Fecha de hoy según el mock — muestra badge "hoy" siempre. */
  today?: boolean;
  empty?: boolean;
}

/**
 * "Hoy" en el wizard — se calcula del reloj del sistema. Si el usuario
 * navega la app a una fecha de hoy distinta a la inicial, el calendario y
 * el draft default seguirán reflejando esa fecha mientras el módulo no se
 * recargue.
 */
const TODAY_ISO = TODAY;
const TODAY_DATE = new Date();
const CAL_YEAR = TODAY_DATE.getFullYear();
const CAL_MONTH = TODAY_DATE.getMonth(); // 0-indexed
const CAL_MONTH_LABEL = `${MONTHS_LONG[CAL_MONTH].toUpperCase()} ${CAL_YEAR}`;
const DAYS_IN_MONTH = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();

/**
 * Disponibilidad por día. Por ahora todos los futuros son "good" porque
 * no tenemos un endpoint que devuelva ocupación por día sin reservas
 * existentes; cualquier día sin reservas está totalmente libre. Cuando
 * agreguemos `GET /reservations/availability?date=…` por día, este helper
 * empezará a devolver "limited" / "closed" según la carga real.
 */
function dotForDay(_d: number): DayDot {
  return "good";
}

// Calendar matrix: leading empty cells para alinear el día 1 en la columna
// correcta (lunes=0 … domingo=6) + DAYS_IN_MONTH celdas con su data.
const MAY_DAYS: DayCell[] = (() => {
  const todayNum = TODAY_DATE.getDate();
  // Primer día del mes — convertimos Domingo=0 al esquema Lunes=0.
  const firstDow = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const leading = (firstDow + 6) % 7;
  const cells: DayCell[] = [];
  for (let i = 0; i < leading; i++) {
    cells.push({ num: "", date: "", empty: true });
  }
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    const date = `${CAL_YEAR}-${String(CAL_MONTH + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      num: String(d).padStart(2, "0"),
      date,
      dot: dotForDay(d),
      past: d < todayNum,
      today: d === todayNum,
    });
  }
  return cells;
})();

/** Slots fijos del turno; la disponibilidad y el tone se calculan en vivo
 *  a partir de `reservations` (no hay nada hardcoded "Sin disponibilidad"). */
const SLOT_TIMES = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
];

function Step1({
  draft,
  onChange,
  reservations,
  totalOpenTables,
  zones,
}: {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  reservations: ReservationDTO[];
  totalOpenTables: number;
  zones: ZoneDef[];
}) {
  const [shift, setShift] = useState<"almuerzo" | "cena">("cena");
  const suggested = recommendedTableForDraft(zones, draft, reservations);

  // Disponibilidad por slot = total de mesas abiertas - reservas en ese slot
  // para la fecha actual. Cuando no hay reservas, todos quedan llenos al 100%.
  const slots = SLOT_TIMES.map((time) => {
    const occupied = reservationsAtSlot(reservations, time).length;
    const free = Math.max(0, totalOpenTables - occupied);
    const tone: "good" | "limited" | "closed" =
      totalOpenTables === 0
        ? "good" // aún cargando el plano — no mostramos "Sin disponibilidad"
        : free === 0
          ? "closed"
          : free <= 4
            ? "limited"
            : "good";
    const note =
      totalOpenTables === 0
        ? "Cargando…"
        : free === 0
          ? "Sin disponibilidad"
          : `${free} ${free === 1 ? "mesa libre" : "mesas libres"}`;
    return { time, note, tone };
  });

  return (
    <>
      {/* Step header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            PASO 01 · TEMPORALIDAD
          </span>
          <h1
            className="font-mono text-[24px] font-bold leading-tight text-[#1f1f1f]"
            style={{ letterSpacing: "-0.3px" }}
          >
            Define cuándo y para cuántos
          </h1>
          <p className="max-w-[640px] text-[13px] leading-[1.45] text-[#6b4f3a]">
            Selecciona fecha, horario y cantidad de comensales. La disponibilidad
            se valida con el plan de sala del día.
          </p>
        </div>
        <span
          className="flex items-center gap-2 rounded-full bg-[#fbe7d6] py-2 pl-3.5 pr-4"
          style={{ border: "1px solid #e8b07f" }}
        >
          <Calendar className="size-3.5 text-[#7a2e14]" strokeWidth={1.8} />
          <span className="text-[12px] font-semibold text-[#7a2e14]">
            Servicio · Cena
          </span>
        </span>
      </div>

      {/* Calendar card */}
      <section className="flex flex-col gap-[18px] rounded-2xl border border-[#ede6dc] bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span
              className="font-mono text-[11px] font-bold text-[#a89d8e]"
              style={{ letterSpacing: "1.6px" }}
            >
              {CAL_MONTH_LABEL}
            </span>
            <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
              Selecciona un día con disponibilidad
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg border border-[#ede6dc]"
            >
              <ChevronLeft className="size-3.5 text-[#6b4f3a]" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="flex h-8 items-center rounded-lg border border-[#ede6dc] bg-[#f7f3ee] px-3.5"
            >
              <span className="text-[12px] font-semibold text-[#6b4f3a]">
                Hoy
              </span>
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg border border-[#ede6dc]"
            >
              <ChevronRight className="size-3.5 text-[#6b4f3a]" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
            <span
              key={d}
              className="flex h-6 items-center justify-center font-mono text-[10px] font-bold text-[#a89d8e]"
              style={{ letterSpacing: "1.2px" }}
            >
              {d}
            </span>
          ))}
          {MAY_DAYS.map((d, i) => {
            if (d.empty) return <div key={`e${i}`} className="h-14" />;
            const selected = d.date === draft.date;
            const isPast = !!d.past;
            const isToday = !!d.today;
            const isClosed = d.dot === "closed";
            // Bloqueamos pasados (no se puede reservar antes de hoy) y los
            // marcados como "Sin disponibilidad / cerrado".
            const disabled = isPast || isClosed;
            const dotColor =
              d.dot === "good"
                ? "#7c8a6a"
                : d.dot === "limited"
                  ? "#d8a641"
                  : isClosed
                    ? "#c95a3d"
                    : null;
            return (
              <button
                key={d.date}
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                aria-label={
                  isPast
                    ? `${d.num} de ${MONTHS_LONG[CAL_MONTH]} (fecha pasada, no disponible)`
                    : isClosed
                      ? `${d.num} de ${MONTHS_LONG[CAL_MONTH]} (sin disponibilidad)`
                      : `${d.num} de ${MONTHS_LONG[CAL_MONTH]}`
                }
                onClick={() => {
                  if (disabled) return;
                  onChange({
                    ...draft,
                    date: d.date,
                    dateLabel: formatDayLong(d.date),
                  });
                }}
                className="relative flex h-14 flex-col items-center justify-center gap-1 rounded-[10px] transition-colors"
                style={{
                  background: selected ? "#e67e22" : "transparent",
                  border: selected
                    ? "none"
                    : isPast
                      ? "1px dashed #ede6dc"
                      : "1px solid #ede6dc",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: isPast ? 0.45 : 1,
                }}
              >
                <span
                  className="font-mono text-[14px] leading-none"
                  style={{
                    fontWeight: selected ? 700 : isPast ? 400 : 600,
                    color: selected
                      ? "#FFFFFF"
                      : isPast
                        ? "#a89d8e"
                        : isClosed
                          ? "#a89d8e"
                          : "#1f1f1f",
                    textDecoration: isPast ? "line-through" : undefined,
                  }}
                >
                  {d.num}
                </span>
                {/* "hoy" sale solo cuando esta es realmente la fecha de hoy
                    (TODAY_ISO). El color cambia si además está seleccionada
                    para mantener contraste sobre el fondo naranja. */}
                {isToday ? (
                  <span
                    className="font-mono text-[9px] font-bold"
                    style={{
                      letterSpacing: "0.8px",
                      color: selected ? "#fbe7d6" : "#e67e22",
                    }}
                  >
                    hoy
                  </span>
                ) : !isPast && dotColor && !selected ? (
                  <span
                    className="block size-1.5 rounded-full"
                    style={{ background: dotColor }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-[18px] pt-2">
          <LegendDot color="#7c8a6a" label="Buena disponibilidad" />
          <LegendDot color="#d8a641" label="Capacidad limitada" />
          <LegendDot color="#c95a3d" label="Sin disponibilidad / cerrado" />
        </div>
      </section>

      {/* Bottom row: slots + guests */}
      <div className="flex gap-5">
        {/* Slot card */}
        <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-[#ede6dc] bg-white p-5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span
                className="font-mono text-[11px] font-bold text-[#a89d8e]"
                style={{ letterSpacing: "1.6px" }}
              >
                HORARIO DEL TURNO
              </span>
              <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
                Selecciona la franja de entrada
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShift("almuerzo")}
                className="rounded-full px-3 py-1.5"
                style={{
                  background: shift === "almuerzo" ? "#1f1f1f" : "#FFFFFF",
                  border:
                    shift === "almuerzo" ? "none" : "1px solid #ede6dc",
                }}
              >
                <span
                  className="text-[12px] font-semibold"
                  style={{
                    color: shift === "almuerzo" ? "#FFFFFF" : "#a89d8e",
                  }}
                >
                  Almuerzo
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShift("cena")}
                className="rounded-full px-3 py-1.5"
                style={{
                  background: shift === "cena" ? "#1f1f1f" : "#FFFFFF",
                  border: shift === "cena" ? "none" : "1px solid #ede6dc",
                }}
              >
                <span
                  className="text-[12px] font-semibold"
                  style={{
                    color: shift === "cena" ? "#FFFFFF" : "#a89d8e",
                  }}
                >
                  Cena
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              {slots.slice(0, 5).map((s) => (
                <SlotCell
                  key={s.time}
                  time={s.time}
                  note={s.note}
                  tone={s.tone}
                  selected={s.time === draft.timeSlot}
                  onClick={() => onChange({ ...draft, timeSlot: s.time })}
                />
              ))}
            </div>
            <div className="flex gap-2.5">
              {slots.slice(5).map((s) => (
                <SlotCell
                  key={s.time}
                  time={s.time}
                  note={s.note}
                  tone={s.tone}
                  selected={s.time === draft.timeSlot}
                  onClick={() => onChange({ ...draft, timeSlot: s.time })}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-[#ede6dc] bg-[#f7f3ee] px-3.5 py-2.5">
            <Info className="size-3.5 text-[#7c8a6a]" strokeWidth={1.8} />
            <span className="text-[12px] text-[#6b4f3a]">
              La duración del turno se ajusta automáticamente a 90 min para{" "}
              {draft.partySize} comensales. Puedes pedir extensión en el paso 4.
            </span>
          </div>
        </section>

        {/* Guest card */}
        <section className="flex w-[480px] flex-col gap-[18px] rounded-2xl border border-[#ede6dc] bg-white p-5">
          <div className="flex flex-col gap-1">
            <span
              className="font-mono text-[11px] font-bold text-[#a89d8e]"
              style={{ letterSpacing: "1.6px" }}
            >
              COMENSALES
            </span>
            <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
              ¿Cuántos esperas en la mesa?
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 py-3.5">
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...draft,
                  partySize: Math.max(1, draft.partySize - 1),
                })
              }
              className="flex size-12 items-center justify-center rounded-full border border-[#ede6dc]"
            >
              <Minus className="size-4 text-[#6b4f3a]" strokeWidth={2} />
            </button>
            <div className="flex w-[120px] flex-col items-center justify-center gap-1">
              <span
                className="font-mono text-[56px] font-bold leading-none text-[#1f1f1f]"
                style={{ letterSpacing: "-2px" }}
              >
                {draft.partySize}
              </span>
              <span
                className="font-mono text-[10px] font-bold text-[#a89d8e]"
                style={{ letterSpacing: "1.6px" }}
              >
                PERSONAS
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...draft,
                  partySize: Math.min(20, draft.partySize + 1),
                })
              }
              className="flex size-12 items-center justify-center rounded-full bg-[#e67e22]"
            >
              <Plus className="size-4 text-white" strokeWidth={2.4} />
            </button>
          </div>

          <div className="flex gap-2">
            {[2, 4, 6, 8].map((n) => {
              const active = n === draft.partySize;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ ...draft, partySize: n })}
                  className="flex h-9 flex-1 items-center justify-center rounded-full"
                  style={{
                    background: active ? "#fbe7d6" : "transparent",
                    border: active
                      ? "1px solid #e8b07f"
                      : "1px solid #ede6dc",
                  }}
                >
                  <span
                    className="text-[13px]"
                    style={{
                      color: active ? "#7a2e14" : "#6b4f3a",
                      fontWeight: active ? 700 : 600,
                    }}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onChange({ ...draft, partySize: 10 })}
              className="flex h-9 flex-1 items-center justify-center rounded-full border border-[#ede6dc]"
            >
              <span className="text-[13px] font-semibold text-[#6b4f3a]">
                10+
              </span>
            </button>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-[#ede6dc] bg-[#f7f3ee] px-3.5 py-2.5">
            <Users
              className="mt-0.5 size-3.5 shrink-0 text-[#7d5ba6]"
              strokeWidth={1.8}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-[#1f1f1f]">
                {suggested
                  ? `Mesa sugerida: ${suggested.table.id} · ${suggested.zone.shortName}`
                  : "Mesa sugerida: se calculará con el plano del salón"}
              </span>
              <span className="text-[11px] leading-[1.4] text-[#6b4f3a]">
                Para {draft.partySize} personas, capacidad ideal{" "}
                {suggested
                  ? `${suggested.table.seats} personas`
                  : "según disponibilidad real"}
                . Asignable en paso 3.
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function SlotCell({
  time,
  note,
  tone,
  selected,
  onClick,
}: {
  time: string;
  note: string;
  /** Disponibilidad real del slot — separada del estado de selección. */
  tone: "good" | "limited" | "closed";
  selected: boolean;
  onClick: () => void;
}) {
  const isClosed = tone === "closed";
  // La selección manda visualmente; un slot cerrado no se puede seleccionar.
  const isSelected = selected && !isClosed;
  // Cuando está seleccionado mostramos "Seleccionada" en lugar de la
  // disponibilidad — pero la prop original sigue ahí para slots cerrados.
  const displayNote = isSelected ? "Seleccionada" : note;

  const timeColor = isSelected ? "#FFFFFF" : isClosed ? "#a89d8e" : "#1f1f1f";
  const noteColor = isSelected
    ? "#fbe7d6"
    : tone === "good"
      ? "#7c8a6a"
      : tone === "limited"
        ? "#d8a641"
        : "#c95a3d";
  return (
    <button
      type="button"
      onClick={isClosed ? undefined : onClick}
      disabled={isClosed}
      className="flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-[10px]"
      style={{
        background: isSelected ? "#e67e22" : "transparent",
        border: isSelected ? "none" : "1px solid #ede6dc",
        cursor: isClosed ? "default" : "pointer",
      }}
    >
      <span
        className="font-mono text-[16px] leading-none"
        style={{
          color: timeColor,
          fontWeight: isSelected ? 700 : isClosed ? 500 : 700,
        }}
      >
        {time}
      </span>
      <span
        className="text-[10px] font-semibold"
        style={{ color: noteColor }}
      >
        {displayNote}
      </span>
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="block size-[7px] rounded-full" style={{ background: color }} />
      <span className="text-[11px] text-[#6b4f3a]">{label}</span>
    </span>
  );
}

/* ============ STEPS 2-5 (placeholder previas, se rehacen en próximos turnos) ============ */

/* ============ STEP 2 — Verifica disponibilidad ============ */

/**
 * Las barras del timeline están posicionadas con coordenadas absolutas
 * tomadas tal cual del frame `.pen`. La referencia es un track de 1080px;
 * convertimos a porcentaje para que escale con el ancho disponible.
 */
const TIMELINE_REF = 1080;
const pct = (v: number) => `${(v / TIMELINE_REF) * 100}%`;

interface TLBar {
  x: number;
  w: number;
  kind: "green" | "buffer" | "orange";
}
const TIMELINE_ROWS: { label: string; active?: boolean; bars: TLBar[] }[] = [
  {
    label: "MESA 1",
    bars: [
      { x: 0, w: 160, kind: "green" },
      { x: 520, w: 140, kind: "green" },
      { x: 840, w: 160, kind: "green" },
    ],
  },
  {
    label: "TU MESA",
    active: true,
    bars: [
      { x: 200, w: 200, kind: "buffer" },
      { x: 400, w: 280, kind: "orange" },
      { x: 680, w: 200, kind: "buffer" },
      { x: 900, w: 180, kind: "green" },
    ],
  },
  {
    label: "MESA 3",
    bars: [
      { x: 60, w: 120, kind: "green" },
      { x: 420, w: 200, kind: "green" },
    ],
  },
  {
    label: "MESA 4",
    bars: [
      { x: 120, w: 200, kind: "green" },
      { x: 780, w: 160, kind: "green" },
    ],
  },
];

function timelineRowsFor(
  zones: ZoneDef[],
  draft: ReservationDraft,
): { label: string; active?: boolean; bars: TLBar[] }[] {
  const flat = zones.flatMap((zone) =>
    zone.tables.map((table) => ({ zone, table })),
  );
  if (flat.length === 0) return TIMELINE_ROWS;

  const selected =
    findDraftTable(zones, draft) ??
    (flat[0] ? { zone: flat[0].zone, table: flat[0].table } : null);
  const selectedKey = selected?.table.tableId ?? null;
  const selectedRow = selected
    ? [{ zone: selected.zone, table: selected.table }]
    : [];
  const rest = flat
    .filter((item) => item.table.tableId !== selectedKey)
    .slice(0, 3);
  const source = [...selectedRow, ...rest].slice(0, 4);
  const bars = TIMELINE_ROWS.map((row) => row.bars);
  return source.map((item, index) => ({
    label: `${item.table.id} · ${item.zone.shortName.toUpperCase()}`,
    active: item.table.tableId === selectedKey,
    bars: bars[index] ?? TIMELINE_ROWS[0].bars,
  }));
}

/** Color del texto del badge según severidad. */
const BADGE_COLOR: Record<ZoneBadge, string> = {
  PREFERIDA: "#7a2e14",
  DISPONIBLE: "#5b6e48",
  LIMITADA: "#7a2e14",
  CERRADA: "#7a2e14",
};

type RuleIconName = "timer" | "layers" | "bell" | "shield";
interface Rule {
  icon: RuleIconName;
  label: string;
  value: string;
  muted?: boolean;
  chevron?: boolean;
}
const RULES: Rule[] = [
  { icon: "timer", label: "Duración mesa", value: "90 min" },
  { icon: "layers", label: "Buffer entre reservas", value: "30 min" },
  { icon: "bell", label: "Recordatorio al cliente", value: "24h antes" },
  {
    icon: "shield",
    label: "Garantía de tarjeta",
    value: "No requerida",
    muted: true,
    chevron: true,
  },
];

function Step2({
  draft,
  onChange,
  reservations,
  zones,
}: {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}) {
  // Preseleccionar la primera zona disponible al entrar al paso 2.
  useEffect(() => {
    if (draft.zoneName === null && zones.length > 0) {
      const first = zones.find((z) => !z.disabled) ?? zones[0];
      onChange({ ...draft, zoneName: first.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  const selectedZone = findZone(zones, draft.zoneName);
  const timelineRows = timelineRowsFor(zones, draft);
  const assignment = recommendedTableForDraft(zones, draft, reservations);
  const assignmentLabel = assignment
    ? `${assignment.table.id} · ${assignment.zone.shortName}`
    : "mesa por asignar";
  const reservationEnd = incHours(draft.timeSlot, 1, 30);

  // Disponibilidad por zona en la fecha — restamos las reservas reales.
  const availabilityFor = (z: ZoneDef) => {
    if (z.disabled) return { free: 0, occupied: z.total };
    const occupied = reservationsInZone(reservations, z.name).length;
    return { free: Math.max(0, z.total - occupied), occupied };
  };
  const selectedAvailability = selectedZone
    ? availabilityFor(selectedZone)
    : null;
  const selectedOccupancyPct =
    selectedZone && selectedZone.total > 0 && selectedAvailability
      ? Math.round((selectedAvailability.occupied / selectedZone.total) * 100)
      : 0;

  // Loading state mientras llega el plano del salón.
  if (zones.length === 0) {
    return <StepLoading title="Cargando disponibilidad…" />;
  }

  const pickZone = (z: ZoneDef) => {
    if (z.disabled) return;
    // Al cambiar de zona, limpiamos la mesa preasignada (la del paso 3 anterior
    // ya no aplica si cambiaste de sector).
    onChange({ ...draft, zoneName: z.name, tableId: null, tableLabel: null });
  };

  return (
    <>
      {/* Step header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span
            className="animate-r2-up font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px", animationDelay: "0ms" }}
          >
            PASO 02 · CAPACIDAD
          </span>
          <h1
            className="animate-r2-up font-mono text-[24px] font-bold leading-tight text-[#1f1f1f]"
            style={{ letterSpacing: "-0.3px", animationDelay: "80ms" }}
          >
            Verifica disponibilidad del turno
          </h1>
          <p
            className="animate-r2-up max-w-[760px] text-[13px] leading-[1.45] text-[#6b4f3a]"
            style={{ animationDelay: "160ms" }}
          >
            Revisa cómo encaja tu reserva en el plan de sala del{" "}
            {draft.dateLabel} · {draft.timeSlot}. Si hay
            conflictos, sugerimos franjas alternativas.
          </p>
        </div>
        <span
          className="animate-r2-pop flex items-center gap-2 rounded-full bg-[#dfe8d9] py-2 pl-3.5 pr-4"
          style={{ border: "1px solid #a8c18b", animationDelay: "240ms" }}
        >
          <Check className="size-3.5 text-[#5b6e48]" strokeWidth={2.4} />
          <span className="text-[12px] font-semibold text-[#5b6e48]">
            Capacidad confirmada · {selectedOccupancyPct}% ocupado
          </span>
        </span>
      </div>

      {/* Timeline card */}
      <section
        className="animate-r2-up flex flex-col gap-4 rounded-2xl border border-[#ede6dc] bg-white p-5"
        style={{ animationDelay: "300ms" }}
      >
        {/* Top: title + legend */}
        <div className="flex items-end justify-between">
          <div
            className="animate-r2-up flex flex-col gap-1"
            style={{ animationDelay: "360ms" }}
          >
            <span
              className="font-mono text-[11px] font-bold text-[#a89d8e]"
              style={{ letterSpacing: "1.6px" }}
            >
              TIMELINE DEL TURNO · CENA
            </span>
            <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
              Reservas confirmadas vs tu propuesta
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <LegendChip
              color="#7c8a6a"
              label="Confirmadas"
              delay="420ms"
            />
            <LegendChip color="#e67e22" label="Tu reserva" delay="480ms" />
            <LegendChip
              color="#f4daba"
              border="#e8b07f"
              label="Buffer"
              delay="540ms"
            />
          </div>
        </div>

        {/* Hour markers */}
        <div className="flex">
          <div className="w-[120px] shrink-0" />
          <div className="ml-3.5 flex flex-1">
            {["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"].map(
              (h, i) => {
                const isCurrent = h === "19:00";
                return (
                  <span
                    key={h}
                    className="animate-r2-up flex flex-1 items-center justify-center font-mono text-[10px]"
                    style={{
                      animationDelay: `${580 + i * 30}ms`,
                      color: isCurrent ? "#1f1f1f" : "#a89d8e",
                      fontWeight: isCurrent ? 700 : 600,
                      letterSpacing: "0.6px",
                    }}
                  >
                    {h}
                  </span>
                );
              },
            )}
          </div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-3.5">
          {timelineRows.map((row, rowIdx) => {
            const labelDelay = 720 + rowIdx * 80;
            return (
              <div key={row.label} className="flex items-center gap-3.5">
                <span
                  className="animate-r2-left w-[120px] shrink-0 font-mono text-[10px] font-bold"
                  style={{
                    letterSpacing: "1.2px",
                    color: row.active ? "#1f1f1f" : "#a89d8e",
                    animationDelay: `${labelDelay}ms`,
                  }}
                >
                  {row.label}
                </span>
                <div
                  className="relative h-9 flex-1 rounded-md border border-[#ede6dc] bg-[#f7f3ee]"
                  style={{ overflow: "hidden" }}
                >
                  {row.bars.map((bar, barIdx) => {
                    const barDelay = labelDelay + 40 + barIdx * 60;
                    const isOrange = bar.kind === "orange";
                    return (
                      <span
                        key={barIdx}
                        className={`animate-r2-bar absolute top-0 h-full rounded-md ${
                          isOrange ? "animate-r2-pulse" : ""
                        }`}
                        style={{
                          left: pct(bar.x),
                          width: pct(bar.w),
                          background:
                            bar.kind === "green"
                              ? "#7c8a6a"
                              : bar.kind === "orange"
                                ? "#e67e22"
                                : "#f4daba",
                          border:
                            bar.kind === "buffer"
                              ? "1px solid #e8b07f"
                              : undefined,
                          animationDelay: `${barDelay}ms`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div
          className="animate-r2-up flex items-start gap-2.5 rounded-lg border border-[#e8b07f] bg-[#fbe7d6] px-3.5 py-2.5"
          style={{ animationDelay: "1180ms" }}
        >
          <Info
            className="mt-0.5 size-3.5 shrink-0 text-[#7a2e14]"
            strokeWidth={2}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-bold text-[#7a2e14]">
              Tu reserva ({assignmentLabel} · {draft.timeSlot} - {reservationEnd}) tiene buffer libre antes y después
            </span>
            <span className="text-[11px] leading-[1.4] text-[#6b4f3a]">
              30 min de buffer permite preparar la mesa y limpia transición
              entre reservas. Sin conflictos detectados.
            </span>
          </div>
        </div>
      </section>

      {/* Bottom row */}
      <div className="flex gap-5">
        {/* Zonas card */}
        <section
          className="animate-r2-up flex flex-1 flex-col gap-3.5 rounded-2xl border border-[#ede6dc] bg-white p-5"
          style={{ animationDelay: "1240ms" }}
        >
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span
                className="font-mono text-[11px] font-bold text-[#a89d8e]"
                style={{ letterSpacing: "1.6px" }}
              >
                ZONAS DISPONIBLES
              </span>
              <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
                Elige el sector
              </span>
            </div>
            <span
              className="font-mono text-[11px] font-bold text-[#a89d8e]"
              style={{ letterSpacing: "1.4px" }}
            >
              {zones.filter((z) => !z.disabled).length} / {zones.length} abiertas
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {zones.map((z, i) => {
              const isSelected = z.name === draft.zoneName;
              const isDisabled = !!z.disabled;
              const { occupied } = availabilityFor(z);
              const dynamicBadge = badgeFor(z, occupied);
              return (
                <button
                  key={z.name}
                  type="button"
                  onClick={() => pickZone(z)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  aria-disabled={isDisabled}
                  className="animate-r2-up flex items-center gap-3.5 rounded-[10px] px-3.5 py-3 text-left transition-colors"
                  style={{
                    background: isSelected
                      ? "#fbe7d6"
                      : isDisabled
                        ? "#FFFFFF"
                        : z.sectorBg,
                    border: isSelected
                      ? "1.5px solid #e67e22"
                      : "1px solid #ede6dc",
                    opacity: isDisabled ? 0.6 : 1,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    animationDelay: `${1320 + i * 60}ms`,
                  }}
                >
                  <span
                    className="block size-2.5 shrink-0 rounded-full"
                    style={{ background: z.dotColor }}
                  />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span
                      className="font-mono text-[13px]"
                      style={{
                        color: isDisabled ? "#a89d8e" : "#1f1f1f",
                        fontWeight: isDisabled ? 500 : 700,
                      }}
                    >
                      {z.name}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: isDisabled ? "#a89d8e" : "#6b4f3a" }}
                    >
                      {(() => {
                        if (isDisabled) return z.subline;
                        const { free } = availabilityFor(z);
                        return `${free} ${free === 1 ? "mesa libre" : "mesas libres"} · capacidad ${z.totalSeats}`;
                      })()}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 rounded-full bg-[#e67e22] px-2 py-0.5">
                      <Check className="size-2.5 text-white" strokeWidth={3} />
                      <span className="text-[9px] font-bold tracking-[0.1em] text-white">
                        ELEGIDA
                      </span>
                    </span>
                  )}
                  {!isSelected && (
                    <span
                      className="font-mono text-[9px] font-bold"
                      style={{
                        color: BADGE_COLOR[dynamicBadge],
                        letterSpacing: "1.2px",
                      }}
                    >
                      {dynamicBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Confirmación visual de la zona elegida */}
          {selectedZone && (
            <div
              className="animate-r2-up flex items-start gap-2.5 rounded-[10px] border border-[#7c8a6a33] bg-[#7c8a6a14] px-3.5 py-2.5"
              style={{ animationDelay: "1620ms" }}
              key={selectedZone.name}
            >
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-[#5b6e48]"
                strokeWidth={2.4}
              />
              <span className="text-[12px] leading-[1.5] text-[#1f1f1f]">
                {(() => {
                  const { free } = availabilityFor(selectedZone);
                  return (
                    <>
                      <strong className="font-semibold">
                        {selectedZone.name}
                      </strong>{" "}
                      tiene{" "}
                      <strong className="font-semibold">
                        {free} {free === 1 ? "mesa libre" : "mesas libres"}
                      </strong>{" "}
                      a las {draft.timeSlot}. Asignarás la mesa específica en
                      el siguiente paso.
                    </>
                  );
                })()}
              </span>
            </div>
          )}
        </section>

        {/* Reglas card */}
        <section
          className="animate-r2-up flex w-[520px] flex-col gap-3.5 rounded-2xl border border-[#ede6dc] bg-white p-5"
          style={{ animationDelay: "1280ms" }}
        >
          <div className="flex flex-col gap-1">
            <span
              className="font-mono text-[11px] font-bold text-[#a89d8e]"
              style={{ letterSpacing: "1.6px" }}
            >
              CONFIGURACIÓN DEL TURNO
            </span>
            <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
              Reglas aplicadas
            </span>
          </div>
          <div className="flex flex-col">
            {RULES.map((r, i) => (
              <div key={r.label}>
                <div
                  className="animate-r2-up flex items-center justify-between py-2.5"
                  style={{ animationDelay: `${1380 + i * 60}ms` }}
                >
                  <div className="flex items-center gap-2.5">
                    <RuleIcon name={r.icon} muted={r.muted} />
                    <span
                      className="text-[13px]"
                      style={{
                        color: r.muted ? "#6b4f3a" : "#1f1f1f",
                        fontWeight: r.muted ? 500 : 600,
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                  {r.chevron ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-[#a89d8e]">
                        {r.value}
                      </span>
                      <ChevronRight
                        className="size-3.5 text-[#a89d8e]"
                        strokeWidth={1.8}
                      />
                    </div>
                  ) : (
                    <span className="font-mono text-[13px] font-bold text-[#1f1f1f]">
                      {r.value}
                    </span>
                  )}
                </div>
                {i < RULES.length - 1 && (
                  <span className="block h-px w-full bg-[#ede6dc]" />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function LegendChip({
  color,
  border,
  label,
  delay,
}: {
  color: string;
  border?: string;
  label: string;
  delay: string;
}) {
  return (
    <span
      className="animate-r2-pop flex items-center gap-1.5"
      style={{ animationDelay: delay }}
    >
      <span
        className="block size-3 rounded-[3px]"
        style={{
          background: color,
          border: border ? `1px solid ${border}` : undefined,
        }}
      />
      <span className="text-[11px] text-[#6b4f3a]">{label}</span>
    </span>
  );
}

function RuleIcon({
  name,
  muted,
}: {
  name: "timer" | "layers" | "bell" | "shield";
  muted?: boolean;
}) {
  const color = muted ? "#a89d8e" : "#7c8a6a";
  const props = { className: "size-3.5", strokeWidth: 1.8, color };
  if (name === "timer") return <Clock {...props} />;
  if (name === "layers")
    return (
      <svg
        viewBox="0 0 24 24"
        width={14}
        height={14}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
      </svg>
    );
  if (name === "bell") return <Bell {...props} />;
  // shield
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

/* ============ SIDEBAR 2 ============ */

function Sidebar2({
  draft,
  reservations,
  zones,
}: {
  draft: ReservationDraft;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}) {
  const fallbackZone = zones.find((z) => !z.disabled) ?? zones[0];
  const assignment = recommendedTableForDraft(zones, draft, reservations);
  const assignmentText = assignment
    ? `Mesa ${assignment.table.id} preasignada`
    : "Mesa por asignar";
  return (
    <aside className="flex h-fit w-[440px] shrink-0 flex-col gap-3.5 self-start rounded-2xl border border-[#ede6dc] bg-white p-[18px]">
      {/* Head */}
      <div
        className="animate-r2-up flex items-end justify-between"
        style={{ animationDelay: "280ms" }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            RESUMEN DE LA RESERVA
          </span>
          <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
            Validando capacidad
          </span>
        </div>
        <span className="rounded-full border border-[#ede6dc] px-2.5 py-1">
          <span
            className="font-mono text-[10px] font-bold text-[#6b4f3a]"
            style={{ letterSpacing: "0.8px" }}
          >
            2 de 5
          </span>
        </span>
      </div>

      <span
        className="animate-r2-up h-px w-full bg-[#ede6dc]"
        style={{ animationDelay: "320ms" }}
      />

      {/* FECHA — confirmed (green) */}
      <div
        className="animate-r2-up flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
        style={{ animationDelay: "380ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="size-3.5 text-[#5b6e48]" strokeWidth={1.8} />
          <span
            className="font-mono text-[10px] font-bold text-[#5b6e48]"
            style={{ letterSpacing: "1.4px" }}
          >
            FECHA Y HORA
          </span>
          <span className="flex-1" />
          <span className="flex size-[18px] items-center justify-center rounded-full bg-[#7c8a6a]">
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </span>
        </div>
        <span
          className="font-mono text-[16px] font-bold text-[#1f1f1f]"
          style={{ letterSpacing: "-0.2px" }}
        >
          {draft.dateLabel} · {draft.timeSlot}
        </span>
        <span className="text-[12px] text-[#6b4f3a]">
          Duración 90 min · buffer 30 min
        </span>
      </div>

      {/* COMENSALES — confirmed (green) */}
      <div
        className="animate-r2-up flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
        style={{ animationDelay: "440ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Users className="size-3.5 text-[#5b6e48]" strokeWidth={1.8} />
          <span
            className="font-mono text-[10px] font-bold text-[#5b6e48]"
            style={{ letterSpacing: "1.4px" }}
          >
            COMENSALES
          </span>
          <span className="flex-1" />
          <span className="flex size-[18px] items-center justify-center rounded-full bg-[#7c8a6a]">
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </span>
        </div>
        <span
          className="font-mono text-[16px] font-bold text-[#1f1f1f]"
          style={{ letterSpacing: "-0.2px" }}
        >
          {draft.partySize} personas
        </span>
        <span className="text-[12px] text-[#6b4f3a]">
          Sugerencia: 1 trona infantil
        </span>
      </div>

      {/* CAPACIDAD — derivada de reservas reales para la zona elegida */}
      {fallbackZone && (() => {
        const z = findZone(zones, draft.zoneName) ?? fallbackZone;
        const occupied = z.disabled
          ? z.total
          : reservationsInZone(reservations, z.name).length;
        const free = Math.max(0, z.total - occupied);
        const pct = z.total === 0 ? 0 : Math.round((occupied / z.total) * 100);
        return (
          <div
            // key cambia con zona+occupied → re-anima la barra al actualizar.
            key={`${z.key}-${occupied}`}
            className="animate-r2-up flex flex-col gap-2.5 rounded-xl bg-[#fbe7d6] p-3.5"
            style={{
              border: "1.5px solid #e67e22",
              animationDelay: "500ms",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Square className="size-3.5 text-[#7a2e14]" strokeWidth={1.8} />
              <span
                className="font-mono text-[10px] font-bold text-[#7a2e14]"
                style={{ letterSpacing: "1.4px" }}
              >
                CAPACIDAD · {z.shortName.toUpperCase()}
              </span>
              <span className="flex-1" />
              <span
                className="font-mono text-[10px] font-bold text-[#7a2e14]"
                style={{ letterSpacing: "0.8px" }}
              >
                En curso
              </span>
            </div>
            <span
              className="font-mono text-[18px] font-bold text-[#1f1f1f]"
              style={{ letterSpacing: "-0.2px" }}
            >
              {pct}% ocupación de {z.shortName.toLowerCase()}
            </span>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-[#e8b07f] bg-white">
              <span
                className="animate-r2-progress absolute left-0 top-0 block h-full rounded-full bg-[#e67e22]"
                style={
                  {
                    animationDelay: "300ms",
                    ["--r2-progress-target" as string]: `${pct}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <span className="text-[12px] text-[#6b4f3a]">
              {free} / {z.total} mesas libres ·{" "}
              {z.disabled ? "Sector cerrado" : "Sin conflictos"}
            </span>
          </div>
        );
      })()}

      {/* MESA — pending pre-assignment */}
      <div
        className="animate-r2-up flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
        style={{ animationDelay: "560ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Square className="size-3.5 text-[#a89d8e]" strokeWidth={1.8} />
          <span
            className="font-mono text-[10px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.4px" }}
          >
            MESA
          </span>
          <span className="flex-1" />
          <span
            className="font-mono text-[10px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "0.8px" }}
          >
            Paso 3
          </span>
        </div>
        <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
          {assignmentText}
        </span>
        <span className="text-[11px] text-[#6b4f3a]">
          Confirmar o cambiar en el paso 3
        </span>
      </div>

      {/* INSIGHT DEL DÍA (black card) */}
      <div
        className="animate-r2-up flex flex-col gap-3 rounded-xl bg-[#1f1f1f] p-4"
        style={{ animationDelay: "620ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-3.5 text-[#e8b07f]" strokeWidth={2} />
          <span
            className="font-mono text-[10px] font-bold text-[#e8b07f]"
            style={{ letterSpacing: "1.4px" }}
          >
            INSIGHT DEL DÍA
          </span>
        </div>
        <span className="font-mono text-[14px] font-bold leading-[1.3] text-white">
          La reserva entra en el turno de {draft.timeSlot}
        </span>
        <span className="text-[12px] leading-[1.45] text-[#d8cec2]">
          Se valida contra reservas existentes y capacidad real antes de confirmar
          la mesa.
        </span>
      </div>
    </aside>
  );
}

/* ============ STEP 3 — Asigna una mesa ============ */

/** Referencia del plano: el salón en vivo usa un canvas 920×900 — el wizard
 *  rederiza las mesas con esas mismas coordenadas para mantener la posición
 *  exacta de la DB. La card es más alta que en el diseño del .pen pero las
 *  mesas se ven en su sitio real. */
const FLOOR_REF_W = 920;
const FLOOR_REF_H = 900;
const fp = (v: number, axis: "x" | "y" = "x") =>
  axis === "x"
    ? `${(v / FLOOR_REF_W) * 100}%`
    : `${(v / FLOOR_REF_H) * 100}%`;

/**
 * PlanTable extiende ZoneTable con un delay calculado para la animación de
 * entrada. Antes era una constante global; ahora se computa al vuelo en
 * Step3 a partir de `ZONE_TABLES[zoneName]`.
 */
interface PlanTable extends ZoneTable {
  label: string;
  delay: number;
}

/** Compatibilidad: AltCard re-export para los renderers. */
type AltCard = ZoneAlt & { delay: number };

function Step3({
  draft,
  onChange,
  reservations,
  zones,
}: {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}) {
  if (zones.length === 0) {
    return <StepLoading title="Cargando plano del salón…" />;
  }
  const zone = findZone(zones, draft.zoneName);

  // Empty state: si por algún motivo el draft trae una zona inválida.
  if (!zone || zone.disabled) {
    return <Step3NoZone />;
  }

  return (
    <Step3Body
      draft={draft}
      onChange={onChange}
      zone={zone}
      reservations={reservations}
    />
  );
}

/** Skeleton compartido mientras se carga el floor plan del salón. */
function StepLoading({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-r3-up flex max-w-[420px] flex-col items-center gap-3 rounded-2xl border border-dashed border-[#ede6dc] bg-white p-10 text-center">
        <span className="size-3 animate-pulse rounded-full bg-[#e67e22]" />
        <span className="font-mono text-[14px] font-bold text-[#1f1f1f]">
          {title}
        </span>
        <span className="text-[11.5px] text-[#6b4f3a]">
          Sincronizando zonas y mesas con el salón en vivo…
        </span>
      </div>
    </div>
  );
}

function Step3NoZone() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-r3-up flex max-w-[420px] flex-col items-center gap-4 rounded-2xl border border-dashed border-[#ede6dc] bg-white p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#fbe7d6]">
          <Lightbulb className="size-5 text-[#e67e22]" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-mono text-[18px] font-bold text-[#1f1f1f]">
            Primero elige una zona
          </h2>
          <p className="text-[12.5px] leading-[1.5] text-[#6b4f3a]">
            La asignación de mesa depende del sector. Vuelve al{" "}
            <strong>paso anterior</strong> y selecciona una zona abierta para
            poder elegir tu mesa.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Contenido del canvas del salón (920×900 lógico). Se reutiliza tanto en la
 * vista del card como en el modal "Ver plano completo", de modo que mesas,
 * halo de recomendación, sillas y card flotante de sugerencia se rendericen
 * idénticos en ambos contextos.
 */
function FloorPlanContent({
  planTables,
  selected,
  recommended,
  recommendation,
  suggestionsOn,
  zoneShortName,
  partySize,
  onSelect,
}: {
  planTables: PlanTable[];
  selected: string | null;
  recommended: string | null;
  recommendation: {
    tableId: string | null;
    reasons: string[];
    noFit?: boolean;
  };
  suggestionsOn: boolean;
  zoneShortName: string;
  partySize: number;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {/* Top line + entrada label */}
      <div
        className="animate-r3-up absolute left-0 right-0 flex items-center justify-center gap-1.5"
        style={{ top: 6, animationDelay: "380ms" }}
      >
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="none"
          stroke="#6b4f3a"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m7 6 5 5 5-5" />
          <path d="m7 13 5 5 5-5" />
        </svg>
        <span
          className="text-[9px] font-semibold text-[#6b4f3a]"
          style={{ letterSpacing: "1.8px" }}
        >
          ENTRADA PRINCIPAL
        </span>
      </div>
      <div
        className="absolute h-px bg-[#a89d8e]"
        style={{ left: 30, right: 30, top: 30 }}
      />

      {/* Zone labels */}
      <span
        className="absolute font-mono text-[11px] font-medium italic text-[#a89d8e]"
        style={{ left: 24, top: 80, letterSpacing: "2px" }}
      >
        Z &nbsp;VENTANAL
      </span>
      <span
        className="absolute font-mono text-[11px] font-medium italic text-[#a89d8e]"
        style={{ right: 24, top: 80, letterSpacing: "2px" }}
      >
        Z &nbsp;INTERIOR
      </span>

      {/* Halo bajo la mesa recomendada */}
      {recommended &&
        (() => {
          const recT = planTables.find((t) => t.id === recommended);
          if (!recT) return null;
          const haloSize = Math.max(recT.w, recT.h) * 1.5;
          const innerSize = Math.max(recT.w, recT.h) * 1.18;
          const haloOffsetX = (haloSize - recT.w) / 2;
          const haloOffsetY = (haloSize - recT.h) / 2;
          const innerOffsetX = (innerSize - recT.w) / 2;
          const innerOffsetY = (innerSize - recT.h) / 2;
          return (
            <>
              <span
                className="animate-r3-halo absolute rounded-full bg-[#e67e22]"
                style={{
                  left: recT.x - haloOffsetX,
                  top: recT.y - haloOffsetY,
                  width: haloSize,
                  height: haloSize,
                  animationDelay: "560ms",
                }}
              />
              <span
                className="animate-r3-halo-inner absolute rounded-full bg-[#e67e22]"
                style={{
                  left: recT.x - innerOffsetX,
                  top: recT.y - innerOffsetY,
                  width: innerSize,
                  height: innerSize,
                  animationDelay: "640ms",
                }}
              />
            </>
          );
        })()}

      {/* Tables */}
      {planTables.map((t) => (
        <PlanTableNode
          key={t.id}
          table={t}
          selectedId={selected ?? ""}
          recommendedId={recommended ?? ""}
          onSelect={onSelect}
        />
      ))}

      {/* Suggestion card flotante */}
      {suggestionsOn && (
        <div
          className="animate-r3-pop absolute flex flex-col gap-2.5 rounded-xl border bg-white p-3.5"
          style={{
            right: 16,
            bottom: 40,
            width: "32%",
            maxWidth: 320,
            borderColor: recommendation.noFit ? "#C95A3D" : "#e67e22",
            boxShadow: "0 6px 18px rgba(31,27,22,0.10)",
            animationDelay: "900ms",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex size-[22px] items-center justify-center rounded-full"
              style={{
                background: recommendation.noFit ? "#C95A3D14" : "#fbe7d6",
              }}
            >
              {recommendation.noFit ? (
                <TriangleAlert
                  className="size-3 text-[#C95A3D]"
                  strokeWidth={2}
                />
              ) : (
                <Star className="size-3 text-[#e67e22]" strokeWidth={2} />
              )}
            </span>
            <span className="text-[13px] font-bold text-[#1f1f1f]">
              {recommendation.noFit
                ? `Sin mesa individual para ${partySize} personas`
                : `Mejor sugerencia · Mesa ${recommendation.tableId}`}
            </span>
          </div>
          <span className="h-px w-full bg-[#fbe7d6]" />
          <div className="flex flex-col gap-2">
            {recommendation.reasons.map((r) => (
              <div key={r} className="flex items-center gap-2">
                {recommendation.noFit ? (
                  <span
                    className="block size-1.5 shrink-0 rounded-full"
                    style={{ background: "#C95A3D" }}
                  />
                ) : (
                  <Check
                    className="size-3 shrink-0 text-[#7c8a6a]"
                    strokeWidth={2.4}
                  />
                )}
                <span className="text-[11px] font-medium text-[#1f1f1f]">
                  {r}
                </span>
              </div>
            ))}
          </div>
          <span className="h-px w-full bg-[#fbe7d6]" />
          <button
            type="button"
            className="flex items-center gap-1 self-start"
          >
            <span
              className="text-[11px] font-semibold"
              style={{
                color: recommendation.noFit ? "#C95A3D" : "#e67e22",
              }}
            >
              {recommendation.noFit
                ? "Considera otro sector"
                : `Ver alternativas en ${zoneShortName.toLowerCase()}`}
            </span>
            <ArrowRight
              className="size-3"
              strokeWidth={2.4}
              style={{
                color: recommendation.noFit ? "#C95A3D" : "#e67e22",
              }}
            />
          </button>
        </div>
      )}

      {/* Bottom line + pase de cocina */}
      <div
        className="absolute h-px bg-[#1f1f1f]"
        style={{ left: 30, right: 30, bottom: 20 }}
      />
      <div
        className="animate-r3-up absolute left-0 right-0 flex items-center justify-center gap-1.5"
        style={{ bottom: 6, animationDelay: "840ms" }}
      >
        <svg
          viewBox="0 0 24 24"
          width={11}
          height={11}
          fill="none"
          stroke="#1f1f1f"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 11v-1a5 5 0 0 0-10 0v1" />
          <path d="M3 17a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-1H3z" />
          <path d="M12 8V5" />
        </svg>
        <span
          className="text-[9px] font-semibold text-[#1f1f1f]"
          style={{ letterSpacing: "1.8px" }}
        >
          PASE DE COCINA
        </span>
      </div>
    </>
  );
}

function Step3Body({
  draft,
  onChange,
  zone,
  reservations,
}: {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  zone: ZoneDef;
  reservations: ReservationDTO[];
}) {
  const [suggestionsOn, setSuggestionsOn] = useState(true);
  // Zoom del usuario, en términos de "veces el ajuste automático". 1.0 =
  // el plano llena el viewport sin distorsión. Los botones -/+ del header
  // multiplican el ajuste automático (clamp 0.5..1.5).
  const [zoom, setZoom] = useState(1);
  // Modal del plano completo.
  const [planOpen, setPlanOpen] = useState(false);

  // Auto-fit: medimos el viewport del plano y calculamos la escala que hace
  // que el canvas 920×900 entre completo (fit-to-contain) sin deformar. El
  // viewport tiene la misma proporción que el canvas, así que la escala
  // resulta limpia y sin espacios en blanco al zoom por defecto.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const sx = rect.width / FLOOR_REF_W;
      const sy = rect.height / FLOOR_REF_H;
      setAutoScale(Math.min(sx, sy));
    };
    compute();
    const obs = new ResizeObserver(compute);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const effectiveScale = autoScale * zoom;

  // Mapa de mesas reservadas en esta zona+hora (data real).
  const reservedMap = reservedTablesAt(
    reservations,
    zone.name,
    draft.timeSlot,
  );
  const reservedSet = new Set(reservedMap.keys());

  // Recomendación dinámica: depende de la zona + comensales + reservas reales.
  const recommendation = recommendForZone(
    zone,
    draft.partySize,
    reservedSet,
  );
  const recommended = recommendation.tableId;

  // Mesa seleccionada: la del draft, o la recomendada como default.
  const initialPick = draft.tableLabel ?? recommended ?? null;
  const [selected, setSelected] = useState<string | null>(initialPick);

  // Si cambia la zona o el partySize, reseteamos a la recomendada.
  useEffect(() => {
    const table = recommended
      ? zone.tables.find((t) => t.id === recommended)
      : null;
    window.queueMicrotask(() => {
      setSelected(recommended);
      onChange({
        ...draft,
        tableLabel: recommended,
        tableId: table?.tableId ?? null,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone.name, draft.partySize]);

  const selectTable = (label: string) => {
    const table = zone.tables.find((t) => t.id === label);
    setSelected(label);
    onChange({
      ...draft,
      tableLabel: label,
      tableId: table?.tableId ?? null,
    });
  };

  // Decoramos las mesas con delay + el reservedBy real cuando aplique.
  const planTables: PlanTable[] = zone.tables.map((t, i) => {
    const r = reservedMap.get(t.id);
    return {
      ...t,
      label: t.id,
      delay: 360 + i * 40,
      reservedBy: r
        ? `Reserva ${r.timeSlot} — ${r.customerName}`
        : undefined,
    };
  });

  // Cards alternativas: el resto de mesas de la zona (libres) categorizadas
  // según si cubren al grupo. Maximizamos 3 cards para no inundar el UI.
  const alts: AltCard[] = zone.tables
    .filter((t) => t.id !== recommended && !reservedSet.has(t.id))
    .slice(0, 4)
    .map((t, i) => {
      const fits = t.seats >= draft.partySize;
      const generous = t.seats >= draft.partySize + 2;
      const chip: AltCard["chip"] = !fits
        ? { icon: "x", text: `Insuficiente para ${draft.partySize}p`, tone: "bad" }
        : generous
          ? { text: `Generosa (${t.seats} pers)`, tone: "warn" }
          : { icon: "check", text: "Compatible", tone: "good" };
      return {
        label: t.id,
        meta: `${zone.shortName} · ${t.seats} pers`,
        chip,
        dotColor: fits ? "#e67e22" : "#a89d8e",
        dotX: 18 + i * 12,
        muted: !fits,
        delay: 1100 + i * 80,
      };
    });

  // Subtítulo compacto sin cliente ni ocasión (paso 4).
  const subtitle = `${zone.name} · ${formatDayShort(draft.date)} · ${draft.timeSlot} — ${incHours(draft.timeSlot, 3, 30)} · ${draft.partySize} personas`;

  return (
    <>
      {/* StepHeader */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <span
            className="animate-r3-up font-sans text-[11px] font-semibold text-[#6b4f3a]"
            style={{ letterSpacing: "2.4px", animationDelay: "0ms" }}
          >
            PASO 3 DE 5
          </span>
          <h1
            className="animate-r3-up font-mono text-[36px] font-semibold leading-[1.15] text-[#1f1f1f]"
            style={{ animationDelay: "80ms" }}
          >
            Asigna una mesa
          </h1>
          <p
            className="animate-r3-up text-[13px] text-[#6b4f3a]"
            style={{ animationDelay: "160ms" }}
          >
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSuggestionsOn((v) => !v)}
          className="animate-r3-pop flex items-center gap-2.5 rounded-full border border-[#ede6dc] bg-[#f7f3ee] py-3.5 pl-[18px] pr-[18px]"
          style={{ animationDelay: "240ms" }}
        >
          <Lightbulb className="size-4 text-[#e67e22]" strokeWidth={1.8} />
          <span className="text-[13px] font-medium text-[#1f1f1f]">
            Sugerencias inteligentes activadas
          </span>
          <span
            className="flex h-[22px] w-[38px] items-center rounded-full p-[3px] transition-colors"
            style={{
              background: suggestionsOn ? "#e67e22" : "#a89d8e",
              justifyContent: suggestionsOn ? "flex-end" : "flex-start",
            }}
          >
            <span className="block size-4 rounded-full bg-white" />
          </span>
        </button>
      </div>

      {/* Pista de zona elegida + atajo para cambiarla */}
      <div
        className="animate-r3-up flex items-center gap-3 self-start rounded-full border border-[#e67e22] bg-[#fbe7d6] py-2 pl-3.5 pr-4"
        style={{ animationDelay: "300ms" }}
      >
        <span className="block size-2 rounded-full bg-[#e67e22]" />
        <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#7a2e14]">
          ZONA ELEGIDA
        </span>
        <span className="text-[12px] font-semibold text-[#1f1f1f]">
          {(() => {
            const free = Math.max(
              0,
              zone.total - reservationsInZone(reservations, zone.name).length,
            );
            return `${zone.name} · ${free} ${free === 1 ? "mesa libre" : "mesas libres"}`;
          })()}
        </span>
        <span className="text-[11px] text-[#6b4f3a]">
          (para cambiar, vuelve al paso anterior)
        </span>
      </div>

      {/* Floor plan card */}
      <section
        className="animate-r3-up overflow-hidden rounded-2xl border border-[#ede6dc] bg-white"
        style={{ animationDelay: "320ms" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#ede6dc] px-5 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold text-[#1f1f1f]">
              {zone.name} · vista parcial
            </span>
            <span className="text-[12px] text-[#6b4f3a]">
              Disponibilidad a las {draft.timeSlot}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlanOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#ede6dc] bg-white px-3 py-2 transition-colors hover:bg-[#f7f3ee]"
            >
              <svg
                viewBox="0 0 24 24"
                width={13}
                height={13}
                fill="none"
                stroke="#1f1f1f"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M3 8V5a2 2 0 0 1 2-2h3" />
              </svg>
              <span className="text-[12px] font-medium text-[#1f1f1f]">
                Ver plano completo
              </span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))
                }
                disabled={zoom <= 0.5}
                className="flex size-7 items-center justify-center rounded-md bg-[#1f1f1f] disabled:opacity-50"
                aria-label="Reducir zoom"
              >
                <Minus className="size-3.5 text-[#f7f3ee]" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="flex h-7 items-center justify-center rounded-md bg-[#1f1f1f] px-2"
                aria-label="Resetear zoom"
              >
                <span className="text-[11px] font-medium text-[#f7f3ee]">
                  {Math.round(zoom * 100)}%
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))
                }
                disabled={zoom >= 1.5}
                className="flex size-7 items-center justify-center rounded-md bg-[#1f1f1f] disabled:opacity-50"
                aria-label="Aumentar zoom"
              >
                <Plus className="size-3.5 text-[#f7f3ee]" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Floor plan — el viewport adopta la proporción del canvas
            (920×900) para que el plano lo llene completo sin distorsión ni
            espacios en blanco al lado. El canvas se autoescala vía
            ResizeObserver; el zoom del usuario multiplica esa escala. */}
        <div
          ref={viewportRef}
          className="relative mx-auto overflow-auto"
          style={{
            width: "100%",
            maxWidth: 720,
            aspectRatio: `${FLOOR_REF_W} / ${FLOOR_REF_H}`,
          }}
        >
          {/* Wrapper del tamaño escalado — controla cuánto scroll hay. */}
          <div
            style={{
              width: Math.max(FLOOR_REF_W * effectiveScale, 1),
              height: Math.max(FLOOR_REF_H * effectiveScale, 1),
            }}
          >
            {/* Canvas natural 920×900: las coords internas siguen siendo
                porcentaje del FLOOR_REF (= píxeles exactos en este tamaño). */}
            <div
              className="relative bg-white"
              style={{
                width: FLOOR_REF_W,
                height: FLOOR_REF_H,
                transformOrigin: "top left",
                transform: `scale(${effectiveScale})`,
              }}
            >
              <FloorPlanContent
                planTables={planTables}
                selected={selected}
                recommended={recommended}
                recommendation={recommendation}
                suggestionsOn={suggestionsOn}
                zoneShortName={zone.shortName}
                partySize={draft.partySize}
                onSelect={selectTable}
              />
            </div>{/* /canvas natural 920×900 escalado */}
          </div>{/* /wrapper del tamaño escalado */}
        </div>{/* /scroll viewport */}
      </section>

      {/* Otras mesas disponibles dentro de la misma zona */}
      {alts.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div
            className="animate-r3-up flex items-center justify-between gap-3"
            style={{ animationDelay: "1040ms" }}
          >
            <span className="text-[14px] font-semibold text-[#1f1f1f]">
              Otras mesas en {zone.shortName.toLowerCase()} a las{" "}
              {draft.timeSlot}
            </span>
            <div className="flex items-center gap-2">
              <FilterChip label={`Capacidad ≥ ${draft.partySize}`} />
              <FilterChip label="Esta zona" />
            </div>
          </div>
          <div className="flex gap-3.5">
            {alts.map((c) => (
              <AltTableCard
                key={c.label}
                card={c}
                onSelect={() => {
                  if (c.muted) return;
                  selectTable(c.label);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal "Ver plano completo" — overlay con el plano a tamaño grande,
          reutiliza el mismo canvas y todas las interacciones (selección,
          mesas reservadas, halo de recomendación). */}
      {planOpen && (
        <FullFloorPlanModal
          planTables={planTables}
          selected={selected}
          recommended={recommended}
          recommendation={recommendation}
          suggestionsOn={suggestionsOn}
          zone={zone}
          partySize={draft.partySize}
          timeSlot={draft.timeSlot}
          onSelect={selectTable}
          onClose={() => setPlanOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Overlay a pantalla completa con el plano del salón al máximo tamaño
 * posible. Mantiene la proporción real del canvas (920×900) y autoescala
 * para llenar el viewport del modal, con todas las interacciones de
 * selección de mesa intactas. Cerrar con la X, click fuera o tecla Escape.
 */
function FullFloorPlanModal({
  planTables,
  selected,
  recommended,
  recommendation,
  suggestionsOn,
  zone,
  partySize,
  timeSlot,
  onSelect,
  onClose,
}: {
  planTables: PlanTable[];
  selected: string | null;
  recommended: string | null;
  recommendation: {
    tableId: string | null;
    reasons: string[];
    noFit?: boolean;
  };
  suggestionsOn: boolean;
  zone: ZoneDef;
  partySize: number;
  timeSlot: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const modalViewportRef = useRef<HTMLDivElement>(null);
  const [modalScale, setModalScale] = useState(1);

  useEffect(() => {
    const el = modalViewportRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const sx = rect.width / FLOOR_REF_W;
      const sy = rect.height / FLOOR_REF_H;
      setModalScale(Math.min(sx, sy));
    };
    compute();
    const obs = new ResizeObserver(compute);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Escape cierra el modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(31,27,22,0.55)" }}
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-h-[92vh] max-w-[1280px] flex-col overflow-hidden rounded-2xl border border-[#ede6dc] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between gap-4 border-b border-[#ede6dc] px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#6b4f3a]">
              PLANO COMPLETO
            </span>
            <span className="font-mono text-[18px] font-semibold text-[#1f1f1f]">
              {zone.name}
            </span>
            <span className="text-[12px] text-[#6b4f3a]">
              Disponibilidad a las {timeSlot} · {zone.total}{" "}
              {zone.total === 1 ? "mesa total" : "mesas totales"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg border border-[#ede6dc] bg-white transition-colors hover:bg-[#f7f3ee]"
            aria-label="Cerrar plano completo"
          >
            <X className="size-4 text-[#1f1f1f]" strokeWidth={2} />
          </button>
        </div>

        {/* Canvas grande — la zona padded marca el área de plano; el ref
            interno mide el espacio realmente disponible y el canvas se
            escala a fit-to-contain (sin distorsión, centrado, sin sobrepasar
            el modal). */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#faf5eb] p-6">
          <div
            ref={modalViewportRef}
            className="relative flex h-full w-full items-center justify-center"
          >
            <div
              className="relative overflow-hidden rounded-xl border border-[#ede6dc] bg-white"
              style={{
                width: FLOOR_REF_W * modalScale,
                height: FLOOR_REF_H * modalScale,
              }}
            >
              <div
                className="relative bg-white"
                style={{
                  width: FLOOR_REF_W,
                  height: FLOOR_REF_H,
                  transformOrigin: "top left",
                  transform: `scale(${modalScale})`,
                }}
              >
                <FloorPlanContent
                  planTables={planTables}
                  selected={selected}
                  recommended={recommended}
                  recommendation={recommendation}
                  suggestionsOn={suggestionsOn}
                  zoneShortName={zone.shortName}
                  partySize={partySize}
                  onSelect={onSelect}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer del modal con leyenda y selección actual */}
        <div className="flex items-center justify-between gap-4 border-t border-[#ede6dc] bg-white px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-[#7c8a6a] bg-white" />
              <span className="text-[11px] text-[#6b4f3a]">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-[#e67e22] bg-[#fbe7d6]" />
              <span className="text-[11px] text-[#6b4f3a]">Seleccionada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-[#ede6dc] bg-[#ede6dc]" />
              <span className="text-[11px] text-[#6b4f3a]">Reservada</span>
            </div>
            <div className="flex items-center gap-2">
              <Star
                className="size-3 text-[#d8a641]"
                strokeWidth={2}
                fill="#d8a641"
              />
              <span className="text-[11px] text-[#6b4f3a]">Recomendada</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#6b4f3a]">
              Mesa seleccionada:
            </span>
            <span className="rounded-full bg-[#fbe7d6] px-3 py-1 font-mono text-[12px] font-bold text-[#7a2e14]">
              {selected ? `Mesa ${selected}` : "Sin selección"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#1f1f1f] px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Aceptar y cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Add hours helper for subtitle */
function incHours(hhmm: string, hours: number, minutes = 0): string {
  const [h, m] = hhmm.split(":").map(Number);
  let nh = h + hours;
  let nm = m + minutes;
  if (nm >= 60) {
    nh += Math.floor(nm / 60);
    nm = nm % 60;
  }
  nh = nh % 24;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function ZoneChip({
  icon,
  iconColor,
  label,
  dotColor,
  active,
  onClick,
  delay,
}: {
  icon: "utensils" | "sun" | "beer" | "crown";
  iconColor: string;
  label: string;
  dotColor: string;
  active: boolean;
  onClick: () => void;
  delay: string;
}) {
  const Icon =
    icon === "utensils"
      ? Utensils
      : icon === "sun"
        ? SunIcon
        : icon === "beer"
          ? BeerIcon
          : CrownIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-r3-pop flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 transition-colors"
      style={{
        background: active ? "#fbe7d6" : "#FFFFFF",
        border: active ? "1.5px solid #e67e22" : "1px solid #ede6dc",
        animationDelay: delay,
      }}
    >
      <Icon className="size-3.5" strokeWidth={1.8} color={iconColor} />
      <span
        className="text-[12px] text-[#1f1f1f]"
        style={{ fontWeight: active ? 600 : 500 }}
      >
        {label}
      </span>
      <span
        className="block size-1.5 rounded-full"
        style={{ background: dotColor }}
      />
    </button>
  );
}

/**
 * Posiciones de sillas alrededor de una mesa redonda usando coordenadas
 * polares — todas las posiciones se entregan en coords del canvas salón
 * (0..FLOOR_REF_W, 0..FLOOR_REF_H) y luego se convierten a porcentaje.
 */
function chairPositionsRound(
  cx: number,
  cy: number,
  diameter: number,
  seats: number,
): { x: number; y: number }[] {
  const chairSize = 14;
  const offset = 6;
  const dist = diameter / 2 + offset + chairSize / 2;
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < seats; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / seats;
    positions.push({
      x: cx + dist * Math.cos(angle) - chairSize / 2,
      y: cy + dist * Math.sin(angle) - chairSize / 2,
    });
  }
  return positions;
}

/** Sillas para mesa rectangular — ceil/2 arriba, floor/2 abajo. */
function chairPositionsRect(
  mesaX: number,
  mesaY: number,
  w: number,
  h: number,
  seats: number,
): { x: number; y: number }[] {
  const chairSize = 12;
  const offset = 6;
  const top = Math.ceil(seats / 2);
  const bottom = Math.floor(seats / 2);
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < top; i++) {
    const cx = mesaX + ((i + 1) * w) / (top + 1);
    positions.push({ x: cx - chairSize / 2, y: mesaY - offset - chairSize });
  }
  for (let i = 0; i < bottom; i++) {
    const cx = mesaX + ((i + 1) * w) / (bottom + 1);
    positions.push({ x: cx - chairSize / 2, y: mesaY + h + offset });
  }
  return positions;
}

function PlanTableNode({
  table,
  selectedId,
  recommendedId,
  onSelect,
}: {
  table: PlanTable;
  selectedId: string;
  /** Mesa que el sistema recomienda para esta zona — fija. */
  recommendedId: string;
  onSelect: (id: string) => void;
}) {
  const reserved = !!table.reservedBy;
  const isSelected = table.label === selectedId;
  const isRecommended = table.label === recommendedId && !reserved;
  const isRound = table.shape === "round";
  const accent = isSelected;

  // Sillas — usamos las coords del salón (px) y luego convertimos a %.
  const chairs = isRound
    ? chairPositionsRound(
        table.x + table.w / 2,
        table.y + table.h / 2,
        Math.min(table.w, table.h),
        table.seats,
      )
    : chairPositionsRect(table.x, table.y, table.w, table.h, table.seats);
  const chairSize = isRound ? 14 : 12;
  // Color de sillas atenuado para mesas reservadas.
  const chairColor = reserved ? "#ede6dc" : "#D8CEC2";

  return (
    <>
      {/* Sillas — renderizadas debajo de la mesa, en coords absolutas del
          canvas 920×900 (mismo lenguaje que el salón en vivo). */}
      {chairs.map((c, i) => (
        <span
          key={i}
          className="animate-r3-table pointer-events-none absolute"
          style={{
            left: c.x,
            top: c.y,
            width: chairSize,
            height: chairSize,
            background: chairColor,
            borderRadius: isRound ? "9999px" : "3px",
            animationDelay: `${table.delay + 30}ms`,
          }}
        />
      ))}

      <button
        type="button"
        onClick={() => !reserved && onSelect(table.label)}
        disabled={reserved}
        className="animate-r3-table absolute flex flex-col items-center justify-center bg-white transition-shadow"
        style={{
          left: table.x,
          top: table.y,
          width: table.w,
          height: table.h,
          borderRadius: isRound ? 9999 : 8,
          background: accent ? "#fbe7d6" : reserved ? "#ede6dc" : "#FFFFFF",
          border: accent
            ? "2px solid #e67e22"
            : `1px solid ${reserved ? "#ede6dc" : "#7c8a6a"}`,
          opacity: reserved ? 0.75 : 1,
          gap: 2,
          cursor: reserved ? "default" : "pointer",
          animationDelay: `${table.delay}ms`,
          boxShadow: accent ? "0 0 0 4px rgba(230,126,34,0.10)" : undefined,
        }}
      >
        <span
          className="text-[#1f1f1f]"
          style={{
            fontFamily: "Geist, system-ui, sans-serif",
            fontSize: accent ? 16 : table.fontSize ?? 13,
            fontWeight: accent ? 700 : 600,
            color: reserved ? "#6b4f3a" : "#1f1f1f",
          }}
        >
          {table.label}
        </span>
        {table.seatsLabel && (
          <span
            className="font-sans text-[8px] font-semibold"
            style={{
              letterSpacing: "1.2px",
              color: accent ? "#e67e22" : "#6b4f3a",
            }}
          >
            {table.seatsLabel}
          </span>
        )}
        {reserved && !table.seatsLabel && (
          <Users className="size-2.5 text-[#6b4f3a]" strokeWidth={1.8} />
        )}
      </button>

      {/* Star icon — esquina superior izquierda de la mesa recomendada. */}
      {isRecommended && (
        <Star
          className="animate-r3-pop pointer-events-none absolute size-3.5 text-[#d8a641]"
          strokeWidth={2}
          fill="#d8a641"
          style={{
            left: table.x + 4,
            top: table.y + 4,
            animationDelay: `${table.delay + 80}ms`,
          }}
        />
      )}

      {/* Check pill — esquina superior derecha de la mesa seleccionada. */}
      {isSelected && (
        <span
          className="animate-r3-pop absolute flex size-[18px] items-center justify-center rounded-full bg-[#e67e22]"
          style={{
            left: table.x + table.w - 14,
            top: table.y - 9,
            animationDelay: `${table.delay + 120}ms`,
          }}
        >
          <Check className="size-2.5 text-white" strokeWidth={3} />
        </span>
      )}

      {/* Badge "Recomendada" — debajo del centro de la mesa recomendada. */}
      {isRecommended && (
        <span
          className="animate-r3-pop absolute flex items-center gap-1 rounded-full bg-[#e67e22] px-2 py-1"
          style={{
            left: table.x + table.w / 2 - 50,
            top: table.y + table.h + 6,
            animationDelay: `${table.delay + 200}ms`,
            whiteSpace: "nowrap",
          }}
        >
          <Star className="size-2.5 text-white" strokeWidth={2.4} fill="white" />
          <span className="text-[10px] font-semibold text-white">
            Recomendada
          </span>
        </span>
      )}

      {/* Línea diagonal sobre mesas reservadas. */}
      {reserved && (
        <span
          className="pointer-events-none absolute"
          style={{
            left: table.x + 4,
            top: table.y + 4,
            width: table.w - 8,
            height: table.h - 8,
          }}
        >
          <svg
            viewBox={`0 0 ${table.w - 8} ${table.h - 8}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            <line
              x1={0}
              y1={0}
              x2={table.w - 8}
              y2={table.h - 8}
              stroke="#6b4f3a"
              strokeWidth={1}
            />
          </svg>
        </span>
      )}

      {/* Texto bajo la mesa con la reserva (cliente + hora). */}
      {table.reservedBy && (
        <span
          className="animate-r3-up pointer-events-none absolute text-[9px] font-medium text-[#6b4f3a]"
          style={{
            left: table.x - 16,
            top: table.y + table.h + 4,
            width: table.w + 32,
            textAlign: "center",
            animationDelay: `${table.delay + 80}ms`,
          }}
        >
          {table.reservedBy}
        </span>
      )}
    </>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="animate-r3-pop flex items-center gap-1.5 rounded-full border border-[#ede6dc] bg-white py-1.5 pl-3.5 pr-2.5"
      style={{ animationDelay: "1080ms" }}
    >
      <span className="text-[11px] text-[#1f1f1f]">{label}</span>
      <ChevronRight
        className="size-3 rotate-90 text-[#6b4f3a]"
        strokeWidth={2}
      />
    </button>
  );
}

function AltTableCard({
  card,
  onSelect,
}: {
  card: AltCard;
  onSelect: () => void;
}) {
  const chipBg =
    card.chip.tone === "good"
      ? "#ede6dc"
      : card.chip.tone === "warn"
        ? "#faf5eb"
        : card.chip.tone === "muted"
          ? "#ede6dc"
          : "#ede6dc";
  const chipFg =
    card.chip.tone === "good"
      ? "#7c8a6a"
      : card.chip.tone === "warn"
        ? "#6b4f3a"
        : card.chip.tone === "muted"
          ? "#7a2e14"
          : "#7a2e14";
  const ChipIcon =
    card.chip.icon === "check"
      ? Check
      : card.chip.icon === "clock"
        ? Clock
        : card.chip.icon === "x"
          ? X
          : null;
  return (
    <div
      className="animate-r3-card flex flex-1 flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
      style={{
        opacity: card.muted ? 0.85 : 1,
        animationDelay: `${card.delay}ms`,
      }}
    >
      <span
        className="font-mono text-[28px] font-semibold leading-none"
        style={{ color: card.labelColor ?? (card.muted ? "#a89d8e" : "#1f1f1f") }}
      >
        {card.label}
      </span>
      <span
        className="text-[11px]"
        style={{ color: card.muted ? "#a89d8e" : "#6b4f3a" }}
      >
        {card.meta}
      </span>
      <div className="flex">
        <span
          className="flex items-center gap-1 rounded-full px-2 py-1"
          style={{
            background: chipBg,
            border: card.chip.tone === "warn" ? "1px solid #ede6dc" : undefined,
          }}
        >
          {ChipIcon && (
            <ChipIcon
              className="size-2.5"
              strokeWidth={2.4}
              style={{ color: chipFg }}
            />
          )}
          <span
            className="text-[10px] font-semibold"
            style={{ color: chipFg }}
          >
            {card.chip.text}
          </span>
        </span>
      </div>
      <div
        className="relative h-[54px] w-full rounded-md border border-[#ede6dc]"
        style={{
          background: "#faf5eb",
          opacity: card.muted ? 0.6 : 1,
        }}
      >
        <span
          className="absolute block size-[18px] rounded-full"
          style={{
            background: card.dotColor,
            left: card.dotX,
            top: 18,
          }}
        />
      </div>
      <button
        type="button"
        onClick={onSelect}
        disabled={card.muted}
        className="flex items-center justify-center rounded-lg border border-[#ede6dc] py-2"
        style={{
          background: card.muted ? "#faf5eb" : "#FFFFFF",
          cursor: card.muted ? "default" : "pointer",
        }}
      >
        <span
          className="text-[12px] font-semibold"
          style={{ color: card.muted ? "#a89d8e" : "#1f1f1f" }}
        >
          Seleccionar
        </span>
      </button>
    </div>
  );
}

/* Simple lucide-style inline icons we don't import directly */
function SunIcon({ color, ...props }: { color?: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={props.strokeWidth ?? 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function BeerIcon({ color, ...props }: { color?: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={props.strokeWidth ?? 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
      <path d="M9 12v6M13 12v6" />
      <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 3 11 3s2 .5 3 .5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5z" />
      <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
    </svg>
  );
}

function CrownIcon({ color, ...props }: { color?: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={props.strokeWidth ?? 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a1 1 0 0 1 1.6.834L21 17H3l-1.783-10.666a1 1 0 0 1 1.6-.834l4.277 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M3 17h18v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

/* ============ SIDEBAR 3 ============ */

function Sidebar3({
  draft,
  reservations,
  zones,
}: {
  draft: ReservationDraft;
  reservations: ReservationDTO[];
  zones: ZoneDef[];
}) {
  const fallbackZone = zones.find((z) => !z.disabled) ?? zones[0];
  if (!fallbackZone) return null;
  return (
    <aside className="flex h-fit w-[440px] shrink-0 flex-col gap-3.5 self-start rounded-2xl border border-[#ede6dc] bg-white p-[18px]">
      {/* Head */}
      <div
        className="animate-r3-up flex flex-col gap-2"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[11px] font-bold text-[#a89d8e]"
            style={{ letterSpacing: "1.6px" }}
          >
            RESUMEN DE LA RESERVA
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#e67e22] px-2.5 py-1">
            <span className="block size-1.5 rounded-full bg-white" />
            <span className="text-[10px] font-semibold text-white">
              Construyendo · 60% completado
            </span>
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#fbe7d6]">
          <span
            className="animate-r2-progress absolute left-0 top-0 block h-full rounded-full bg-[#e67e22]"
            style={
              {
                animationDelay: "800ms",
                ["--r2-progress-target" as string]: "60%",
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/* PASO 1 — FECHA Y HORA (confirmed) */}
      <SideStepConfirmed
        delay="380ms"
        eyebrow="PASO 1 · FECHA Y HORA"
        actionLabel="Cambiar"
        rows={[
          { icon: Calendar, text: `${draft.dateLabel} 2026` },
          { icon: Clock, text: `${draft.timeSlot} — ${incHours(draft.timeSlot, 3, 30)} (estimado)` },
          { icon: Users, text: `${draft.partySize} personas` },
        ]}
      />

      {/* PASO 2 — DISPONIBILIDAD (confirmed con ocupación real de la zona) */}
      {(() => {
        const z = findZone(zones, draft.zoneName) ?? fallbackZone;
        const occupied = z.disabled
          ? z.total
          : reservationsInZone(reservations, z.name).length;
        const free = Math.max(0, z.total - occupied);
        const pct = z.total === 0 ? 0 : Math.round((occupied / z.total) * 100);
        return (
          <SideStepConfirmed
            delay="440ms"
            eyebrow="PASO 2 · DISPONIBILIDAD"
            actionLabel="Cambiar"
            rows={[
              { icon: Square, text: `${z.name} · ${free} libres de ${z.total}` },
              { icon: Bell, text: `${pct}% ocupación · sin conflictos` },
            ]}
          />
        );
      })()}

      {/* PASO 3 — MESA Y ZONA (activa, depende de zone + tableLabel del draft) */}
      {(() => {
        const z = findZone(zones, draft.zoneName) ?? fallbackZone;
        const tableId = draft.tableLabel ?? z.recommendation?.tableId ?? "—";
        const isRecommended =
          z.recommendation?.tableId === draft.tableLabel ||
          (draft.tableLabel === null && z.recommendation !== null);
        return (
          <div
            className="animate-r3-up flex flex-col gap-2.5 rounded-xl bg-[#fbe7d6] p-3.5"
            style={{
              border: "1.5px solid #e67e22",
              animationDelay: "500ms",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-4 items-center justify-center rounded-full bg-[#e67e22]">
                  <span className="block size-1.5 rounded-full bg-white" />
                </span>
                <span
                  className="font-mono text-[10px] font-bold text-[#7a2e14]"
                  style={{ letterSpacing: "1.4px" }}
                >
                  PASO 3 · MESA Y ZONA
                </span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-[#e67e22] px-2 py-0.5">
                <span className="block size-1.5 rounded-full bg-white" />
                <span className="text-[10px] font-semibold text-white">
                  Editando ahora
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                width={14}
                height={14}
                fill="none"
                stroke="#7a2e14"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx={12} cy={10} r={3} />
              </svg>
              <span className="font-mono text-[16px] font-bold text-[#1f1f1f]">
                {z.name} · Mesa {tableId}
              </span>
            </div>
            <span className="text-[11px] text-[#6b4f3a]">
              Para {draft.partySize}{" "}
              {draft.partySize === 1 ? "persona" : "personas"} · Aforo total{" "}
              {z.totalSeats}
            </span>
            {isRecommended && (
              <div className="flex">
                <span className="flex items-center gap-1 rounded-full bg-[#e67e22] px-2 py-1">
                  <Star
                    className="size-2.5 text-white"
                    strokeWidth={2.4}
                    fill="white"
                  />
                  <span className="text-[10px] font-semibold text-white">
                    Recomendada
                  </span>
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* PASO 4 — CLIENTE (pending) */}
      <SideStepPending
        delay="560ms"
        eyebrow="PASO 4 · CLIENTE"
        primary="Cliente sin asignar"
        secondary="Se pide en el paso 4 del wizard"
        rows={["Sin nombre aún", "Sin contacto registrado"]}
      />

      {/* PASO 5 — CONFIRMACIÓN (pending) */}
      <SideStepPending
        delay="620ms"
        eyebrow="PASO 5 · CONFIRMACIÓN"
        primary="Notificación pendiente"
        secondary="Configurarás canal y mensaje en el paso final"
        rows={[]}
      />

      {/* Calendar preview */}
      <div
        className="animate-r3-up flex flex-col gap-2"
        style={{ animationDelay: "680ms" }}
      >
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          VISTA PREVIA EN EL CALENDARIO
        </span>
        <div className="flex overflow-hidden rounded-xl border border-[#ede6dc] bg-[#fbe7d6]">
          <span className="block w-1 self-stretch bg-[#e67e22]" />
          <div className="flex flex-1 flex-col gap-1 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] font-semibold text-[#1f1f1f]">
                {draft.timeSlot} — {incHours(draft.timeSlot, 3, 30)} · {draft.partySize}p
              </span>
              <Calendar className="size-3 text-[#7a2e14]" strokeWidth={1.8} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#6b4f3a]">
                {(() => {
                  const z = findZone(zones, draft.zoneName) ?? fallbackZone;
                  const tableId =
                    draft.tableLabel ?? z.recommendation?.tableId ?? "—";
                  return `${z.shortName} · ${tableId}`;
                })()}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-[#a89d8e]">
          Así se verá en el calendario semanal
        </span>
      </div>

      {/* Atajos */}
      <div
        className="animate-r3-up flex flex-col gap-2 pt-1"
        style={{ animationDelay: "760ms" }}
      >
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          ATAJOS DEL PASO
        </span>
        <ShortcutBtn icon="refresh" label="Reasignar mesa automáticamente" />
        <ShortcutBtn icon="user" label="Usar última mesa de este cliente" />
        <ShortcutBtn icon="cake" label="Aplicar plantilla de aniversario" />
      </div>
    </aside>
  );
}

function SideStepConfirmed({
  delay,
  eyebrow,
  actionLabel,
  rows,
}: {
  delay: string;
  eyebrow: string;
  actionLabel: string;
  rows: { icon: LucideIcon; text: string }[];
}) {
  return (
    <div
      className="animate-r3-up flex flex-col gap-2 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center rounded-full bg-[#7c8a6a]">
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </span>
          <span
            className="font-mono text-[10px] font-bold text-[#5b6e48]"
            style={{ letterSpacing: "1.4px" }}
          >
            {eyebrow}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-medium text-[#e67e22]"
        >
          <span className="text-[10px]">✎</span>
          {actionLabel}
        </button>
      </div>
      {rows.map((r) => (
        <div key={r.text} className="flex items-center gap-2">
          <r.icon className="size-3.5 text-[#6b4f3a]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#1f1f1f]">{r.text}</span>
        </div>
      ))}
    </div>
  );
}

function SideStepPending({
  delay,
  eyebrow,
  primary,
  secondary,
  rows,
}: {
  delay: string;
  eyebrow: string;
  primary: string;
  secondary: string;
  rows: string[];
}) {
  return (
    <div
      className="animate-r3-up flex flex-col gap-2 rounded-xl border border-[#ede6dc] bg-white p-3.5"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex size-4 items-center justify-center rounded-full border border-dashed border-[#a89d8e]"
        />
        <span
          className="font-mono text-[10px] font-bold text-[#a89d8e]"
          style={{ letterSpacing: "1.4px" }}
        >
          {eyebrow}
        </span>
      </div>
      <span className="font-mono text-[14px] font-semibold text-[#a89d8e]">
        {primary}
      </span>
      {rows.map((r) => (
        <div key={r} className="flex items-center gap-2">
          <span className="size-1 rounded-full bg-[#d8cec2]" />
          <span className="text-[11px] text-[#a89d8e]">{r}</span>
        </div>
      ))}
      <span className="text-[11px] italic text-[#a89d8e]">{secondary}</span>
    </div>
  );
}

function ShortcutBtn({
  icon,
  label,
}: {
  icon: "refresh" | "user" | "cake";
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-2.5 rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5"
    >
      <span className="text-[#6b4f3a]">
        {icon === "refresh" && (
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        )}
        {icon === "user" && <User className="size-3.5" strokeWidth={1.8} />}
        {icon === "cake" && <Cake className="size-3.5" strokeWidth={1.8} />}
      </span>
      <span className="text-[12px] text-[#1f1f1f]">{label}</span>
    </button>
  );
}

function Step4({
  draft,
  onChange,
  meseros,
}: {
  draft: ReservationDraft;
  onChange: (next: ReservationDraft) => void;
  meseros: MeseroDTO[];
}) {
  // `creating`: el formulario de cliente nuevo está abierto. Arranca abierto si
  // todavía no hay cliente, para que se pueda registrar uno de una vez.
  const [creating, setCreating] = useState(draft.customerName.trim() === "");
  const hasClient = draft.customerName.trim().length > 0;
  const initials =
    draft.customerName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "··";
  const startNew = () => {
    onChange({
      ...draft,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
    });
    setCreating(true);
  };

  const occasions = [
    { label: "Cumpleaños", icon: Cake },
    { label: "Aniversario", icon: HeartHandshake },
    { label: "Cena de negocios", icon: GlassWater },
    { label: "Otro", icon: Star },
  ];
  const restrictions = [
    { label: "Vegetariano", icon: Leaf },
    { label: "Sin gluten", icon: WheatOff },
    { label: "Vegano", icon: Leaf },
    { label: "Otro", icon: CircleAlert },
  ];
  const toggleR = (r: string) => {
    const next = draft.restrictions.includes(r)
      ? draft.restrictions.filter((x) => x !== r)
      : [...draft.restrictions, r];
    onChange({ ...draft, restrictions: next });
  };
  return (
    <PlaceholderStep
      stepLabel="PASO 04 · CLIENTE"
      title="Datos del cliente"
      subtitle="Busca un cliente existente o registra uno nuevo."
    >
      <CardSection title="Cliente vinculado">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] px-3.5 py-2.5">
            <Search className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo…"
              className="flex-1 bg-transparent text-[13px] text-[#1f1f1f] outline-none placeholder:text-[#a89d8e]"
            />
          </div>
          <button
            type="button"
            onClick={startNew}
            className="shrink-0 rounded-xl border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] font-medium text-[#1f1f1f] hover:bg-[#f7f3ee]"
          >
            + Nuevo cliente
          </button>
        </div>

        {creating ? (
          <div className="mt-3 flex flex-col gap-2.5 rounded-xl border border-[#ede6dc] bg-[#f7f3ee] p-3.5">
            <span
              className="font-mono text-[9.5px] font-bold text-[#6b4f3a]"
              style={{ letterSpacing: "1.4px" }}
            >
              NUEVO CLIENTE
            </span>
            <input
              type="text"
              autoFocus
              value={draft.customerName}
              onChange={(e) => onChange({ ...draft, customerName: e.target.value })}
              placeholder="Nombre completo *"
              className="w-full rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] text-[#1f1f1f] focus:border-[#e67e22] focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="tel"
                value={draft.customerPhone}
                onChange={(e) =>
                  onChange({ ...draft, customerPhone: e.target.value })
                }
                placeholder="Teléfono"
                className="w-full rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] text-[#1f1f1f] focus:border-[#e67e22] focus:outline-none"
              />
              <input
                type="email"
                value={draft.customerEmail}
                onChange={(e) =>
                  onChange({ ...draft, customerEmail: e.target.value })
                }
                placeholder="Correo electrónico"
                className="w-full rounded-lg border border-[#ede6dc] bg-white px-3 py-2.5 text-[12.5px] text-[#1f1f1f] focus:border-[#e67e22] focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={!hasClient}
              onClick={() => setCreating(false)}
              className="self-end rounded-lg bg-[#e67e22] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Vincular cliente
            </button>
          </div>
        ) : (
          <div
            className="mt-3 flex items-center gap-3 rounded-xl bg-[#fbe7d6] p-3.5"
            style={{ border: "1.5px solid #e8b07f" }}
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-[#e67e22] text-[16px] font-bold text-white">
              {initials}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-[14px] font-bold text-[#1f1f1f]">
                {draft.customerName}
              </span>
              <span className="text-[11.5px] text-[#6b4f3a]">
                {[draft.customerPhone, draft.customerEmail]
                  .filter(Boolean)
                  .join(" · ") || "Sin datos de contacto"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="rounded-lg border border-[#e8b07f] bg-white/70 px-3 py-1.5 text-[11.5px] font-medium text-[#1f1f1f] hover:bg-white"
            >
              Cambiar
            </button>
          </div>
        )}
      </CardSection>
      <div className="grid grid-cols-2 gap-5">
        <CardSection title="Persona a cargo de la mesa">
          {meseros.length === 0 ? (
            <span className="text-[12px] text-[#a89d8e]">
              No hay meseros registrados todavía.
            </span>
          ) : (
            <div className="flex flex-col gap-1.5">
              {meseros.map((m) => {
                const active = draft.mesero === m.name;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      onChange({ ...draft, mesero: active ? "" : m.name })
                    }
                    className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors"
                    style={{
                      background: active ? "#fbe7d6" : "#ffffff",
                      borderColor: active ? "#e67e22" : "#ede6dc",
                    }}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: active ? "#e67e22" : "#7c8a6a" }}
                    >
                      {m.avatarInitials}
                    </span>
                    <span className="flex-1 text-[13px] font-medium text-[#1f1f1f]">
                      {m.name}
                    </span>
                    {active && (
                      <Check className="size-4 text-[#e67e22]" strokeWidth={2.4} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            <Phone className="size-3 text-[#6b4f3a]" strokeWidth={1.8} />
            <span className="text-[11px] text-[#6B6660]">
              {draft.mesero
                ? `Se notificará a ${draft.mesero} por WhatsApp 30 min antes`
                : "Selecciona un mesero para asignarlo como responsable"}
            </span>
          </div>
        </CardSection>
        <CardSection title="Detalles del servicio">
          <span className="font-mono text-[9.5px] font-bold text-[#6b4f3a]" style={{ letterSpacing: "1.4px" }}>OCASIÓN</span>
          <div className="flex flex-wrap gap-1.5">
            {occasions.map((o) => {
              const active = o.label === draft.occasion;
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => onChange({ ...draft, occasion: o.label })}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px]"
                  style={{
                    background: active ? "#e67e22" : "#FFFFFF",
                    border: active ? "1.5px solid #e67e22" : "1px solid #ede6dc",
                    color: active ? "#FFFFFF" : "#1f1f1f",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <o.icon className="size-3" strokeWidth={1.8} />
                  {o.label}
                </button>
              );
            })}
          </div>
          <span className="mt-2 font-mono text-[9.5px] font-bold text-[#6b4f3a]" style={{ letterSpacing: "1.4px" }}>RESTRICCIONES</span>
          <div className="flex flex-wrap gap-1.5">
            {restrictions.map((r) => {
              const active = draft.restrictions.includes(r.label);
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => toggleR(r.label)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px]"
                  style={{
                    background: active ? "#1f1f1f" : "#FFFFFF",
                    border: active ? "1.5px solid #1f1f1f" : "1px solid #ede6dc",
                    color: active ? "#FFFFFF" : "#1f1f1f",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <r.icon className="size-3" strokeWidth={1.8} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </CardSection>
      </div>
    </PlaceholderStep>
  );
}

function Step5({ draft }: { draft: ReservationDraft }) {
  return (
    <PlaceholderStep
      stepLabel="PASO 05 · CONFIRMAR"
      title="Revisa y confirma la reserva"
      subtitle="Verifica todos los datos antes de enviar."
    >
      <CardSection title="Resumen">
        {[
          { label: "Fecha y hora", value: `${draft.dateLabel} · ${draft.timeSlot}` },
        { label: "Mesa asignada", value: draft.tableLabel ? `${draft.zoneName} · Mesa ${draft.tableLabel}` : "Sin mesa asignada" },
          { label: "Comensales", value: `${draft.partySize} personas` },
          { label: "Cliente", value: draft.customerName },
          { label: "Mesero responsable", value: draft.mesero || "Sin asignar" },
          { label: "Ocasión", value: draft.occasion ?? "—" },
          { label: "Restricciones", value: draft.restrictions.length > 0 ? draft.restrictions.join(", ") : "Ninguna" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between border-b border-[#ede6dc] py-2 last:border-b-0">
            <span className="font-mono text-[10px] font-bold text-[#6b4f3a]" style={{ letterSpacing: "1.2px" }}>
              {r.label.toUpperCase()}
            </span>
            <span className="text-[12.5px] font-medium text-[#1f1f1f]">{r.value}</span>
          </div>
        ))}
      </CardSection>
      <div className="flex items-start gap-3 rounded-xl bg-[#fbe7d6] p-4" style={{ border: "1.5px solid #e8b07f" }}>
        <FileText className="mt-0.5 size-4 shrink-0 text-[#e67e22]" strokeWidth={2} />
        <span className="text-[12.5px] leading-[1.5] text-[#1f1f1f]">
          Al confirmar enviaremos un mensaje por WhatsApp a {draft.customerName.split(" ")[0]} con los detalles de la reserva.
        </span>
      </div>
    </PlaceholderStep>
  );
}

function PlaceholderStep({
  stepLabel,
  title,
  subtitle,
  children,
}: {
  stepLabel: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-bold text-[#a89d8e]" style={{ letterSpacing: "1.6px" }}>
          {stepLabel}
        </span>
        <h1 className="font-mono text-[24px] font-bold leading-tight text-[#1f1f1f]" style={{ letterSpacing: "-0.3px" }}>
          {title}
        </h1>
        <p className="max-w-[640px] text-[13px] leading-[1.45] text-[#6b4f3a]">{subtitle}</p>
      </div>
      {children}
    </>
  );
}

function CardSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#ede6dc] bg-white p-5">
      {title && (
        <span className="font-mono text-[10px] font-bold text-[#6b4f3a]" style={{ letterSpacing: "1.4px" }}>
          {title.toUpperCase()}
        </span>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/* ============ SUCCESS SCREEN ============ */

function SuccessScreen({ draft }: { draft: ReservationDraft }) {
  return (
    <div className="flex min-h-screen w-full min-w-[1600px] flex-col items-center justify-center bg-[#faf5eb] text-[#1f1f1f]">
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#7c8a6a] shadow-[0_8px_24px_rgba(124,138,106,0.35)]">
          <Check className="size-7 text-white" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold text-[#7c8a6a]" style={{ letterSpacing: "1.8px" }}>
            RESERVA CONFIRMADA
          </span>
          <h1 className="text-[28px] font-bold leading-tight">
            ¡Lista, {draft.customerName.split(" ")[0]} ya tiene mesa!
          </h1>
          <p className="max-w-[400px] text-[13.5px] leading-[1.5] text-[#6b4f3a]">
            {draft.dateLabel} · {draft.timeSlot}. Volvemos al salón en unos segundos.
          </p>
        </div>
        <Link
          href="/salon"
          className="mt-3 rounded-[10px] bg-[#1f1f1f] px-5 py-2.5 text-[13px] font-semibold text-white"
        >
          Volver al salón ahora
        </Link>
      </div>
    </div>
  );
}

/* Unused-now icons reserved for future steps */
const _reserved = [
  Bell, CircleAlert, Clock, FileText, GlassWater, HeartHandshake, Phone,
  Send, Star, X, Cake,
] as const;
void _reserved;
