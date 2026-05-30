import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bell,
  CalendarCheck,
  ChefHat,
  CircleCheck,
  Clock,
  DoorOpen,
  Flame,
  GlassWater,
  Info,
  LayoutGrid,
  MapPin,
  OctagonAlert,
  PackageX,
  Quote,
  Search,
  Sparkles,
  Timer,
  TriangleAlert,
  TrendingUp,
  UserX,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { PhilosophyCard } from "./philosophy-card";
import { UserMenu } from "./user-menu";
import { ShiftGoalControl } from "./shift-goal-control";
import { LiveRefresh } from "@/lib/live-refresh";
import {
  getDashboardData,
  type DashboardActivity,
  type DashboardCocina,
  type DashboardData,
  type DashboardKpis,
  type DashboardReserva,
  type DashboardSalon,
  type DashboardVentas,
} from "./_lib/dashboard-data";

/**
 * Render dinámico: el dashboard refleja el estado real del salón, la cocina,
 * las reservas y las ventas del turno, que cambian en cada turno. Combinado con
 * `<LiveRefresh/>`, cada pocos segundos vuelve a pedir estos datos al servidor
 * sin recargar la página.
 *
 * Los widgets conectados al backend (ventas del turno, objetivo, KPIs, salón,
 * cocina, reservas, actividad) muestran datos reales; el resto de tarjetas
 * son ilustrativas (datos de muestra) hasta que tengan su módulo propio.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowLabel(): string {
  const d = new Date();
  const date = new Intl.DateTimeFormat("es-GT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .toUpperCase()
    .replace(/\./g, "");
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return `${date} · ${time}`;
}

export default async function DashboardPage() {
  const data = await getDashboardData(todayISO());
  return (
    <div className="min-h-screen w-full bg-[#FAF5EB] font-jakarta text-[#1F1F1F]">
      <LiveRefresh intervalMs={5000} />
      <Header fecha={nowLabel()} cuentasPendientes={data.cuentasPendientes} />
      <main className="flex flex-col gap-7 px-8 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_480px] gap-7">
          <MainColumn data={data} />
          <SideColumn data={data} />
        </div>
        <div className="stagger-children grid grid-cols-[minmax(0,1fr)_480px] gap-7">
          <PhilosophyCard />
          <MaridajeCard />
        </div>
      </main>
    </div>
  );
}

/* ---------- HEADER ---------- */

function Header({
  fecha,
  cuentasPendientes,
}: {
  fecha: string;
  cuentasPendientes: number;
}) {
  return (
    <header className="flex items-start justify-between gap-6 border-b border-[#EDE6DC] bg-white px-10 py-6">
      {/* Left side */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3.5">
          <span className="font-jakarta text-[22px] font-bold tracking-[0.14em] text-[#C2410C]">
            EMBER
          </span>
          <span className="h-[18px] w-px bg-[#D8CEC2]" />
          <span className="font-jakarta text-[16px] font-semibold text-[#1F1F1F]">
            Casa Olivar
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
            <MapPin className="size-3 text-[#6B4F3A]" strokeWidth={2} />
            <span className="font-jakarta text-[11px] font-medium text-[#6B4F3A]">
              CDMX · Polanco
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#6B4F3A]">
            {fecha}
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#6B4F3A]">
            TURNO CENA · T2
          </span>
          <span className="size-[3px] rounded-full bg-[#D8CEC2]" />
          <span className="flex items-center gap-1.5">
            <span className="block size-1.5 rounded-full bg-[#7C8A6A] shadow-[0_0_8px_rgba(124,138,106,0.7)]" />
            <span className="font-mono text-[11px] tracking-[0.1em] text-[#7C8A6A]">
              SERVICIO EN VIVO
            </span>
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-end gap-3.5">
        <div className="flex h-[38px] items-center gap-2 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3.5">
          <Search className="size-[13px] text-[#A89D8E]" strokeWidth={2} />
          <span className="font-jakarta text-[12px] text-[#A89D8E]">
            Buscar mesa, reserva, ticket...
          </span>
        </div>

        <button className="flex size-[38px] items-center justify-center rounded-[10px] border border-[#EDE6DC] bg-white text-[#1F1F1F] hover:bg-[#F7F3EE]">
          <Bell className="size-[15px]" strokeWidth={1.8} />
        </button>

        <UserMenu />

        <div className="flex flex-col items-end gap-1.5">
          <Link
            href="/caja"
            className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#C2410C] bg-white px-4 py-2.5 hover:bg-[#FBE7D6]"
          >
            <Wallet className="size-[13px] text-[#C2410C]" strokeWidth={2} />
            <span className="font-jakarta text-[12px] font-semibold text-[#C2410C]">
              Cobrar cuentas
            </span>
          </Link>
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.12em] text-[#C2410C]">
            {cuentasPendientes}{" "}
            {cuentasPendientes === 1 ? "CUENTA PENDIENTE" : "CUENTAS PENDIENTES"}
          </span>
        </div>

        <Link
          href="/salon"
          className="flex items-center gap-2.5 rounded-[10px] bg-[#1F1F1F] px-4.5 py-3 shadow-[0_6px_14px_rgba(31,31,31,0.1)] hover:bg-[#0e0a08]"
        >
          <span className="block size-1.5 rounded-full bg-[#E67E22]" />
          <span className="font-jakarta text-[13px] font-semibold text-[#FAF5EB]">
            Ir al salón en vivo
          </span>
          <ArrowRight className="size-[14px] text-[#FAF5EB]" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}

/* ---------- MAIN COLUMN ---------- */

function MainColumn({ data }: { data: DashboardData }) {
  return (
    <div className="stagger-children flex flex-col gap-6">
      <HeroVentas ventas={data.ventas} />
      <KpiStrip kpis={data.kpis} />
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
        <SalesCard />
        <SalonCard salon={data.salon} />
      </div>
      <CocinaCard cocina={data.cocina} />
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
        <RendimientoCard />
        <InsightGastronomicoCard />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <HeatmapCard />
        <FocusQuoteCard />
      </div>
    </div>
  );
}

/* VENTAS DEL TURNO + OBJETIVO — conectado al backend (ventas reales + meta). */
function HeroVentas({ ventas }: { ventas: DashboardVentas }) {
  return (
    <section className="flex items-center justify-between gap-8 rounded-[18px] bg-[#1F1F1F] p-8 shadow-[0_8px_24px_rgba(31,31,31,0.1)]">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#A89D8E]">
            VENTAS DEL TURNO
          </span>
          <span className="size-1 rounded-full bg-[#E67E22]" />
          <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#E67E22]">
            EN VIVO
          </span>
        </div>
        <div className="flex items-end gap-3.5">
          <span className="font-jakarta text-[54px] font-bold leading-none tracking-[-0.015em] text-[#FAF5EB]">
            {ventas.totalLabel}
          </span>
          <span className="pb-2.5 font-mono text-[11px] tracking-[0.14em] text-[#A89D8E]">
            GTQ
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A8C18B33] px-2.5 py-1">
            <TrendingUp className="size-3 text-[#A8C18B]" strokeWidth={2.5} />
            <span className="font-mono text-[11px] font-bold tracking-[0.03em] text-[#A8C18B]">
              {ventas.count}
            </span>
          </span>
          <span className="font-jakarta text-[12px] text-[#A89D8E]">
            {ventas.count === 1 ? "cobro registrado" : "cobros registrados"} en
            el turno
          </span>
        </div>
      </div>

      <ShiftGoalControl
        ventasQ={ventas.totalQ}
        goalQ={ventas.goalQ}
        serviceDate={ventas.serviceDate}
      />
    </section>
  );
}

function KpiStrip({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="stagger-children grid grid-cols-4 gap-4">
      <KpiCard
        icon={<LayoutGrid className="size-[13px]" strokeWidth={2} />}
        label="MESAS ACTIVAS"
        value={`${kpis.mesasActivas} / ${kpis.mesasTotal}`}
        foot={`${kpis.ocupadoPct}% del salón ocupado`}
      />
      <KpiCard
        icon={<CalendarCheck className="size-[13px]" strokeWidth={2} />}
        label="RESERVAS HOY"
        value={String(kpis.reservasHoy)}
        foot={
          kpis.reservasProximas > 0
            ? `${kpis.reservasProximas} próximas en la siguiente hora`
            : "Sin reservas en la próxima hora"
        }
      />
      <KpiCard
        icon={<Flame className="size-[13px]" strokeWidth={2} />}
        label="PEDIDOS COCINA"
        value={String(kpis.pedidosCocina)}
        foot={kpis.pedidosBreakdown}
        accent
      />
      <KpiCard
        icon={<Users className="size-[13px]" strokeWidth={2} />}
        label="AFORO ACTUAL"
        value={`${kpis.aforoPct}%`}
        foot={`${kpis.comensales} / ${kpis.aforoTotal} comensales`}
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  foot,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[14px] border p-5 ${
        accent ? "border-[#E8B07F] bg-[#FBE7D6]" : "border-[#EDE6DC] bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          accent ? "text-[#C2410C]" : "text-[#6B4F3A]"
        }`}
      >
        {icon}
        <span className="font-mono text-[10px] font-bold tracking-[0.14em]">
          {label}
        </span>
      </div>
      <span
        className={`font-jakarta text-[34px] font-bold leading-none tracking-[-0.015em] ${
          accent ? "text-[#C2410C]" : "text-[#1F1F1F]"
        }`}
      >
        {value}
      </span>
      <span
        className={`font-jakarta text-[11px] ${
          accent ? "font-medium text-[#C2410C]" : "text-[#6B4F3A]"
        }`}
      >
        {foot}
      </span>
    </div>
  );
}

/* Ventas por hora — ilustrativo (datos de muestra). */
function SalesCard() {
  const bars = [
    { h: 110, kind: "fade" },
    { h: 88, kind: "fade" },
    { h: 32, kind: "muted" },
    { h: 25, kind: "muted" },
    { h: 65, kind: "fade2" },
    { h: 140, kind: "active" },
    { h: 170, kind: "peak" },
    { h: 95, kind: "future" },
  ];

  const hours = ["14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h"];

  return (
    <section className="flex flex-col gap-5 rounded-[16px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
            VENTAS POR HORA
          </span>
          <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
            Distribución del servicio
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-[#C2410C]" />
          <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#6B4F3A]">
            PICO 20:00
          </span>
        </span>
      </div>

      <div className="flex h-[200px] items-end gap-3.5">
        {bars.map((b, i) => {
          const baseClass =
            "w-full rounded-t-[6px] rounded-b-[2px] transition-colors";
          const styles: Record<string, string> = {
            fade: "opacity-[0.55]",
            fade2: "opacity-[0.7]",
            muted: "bg-[#EDE6DC]",
            active: "ring-1 ring-white/50",
            peak: "bg-[#1F1F1F]",
            future: "bg-white border border-[#D8CEC2]",
          };
          const bg =
            b.kind === "active" || b.kind === "fade" || b.kind === "fade2"
              ? "linear-gradient(180deg, #E67E22 0%, #C2410C 100%)"
              : undefined;
          return (
            <div
              key={i}
              className={`${baseClass} ${styles[b.kind] || ""}`}
              style={{ height: `${b.h}px`, background: bg }}
            />
          );
        })}
      </div>

      <div className="flex justify-between px-1">
        {hours.map((h, i) => (
          <span
            key={h}
            className={`font-mono text-[10px] tracking-[0.05em] ${
              i === 5 ? "font-bold text-[#1F1F1F]" : "text-[#A89D8E]"
            }`}
          >
            {h}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-5 border-t border-[#EDE6DC] pt-3.5">
        <Legend dot="bg-[#1F1F1F]" label="Pico actual" />
        <Legend dot="bg-[#C2410C]" label="Servicio en curso" />
        <Legend dot="bg-white border border-[#D8CEC2]" label="Proyección" />
        <span className="ml-auto font-mono text-[11px] font-semibold tracking-[0.08em] text-[#1F1F1F]">
          TOTAL DEL DÍA · Q112,460
        </span>
      </div>
    </section>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`block size-2 rounded-[2px] ${dot}`} />
      <span className="font-jakarta text-[11px] text-[#6B4F3A]">{label}</span>
    </span>
  );
}

function SalonCard({ salon }: { salon: DashboardSalon }) {
  // Solo filas con mesas presentes (evita listar estados en cero).
  const rows = salon.rows.filter((r) => r.count > 0);
  const segments = salon.rows.filter((r) => r.pct > 0);
  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
          ESTADO DEL SALÓN
        </span>
        <Link
          href="/salon"
          className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#C2410C] hover:underline"
        >
          VER MAPA →
        </Link>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-jakarta text-[42px] font-bold leading-none tracking-[-0.015em]">
          {salon.active}
        </span>
        <span className="pb-1.5 font-jakarta text-[14px] font-medium text-[#A89D8E]">
          / {salon.total} mesas activas
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-[#EDE6DC]">
        {segments.map((s) => (
          <div
            key={s.status}
            className="h-full"
            style={{ width: `${s.pct}%`, background: s.color }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.length > 0 ? (
          rows.map((r) => (
            <SalonRow
              key={r.status}
              color={r.color}
              label={r.label}
              value={String(r.count)}
            />
          ))
        ) : (
          <span className="font-jakarta text-[12px] text-[#A89D8E]">
            Todas las mesas están libres.
          </span>
        )}
      </div>

      {salon.zones.length > 0 && (
        <div className="flex gap-2 border-t border-[#EDE6DC] pt-3">
          {salon.zones.map((z) => (
            <div key={z.name} className="flex flex-1 flex-col items-center gap-1">
              <span className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#6B4F3A]">
                {z.name}
              </span>
              <span
                className={`font-jakarta text-[14px] font-bold ${
                  z.total > 0 && z.active === z.total ? "text-[#C2410C]" : ""
                }`}
              >
                {z.active}/{z.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SalonRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className="block size-2 rounded-[2px]"
          style={{ background: color }}
        />
        <span className="font-jakarta text-[13px] font-medium">{label}</span>
      </div>
      <span className="font-mono text-[13px] font-bold">{value}</span>
    </div>
  );
}

function CocinaCard({ cocina }: { cocina: DashboardCocina }) {
  return (
    <section className="flex flex-col gap-5 rounded-[16px] border border-[#EDE6DC] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
            COCINA EN VIVO
          </span>
          <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
            Pase de cocina · brigada en línea
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
            <Timer className="size-2.5 text-[#6B4F3A]" strokeWidth={2.5} />
            <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#6B4F3A]">
              PROM. {cocina.avgLabel} MIN
            </span>
          </span>
          {cocina.demoras > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8B07F] bg-[#FBE7D6] px-2.5 py-1">
              <TriangleAlert className="size-2.5 text-[#C2410C]" strokeWidth={2.5} />
              <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#C2410C]">
                {cocina.demoras} {cocina.demoras === 1 ? "DEMORA" : "DEMORAS"}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1">
              <CircleCheck className="size-2.5 text-[#7C8A6A]" strokeWidth={2.5} />
              <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#7C8A6A]">
                AL DÍA
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <KitchenStat
          label="NUEVOS"
          value={String(cocina.nuevas)}
          help="recién enviados"
          tone="cream"
        />
        <KitchenStat
          label="EN PREPARACIÓN"
          value={String(cocina.preparacion)}
          help="con tiempo en curso"
          tone="warning"
        />
        <KitchenStat
          label="LISTOS PARA SERVIR"
          value={String(cocina.listas)}
          help="esperando entrega"
          tone="dark"
        />
      </div>
    </section>
  );
}

function KitchenStat({
  label,
  value,
  help,
  tone,
}: {
  label: string;
  value: string;
  help: string;
  tone: "cream" | "warning" | "dark";
}) {
  const styles = {
    cream: "bg-[#F7F3EE]",
    warning: "bg-[#FBE7D6] border border-[#E8B07F]",
    dark: "bg-[#1F1F1F]",
  } as const;
  const labelTone = {
    cream: "text-[#6B4F3A]",
    warning: "text-[#C2410C]",
    dark: "text-[#A89D8E]",
  } as const;
  const valueTone = {
    cream: "text-[#1F1F1F]",
    warning: "text-[#C2410C]",
    dark: "text-[#FAF5EB]",
  } as const;
  const helpTone = {
    cream: "text-[#6B4F3A]",
    warning: "text-[#C2410C] font-medium",
    dark: "text-[#A89D8E]",
  } as const;

  return (
    <div className={`flex flex-col gap-2 rounded-[12px] px-5 py-4.5 ${styles[tone]}`}>
      <span
        className={`font-mono text-[10px] font-bold tracking-[0.15em] ${labelTone[tone]}`}
      >
        {label}
      </span>
      <span
        className={`font-jakarta text-[32px] font-bold leading-none tracking-[-0.015em] ${valueTone[tone]}`}
      >
        {value}
      </span>
      <span className={`font-jakarta text-[11px] ${helpTone[tone]}`}>{help}</span>
    </div>
  );
}

/* Métricas de rendimiento — ilustrativo (datos de muestra). */
function RendimientoCard() {
  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#EDE6DC] bg-white p-6 shadow-[0_6px_18px_rgba(31,31,31,0.06)]">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
          RENDIMIENTO DEL SERVICIO
        </span>
        <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
          Métricas operativas del turno
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCell
          label="TIEMPO PROM. POR MESA"
          value="42:18"
          unit="min"
          delta="-4 min vs ayer"
          deltaTone="good"
        />
        <MetricCell
          label="TIEMPO DE ENTREGA"
          value="14:52"
          unit="min"
          delta="+1:08 vs meta"
          deltaTone="warn"
        />
        <MetricCell
          label="ROTACIÓN DE MESAS"
          value="2.4"
          unit="x"
          delta="objetivo turno: 3.0x"
        />
        <MetricCell
          label="TICKET PROMEDIO"
          value="Q642"
          delta="+8.2% vs último martes"
          deltaTone="good"
        />
        <MetricCell
          label="PROPINA PROMEDIO"
          value="12.8%"
          delta="Q5,840 acumulados"
        />
        <MetricCell
          label="NIVEL DE OCUPACIÓN"
          value="76%"
          delta="hora pico estimada 21:00"
          deltaTone="warn"
          accent
        />
      </div>
    </section>
  );
}

function MetricCell({
  label,
  value,
  unit,
  delta,
  deltaTone,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  deltaTone?: "good" | "warn";
  accent?: boolean;
}) {
  const deltaColor =
    deltaTone === "good"
      ? "text-[#7C8A6A]"
      : deltaTone === "warn"
      ? "text-[#C2410C]"
      : "text-[#6B4F3A]";
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-[12px] border px-4 py-3.5 ${
        accent ? "border-[#E8B07F] bg-[#FBE7D6]" : "border-[#EDE6DC] bg-[#FAF5EB]"
      }`}
    >
      <span
        className={`font-mono text-[9px] font-bold tracking-[0.14em] ${
          accent ? "text-[#C2410C]" : "text-[#6B4F3A]"
        }`}
      >
        {label}
      </span>
      <div className="flex items-end gap-1.5">
        <span className="font-jakarta text-[28px] font-bold leading-none tracking-[-0.015em]">
          {value}
        </span>
        {unit && (
          <span className="pb-1 font-mono text-[11px] text-[#A89D8E]">
            {unit}
          </span>
        )}
      </div>
      <span className={`font-jakarta text-[11px] font-medium ${deltaColor}`}>
        {delta}
      </span>
    </div>
  );
}

/* Insight gastronómico — ilustrativo (datos de muestra). */
function InsightGastronomicoCard() {
  return (
    <section className="flex w-[380px] flex-col gap-4 rounded-[18px] bg-[#1F1F1F] p-6 shadow-[0_8px_24px_rgba(31,31,31,0.12)]">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#E8B07F]">
          INSIGHT GASTRONÓMICO
        </span>
        <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em] text-[#FAF5EB]">
          Pulso de la cocina hoy
        </h3>
      </div>

      <div className="flex flex-col gap-2 rounded-[14px] border border-[#3A322C] bg-[#1F1F1F] p-4.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#E8B07F]">
            PLATILLO MÁS VENDIDO
          </span>
          <span className="rounded-full bg-[#E67E22] px-2 py-0.5">
            <span className="font-mono text-[9px] font-bold tracking-[0.06em] text-[#1F1F1F]">
              #1
            </span>
          </span>
        </div>
        <span className="font-jakarta text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#FAF5EB]">
          Cordero al rescoldo
        </span>
        <div className="flex items-center gap-2.5">
          <span className="font-jakarta text-[12px] font-medium text-[#FAF5EB]">
            32 órdenes
          </span>
          <span className="text-[12px] text-[#6B4F3A]">·</span>
          <span className="font-jakarta text-[12px] font-semibold text-[#E8B07F]">
            Q24,640 facturados
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 rounded-[12px] bg-[#1F1F1F] px-3.5 py-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#3A322C]">
            <GlassWater className="size-4 text-[#E8B07F]" strokeWidth={1.8} />
          </span>
          <div className="flex flex-1 flex-col">
            <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#A89D8E]">
              BEBIDA MÁS PEDIDA
            </span>
            <span className="font-jakarta text-[13px] font-semibold text-[#FAF5EB]">
              Malbec Reserva Mendoza
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold tracking-[0.03em] text-[#E8B07F]">
            24 copas
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[12px] border border-[#7A2E14] bg-[#3A322C] px-3.5 py-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#7A2E14]">
            <OctagonAlert className="size-4 text-[#F4DABA]" strokeWidth={1.8} />
          </span>
          <div className="flex flex-1 flex-col">
            <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#E8B07F]">
              PRODUCTO AGOTADO
            </span>
            <span className="font-jakarta text-[13px] font-semibold text-[#F4DABA]">
              Empanadas de morcilla
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold tracking-[0.03em] text-[#E8B07F]">
            86&apos;d
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[12px] bg-[#E67E22] p-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-[#1F1F1F]" strokeWidth={2.5} />
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#1F1F1F]">
            RECOMENDACIÓN DE REPOSICIÓN
          </span>
        </div>
        <p className="font-jakarta text-[12px] font-medium leading-snug text-[#1F1F1F]">
          Pedir 2 kg de morcilla y 5 botellas Malbec antes del cierre. Hora
          pico detectada: 21:00.
        </p>
      </div>
    </section>
  );
}

/* Mapa de calor de ocupación — ilustrativo (datos de muestra). */
function HeatmapCard() {
  const rows = [
    { hour: "13H", cells: ["fbe7d6", "F4DABA", "fbe7d6", "F4DABA", "E8B07F", "E8B07F", "FAF5EB"] },
    { hour: "14H", cells: ["F4DABA", "E8B07F", "F4DABA", "E8B07F", "E67E22", "E67E22", "fbe7d6"] },
    { hour: "19H", cells: ["E8B07F", "E67E22", "E8B07F", "E67E22", "c2410c", "c2410c", "E67E22"] },
    { hour: "20H", cells: ["E67E22", "c2410c", "E67E22", "c2410c", "c2410c", "c2410c", "E67E22"], highlight: 4 },
    { hour: "21H", cells: ["E8B07F", "E67E22", "E8B07F", "E67E22", "c2410c", "c2410c", "E67E22"] },
    { hour: "22H", cells: ["fbe7d6", "F4DABA", "fbe7d6", "E8B07F", "E67E22", "E67E22", "F4DABA"] },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#EDE6DC] bg-white p-6 shadow-[0_6px_18px_rgba(31,31,31,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#6B4F3A]">
            INTENSIDAD DEL SALÓN · MAPA DE CALOR
          </span>
          <h3 className="font-jakarta text-[18px] font-semibold tracking-[-0.01em]">
            Ocupación por mesa · últimos 7 turnos
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#6B4F3A]">
            BAJA
          </span>
          <span
            className="block h-2 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #FAF5EB 0%, #FBEEE0 40%, #E67E22 80%, #A05A1A 100%)",
            }}
          />
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#6B4F3A]">
            ALTA
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5 pl-[42px]">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <span
              key={d}
              className="flex-1 text-center font-mono text-[9px] font-bold tracking-[0.1em] text-[#6B4F3A]"
            >
              {d}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.hour} className="flex items-center gap-1.5">
            <span className="w-9 font-mono text-[9px] font-bold tracking-[0.1em] text-[#6B4F3A]">
              {r.hour}
            </span>
            {r.cells.map((c, i) => (
              <span
                key={i}
                className="h-6 flex-1 rounded-md"
                style={{
                  background: `#${c}`,
                  outline: r.highlight === i ? "2px solid #1F1F1F" : undefined,
                  outlineOffset: r.highlight === i ? "-2px" : undefined,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2.5">
        <div className="flex items-center gap-2">
          <Flame className="size-3.5 text-[#E67E22]" strokeWidth={2} />
          <span className="font-jakarta text-[12px] font-semibold">
            Pico histórico: viernes 20:00
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#FAF5EB] px-2.5 py-1">
          <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#1F1F1F]">
            VER ANÁLISIS COMPLETO
          </span>
          <ArrowRight className="size-3 text-[#1F1F1F]" strokeWidth={2.5} />
        </span>
      </div>
    </section>
  );
}

function FocusQuoteCard() {
  return (
    <section className="flex w-[340px] flex-col gap-5 rounded-[18px] bg-[#1F1F1F] p-7 shadow-[0_8px_24px_rgba(31,31,31,0.12)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#E8B07F]">
          FOCUS DEL DÍA
        </span>
        <span className="rounded-full bg-[#E67E22] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.06em] text-[#1F1F1F]">
          PRIORIDAD
        </span>
      </div>

      <p className="font-jakarta text-[20px] font-semibold leading-snug tracking-[-0.015em] text-[#FAF5EB]">
        Cerrar el turno con servicio impecable y rotación de mesa fluida.
      </p>

      <div className="h-px w-full bg-[#3A322C]" />

      <div className="flex gap-2.5">
        <Quote className="mt-0.5 size-4.5 shrink-0 text-[#E67E22]" strokeWidth={2} />
        <p className="font-jakarta text-[14px] font-medium italic leading-snug text-[#FAF5EB]">
          &quot;La sala respira cuando la cocina canta.&quot;
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2.5">
        <span className="h-px w-6 bg-[#E8B07F]" />
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#E8B07F]">
          FILOSOFÍA EMBER
        </span>
      </div>

      <button className="flex items-center justify-between gap-2.5 rounded-[12px] border border-[#3A322C] bg-[#1F1F1F] px-4 py-3 hover:bg-[#251a14]">
        <div className="flex flex-col items-start">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#A89D8E]">
            REUNIÓN PRE-SERVICIO
          </span>
          <span className="font-jakarta text-[12px] font-medium text-[#FAF5EB]">
            Hoy 18:30 · Brigada completa
          </span>
        </div>
        <ArrowRight className="size-4 text-[#E8B07F]" strokeWidth={2} />
      </button>
    </section>
  );
}

/* ---------- SIDE COLUMN ---------- */

function SideColumn({ data }: { data: DashboardData }) {
  return (
    <aside className="stagger-children flex flex-col gap-5">
      <ReservasCard reservas={data.reservas} reservasHoy={data.reservasHoy} />
      <ActivityCard events={data.actividad} />
      <CierreCard />
      <AlertasCard />
      <EquipoCard />
      <InsightsAICard />
    </aside>
  );
}

function ReservasCard({
  reservas,
  reservasHoy,
}: {
  reservas: DashboardReserva[];
  reservasHoy: number;
}) {
  return (
    <SideCard>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          RESERVAS PRÓXIMAS
        </span>
        <span className="rounded-full bg-[#FBE7D6] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-[#C2410C]">
          {reservasHoy} HOY
        </span>
      </div>
      {reservas.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {reservas.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <span className="flex size-[38px] items-center justify-center rounded-full bg-[#EDE6DC]">
                <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-[#6B4F3A]">
                  {it.ini}
                </span>
              </span>
              <div className="flex flex-1 flex-col">
                <span className="font-sans text-[13px] font-semibold text-[#1F1F1F]">
                  {it.name}
                </span>
                <span className="font-sans text-[11px] text-[#A89D8E]">
                  {it.meta}
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold ${
                  it.tone === "warn"
                    ? "bg-[#FBE7D6] text-[#C2410C]"
                    : "bg-[#EDE6DC] text-[#7C8A6A]"
                }`}
              >
                {it.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="font-sans text-[12px] text-[#A89D8E]">
          Sin reservas para hoy.
        </span>
      )}
      {reservasHoy > 0 && (
        <Link href="/reservas">
          <FooterLink label={`Ver todas (${reservasHoy})`} />
        </Link>
      )}
    </SideCard>
  );
}

const ACTIVITY_ICON: Record<
  DashboardActivity["kind"],
  { Icon: typeof Utensils; color: string }
> = {
  pedido: { Icon: Utensils, color: "#E67E22" },
  preparacion: { Icon: Flame, color: "#E67E22" },
  lista: { Icon: CircleCheck, color: "#7C8A6A" },
  entregada: { Icon: ArrowRight, color: "#A89D8E" },
  reserva: { Icon: CalendarCheck, color: "#E8B07F" },
};

function ActivityCard({ events }: { events: DashboardActivity[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] bg-[#1F1F1F] p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      <div className="flex items-center gap-2.5">
        <span className="block size-2 rounded-full bg-[#7C8A6A] shadow-[0_0_6px_#7C8A6A]" />
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#A89D8E]">
          EN VIVO · ACTIVIDAD
        </span>
      </div>
      {events.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {events.map((e) => {
            const { Icon, color } = ACTIVITY_ICON[e.kind];
            return (
              <div key={e.id} className="flex items-start gap-2.5">
                <Icon
                  className="mt-0.5 size-3.5 shrink-0"
                  style={{ color }}
                  strokeWidth={2}
                />
                <span className="font-sans text-[12px] leading-snug text-[#FAF5EB]">
                  <span className="text-[#A89D8E]">{e.when} — </span>
                  {e.text}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <span className="font-sans text-[12px] text-[#A89D8E]">
          Sin actividad reciente en el servicio.
        </span>
      )}
    </div>
  );
}

/* Cierre de caja — ilustrativo (datos de muestra). */
function CierreCard() {
  return (
    <SideCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="size-3.5 text-[#C2410C]" strokeWidth={2} />
          <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
            CIERRE DE CAJA
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBE7D6] px-2.5 py-1">
          <span className="block size-1.5 rounded-full bg-[#C2410C] shadow-[0_0_5px_rgba(194,65,12,0.4)]" />
          <span className="font-sans text-[10px] font-semibold text-[#C2410C]">
            Turno en curso
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <KeyValRow label="Ventas del turno" value="Q36,180" />
        <KeyValRow label="Pagos registrados" value="142" />
        <KeyValRow label="Cuentas pendientes" value="3" valueColor="#C2410C" />
        <div className="flex items-center justify-between">
          <span className="font-sans text-[12.5px] text-[#6B4F3A]">
            Diferencia preliminar
          </span>
          <span className="font-sans text-[11.5px] font-medium italic text-[#A89D8E]">
            Pendiente de conteo
          </span>
        </div>
      </div>

      <div className="h-px bg-[#EDE6DC]" />

      <p className="font-sans text-[11.5px] leading-snug text-[#A89D8E]">
        Revisa ventas, pagos y efectivo antes de finalizar.
      </p>

      <Link
        href="/caja/cierre"
        className="flex items-center justify-center gap-2.5 rounded-[10px] bg-[#1F1F1F] px-4.5 py-3.5 shadow-[0_6px_14px_rgba(31,31,31,0.1)] hover:bg-[#0e0a08]"
      >
        <span className="block size-1.5 rounded-full bg-[#E67E22]" />
        <span className="font-jakarta text-[13.5px] font-semibold text-[#FAF5EB]">
          Cerrar caja
        </span>
        <ArrowRight className="size-3.5 text-[#FAF5EB]" strokeWidth={2} />
      </Link>

      <div className="flex items-center gap-1.5">
        <Info className="size-2.5 text-[#C2410C]" strokeWidth={2.5} />
        <span className="font-sans text-[11px] font-medium text-[#6B4F3A]">
          Hay cuentas pendientes
        </span>
      </div>
    </SideCard>
  );
}

function KeyValRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-[12.5px] text-[#6B4F3A]">{label}</span>
      <span
        className="font-mono text-[13.5px] font-semibold"
        style={{ color: valueColor || "#1F1F1F" }}
      >
        {value}
      </span>
    </div>
  );
}

/* Alertas operativas — ilustrativo (datos de muestra). */
function AlertasCard() {
  const items = [
    {
      Icon: TriangleAlert,
      title: "Pedidos demorados · 3",
      sub: "Mesas 04, 09 y 12 superan 18 min",
      action: "Resolver",
    },
    {
      Icon: TriangleAlert,
      title: "Reservas sin confirmar · 2",
      sub: "Daniel Morán · Reserva 20:00",
      action: "Ver",
    },
    {
      Icon: UserX,
      title: "Mesas sin mesero · 1",
      sub: "Mesa 14 — asignar antes del próximo turno",
      action: "Asignar",
    },
    {
      Icon: PackageX,
      title: "Productos bajos · 4",
      sub: "Pollo, Vino tinto reserva, Lima, Brie",
      action: "Ver",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E8B07F] bg-white p-5.5 shadow-[0_4px_16px_rgba(107,79,58,0.08)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          ALERTAS OPERATIVAS
        </span>
        <span className="rounded-full bg-[#c2410c] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-[#FAF5EB]">
          4
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3">
            <it.Icon className="mt-0.5 size-4 shrink-0 text-[#C2410C]" strokeWidth={2} />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-sans text-[13px] font-semibold text-[#1F1F1F]">
                {it.title}
              </span>
              <span className="font-sans text-[11px] text-[#A89D8E]">
                {it.sub}
              </span>
            </div>
            <span className="font-sans text-[11px] font-semibold text-[#C2410C]">
              {it.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Equipo activo — ilustrativo (datos de muestra). */
function EquipoCard() {
  const staff = [
    { ini: "CR", name: "Carla R.", role: "Mesera · Mesas 04, 09, 12", fill: 86, color: "#C2410C" },
    { ini: "JL", name: "Julián L.", role: "Mesero · Mesas 02, 06", fill: 60, color: "#E67E22" },
    { ini: "AS", name: "Andrea S.", role: "Mesera · Mesas 07, 11, 14", fill: 94, color: "#c2410c" },
    { ini: "PE", name: "Pablo E.", role: "Mesero · Mesas 03, 08, 13", fill: 75, color: "#E67E22" },
  ];

  return (
    <SideCard>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          EQUIPO ACTIVO · 8 PERSONAS
        </span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#FBE7D6] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-[#C2410C]">
            T1
          </span>
          <span className="rounded-full bg-[#EDE6DC] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-[#6B4F3A]">
            T2
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {staff.map((s) => (
          <div key={s.ini} className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#EDE6DC]">
              <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-[#6B4F3A]">
                {s.ini}
              </span>
            </span>
            <div className="flex flex-1 flex-col">
              <span className="font-sans text-[13px] font-semibold">{s.name}</span>
              <span className="font-sans text-[11px] text-[#A89D8E]">{s.role}</span>
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#EDE6DC]">
              <div
                className="h-full rounded-full"
                style={{ width: `${s.fill}%`, background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2.5">
        <RoleChip Icon={ChefHat} label="Cocina · 2" />
        <RoleChip Icon={DoorOpen} label="Anfitrión · 1" />
        <RoleChip Icon={Banknote} label="Caja · 1" />
      </div>

      <FooterLink label="Ver staff" />
    </SideCard>
  );
}

function RoleChip({
  Icon,
  label,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6DC] bg-[#FAF5EB] px-3 py-1.5">
      <Icon className="size-3 text-[#6B4F3A]" strokeWidth={2} />
      <span className="font-sans text-[11px] font-semibold text-[#1F1F1F]">
        {label}
      </span>
    </span>
  );
}

/* Insights AI — ilustrativo (datos de muestra). */
function InsightsAICard() {
  const items = [
    { Icon: TrendingUp, text: "La Terraza está cerca de llenarse — sugerir derivar a salón.", cta: "Aplicar", outline: true },
    { Icon: Flame, text: "El risotto va liderando ventas — mantener stock disponible.", cta: "Ver detalle" },
    { Icon: Clock, text: "3 mesas superan el tiempo promedio de servicio — revisar.", cta: "Revisar mesas" },
    { Icon: Wallet, text: "Conviene reforzar caja en 30 min según ritmo de cierre.", cta: "Programar", outline: true },
  ] as const;

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E8B07F] bg-[#F7F3EE] p-5.5 shadow-[0_4px_16px_rgba(107,79,58,0.08)]">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-[#E67E22]" strokeWidth={2} />
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#6B4F3A]">
          INSIGHTS · EMBER AI
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <it.Icon className="mt-0.5 size-3.5 shrink-0 text-[#C2410C]" strokeWidth={2} />
            <div className="flex flex-1 flex-col gap-1.5">
              <p className="font-sans text-[12px] leading-snug text-[#1F1F1F]">
                {it.text}
              </p>
              {"outline" in it && it.outline ? (
                <button className="inline-flex w-fit items-center gap-1 rounded-full border border-[#E8B07F] bg-white px-3 py-1 font-sans text-[11px] font-semibold text-[#C2410C]">
                  {it.cta}
                </button>
              ) : (
                <span className="font-sans text-[11px] font-semibold text-[#C2410C]">
                  {it.cta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Crecimiento de ticket — ilustrativo (datos de muestra). */
function MaridajeCard() {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] bg-[#1F1F1F] p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      <div className="flex items-center gap-2">
        <ArrowUpRight className="size-3.5 text-[#E8B07F]" strokeWidth={2} />
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#E8B07F]">
          CRECIMIENTO DE TICKET
        </span>
      </div>
      <h4 className="font-sans text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#FAF5EB]">
        Maridaje impecable.
      </h4>
      <p className="font-sans text-[12.5px] leading-relaxed text-[#A89D8E]">
        Cuida que cada platillo principal salga con su recomendación líquida
        sugerida. Refuerza la sugerencia en mesas de 4+ comensales para elevar
        el ticket promedio.
      </p>
      <div className="flex items-center gap-2 pt-2">
        <span className="font-sans text-[12px] font-semibold text-[#E8B07F]">
          Configurar sugerencias
        </span>
        <ArrowRight className="size-3.5 text-[#E8B07F]" strokeWidth={2} />
      </div>
    </div>
  );
}

/* ---------- COMMON ---------- */

function SideCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#EDE6DC] bg-white p-5.5 shadow-[0_4px_16px_rgba(31,31,31,0.06)]">
      {children}
    </div>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 pt-1.5">
      <span className="font-sans text-[12px] font-semibold text-[#C2410C]">
        {label}
      </span>
      <ArrowRight className="size-3.5 text-[#C2410C]" strokeWidth={2} />
    </div>
  );
}
