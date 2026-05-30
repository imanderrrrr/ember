import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  List,
  Mail,
  Minus,
  MoreVertical,
  Phone,
  Plus,
  Search,
  TriangleAlert,
  Users,
} from "lucide-react";

type Status = "libre" | "ocupada" | "reservada" | "cocina" | "esperando" | "limpieza" | "pending";

const COLOR: Record<Status, string> = {
  libre: "#7c8a6a",
  ocupada: "#C95A3D",
  reservada: "#D8A641",
  cocina: "#4E7DA6",
  esperando: "#7D5BA6",
  limpieza: "#a89d8e",
  pending: "#D8CEC2",
};

export function PartiallyConfigured() {
  return (
    <div className="animate-page-enter flex min-h-screen w-full min-w-[1600px] flex-col bg-[#F7F3EE] font-sans text-[#1F1F1F]">
      <PpTopBar />
      <div className="animate-page-enter-body flex flex-1 min-h-[1016px]">
        <PpLeftSidebar />
        <PpMain />
        <PpRightDetail />
      </div>
    </div>
  );
}

function PpTopBar() {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#EDE6DC] bg-white px-7">
      <div className="flex h-full items-center gap-5">
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
          <span className="block size-7 rounded-md bg-[#E67E22]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#1F1F1F]">
              CASA OLIVAR
            </span>
            <span className="text-[14px] font-semibold leading-tight">Salón en vivo</span>
          </div>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <div className="flex flex-col gap-px">
          <span className="text-[11px]">Dom, 03 mayo 2026</span>
          <span className="font-mono text-[11px] text-[#6B6660]">17:42 — Cena</span>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2 rounded-full border border-[#E8B07F] bg-[#FBE7D6] px-3 py-1.5">
          <TriangleAlert className="size-3 text-[#C2410C]" strokeWidth={2} />
          <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#C2410C]">
            DISTRIBUCIÓN PARCIALMENTE CONFIGURADA
          </span>
        </div>
      </div>

      <div className="flex h-full items-center gap-3">
        <div className="flex h-9 w-[280px] items-center gap-2 rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-3">
          <Search className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
          <span className="flex-1 text-[12px] text-[#6B6660]">Buscar mesa o cliente</span>
        </div>
        <Link
          href="/salon/edit"
          className="flex h-9 items-center gap-2 rounded-lg border border-[#1F1F1F] bg-white px-3.5"
        >
          <LayoutGrid className="size-3.5" strokeWidth={1.8} />
          <span className="text-[12px] font-medium">Modo edición</span>
        </Link>
        <Link
          href="/reservas/nueva"
          className="flex h-9 items-center gap-2 rounded-lg bg-[#E67E22] px-4"
        >
          <Plus className="size-3.5 text-white" strokeWidth={2.2} />
          <span className="text-[12px] font-semibold text-white">Nueva reserva</span>
        </Link>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2.5">
          <span className="block size-8 rounded-full bg-[#6B4F3A]" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold leading-tight">Sofía Mora</span>
            <span className="text-[10px] text-[#6B6660]">Anfitriona</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function PpLeftSidebar() {
  return (
    <aside className="flex w-[268px] flex-col border-r border-[#EDE6DC] bg-[#F7F3EE]">
      <div className="flex items-center gap-3 border-b border-[#EDE6DC] px-5 py-5">
        <span className="block size-9 rounded-full bg-[#E67E22]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold leading-tight">Casa Olivar</span>
          <span className="text-[10px] text-[#6B6660]">Configuración en curso</span>
        </div>
      </div>

      {/* Progress card */}
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            PROGRESO
          </span>
          <span className="font-mono text-[10px] font-semibold text-[#C2410C]">62%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE6DC]">
          <div
            className="h-full rounded-full"
            style={{ width: "62%", background: "linear-gradient(90deg, #E67E22, #C2410C)" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Zonas configuradas", done: true },
            { label: "Mesas creadas", done: true },
            { label: "Asignar meseros", done: false },
            { label: "Definir horarios", done: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              {s.done ? (
                <CheckCircle2 className="size-3.5 text-[#7C8A6A]" strokeWidth={2} />
              ) : (
                <span className="size-3.5 rounded-full border border-[#D8CEC2]" />
              )}
              <span
                className={`text-[11.5px] ${s.done ? "text-[#1F1F1F]" : "text-[#6B6660]"}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Zones */}
      <section className="flex flex-col gap-2.5 border-b border-[#EDE6DC] p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            ZONAS
          </span>
          <span className="font-mono text-[10px] text-[#6B6660]">2 / 4</span>
        </div>
        <button className="flex items-center gap-2.5 rounded-lg bg-[#E67E2214] px-3 py-2.5">
          <span className="h-7 w-[3px] rounded-sm bg-[#E67E22]" />
          <div className="flex flex-1 flex-col items-start gap-px">
            <span className="text-[12.5px] font-semibold">Salón principal</span>
            <span className="font-mono text-[10px] text-[#6B6660]">8 / 12 mesas</span>
          </div>
          <span className="text-[10px] font-semibold text-[#C2410C]">activa</span>
        </button>
        <button className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 pl-[15px] hover:bg-[#EDE6DC]/40">
          <div className="flex flex-1 flex-col items-start gap-px">
            <span className="text-[12.5px]">Terraza</span>
            <span className="font-mono text-[10px] text-[#6B6660]">3 / 6 mesas</span>
          </div>
        </button>
        <button className="flex items-center gap-2.5 rounded-lg border border-dashed border-[#D8CEC2] px-3 py-2.5">
          <Plus className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#6B4F3A]">Pendiente · Barra</span>
        </button>
        <button className="flex items-center gap-2.5 rounded-lg border border-dashed border-[#D8CEC2] px-3 py-2.5">
          <Plus className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#6B4F3A]">Pendiente · VIP</span>
        </button>
      </section>

      {/* Pending tasks */}
      <section className="flex flex-col gap-3 border-b border-[#EDE6DC] p-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
          PENDIENTES
        </span>
        {[
          { Icon: Users, text: "Asigna meseros a 4 mesas" },
          { Icon: Clock, text: "Define horarios de servicio" },
          { Icon: Layers, text: "Crea zona Barra" },
        ].map((it) => (
          <div key={it.text} className="flex items-start gap-2.5">
            <it.Icon className="mt-0.5 size-3.5 shrink-0 text-[#C2410C]" strokeWidth={1.8} />
            <span className="text-[11.5px] leading-snug">{it.text}</span>
          </div>
        ))}
      </section>

      <div className="flex-1" />
      <div className="px-5 pb-5 pt-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1F1F1F] px-3 py-2.5">
          <span className="text-[12px] font-semibold text-[#FAF5EB]">Continuar configuración</span>
          <ArrowRight className="size-3.5 text-[#FAF5EB]" strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}

function PpMain() {
  return (
    <main className="flex flex-1 flex-col bg-[#F7F3EE]">
      {/* Sub-header */}
      <div className="flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-[#F7F3EE] px-7">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[14px] font-semibold">Vista general</span>
            <span className="text-[12px] text-[#6B6660]">· 11 mesas configuradas</span>
          </div>
          <span className="h-6 w-px bg-[#EDE6DC]" />
          <div className="flex items-center gap-2 rounded-full bg-[#FBE7D6] px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-[#C2410C]" />
            <span className="text-[11px] font-medium text-[#C2410C]">Configuración parcial</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2">
            <Users className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="font-mono text-[12px] font-semibold">14 / 56</span>
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-[#EDE6DC] bg-white p-[3px]">
            <button className="flex items-center gap-1.5 rounded-md bg-[#1F1F1F] px-3 py-1.5">
              <LayoutDashboard className="size-3 text-white" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-white">Plano</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5">
              <List className="size-3 text-[#6B6660]" strokeWidth={2} />
              <span className="text-[12px] text-[#6B6660]">Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 p-6">
        <PpCanvas />
      </div>

      {/* Footer banner */}
      <div className="flex items-center justify-between border-t border-[#EDE6DC] bg-white px-7 py-3.5">
        <div className="flex items-center gap-3">
          <TriangleAlert className="size-4 text-[#C2410C]" strokeWidth={2} />
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold">El salón ya está casi listo</span>
            <span className="text-[11.5px] text-[#6B6660]">
              4 mesas sin mesero asignado · 1 zona pendiente · horarios por definir
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="rounded-lg px-3 py-2 text-[12px] font-medium text-[#6B4F3A]">
            Ver detalles
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[#E67E22] px-4 py-2.5">
            <span className="text-[12px] font-semibold text-white">Continuar configuración</span>
            <ArrowRight className="size-3.5 text-white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </main>
  );
}

function PpCanvas() {
  const tables: { num: string; status: Status; shape: "round" | "rect"; x: number; y: number; w: number; h: number }[] = [
    { num: "01", status: "libre", shape: "round", x: 80, y: 120, w: 80, h: 80 },
    { num: "02", status: "reservada", shape: "round", x: 230, y: 120, w: 80, h: 80 },
    { num: "03", status: "libre", shape: "rect", x: 80, y: 280, w: 64, h: 64 },
    { num: "04", status: "reservada", shape: "rect", x: 215, y: 280, w: 130, h: 64 },
    { num: "05", status: "libre", shape: "round", x: 450, y: 120, w: 80, h: 80 },
    { num: "06", status: "libre", shape: "round", x: 600, y: 110, w: 100, h: 100 },
    { num: "07", status: "ocupada", shape: "rect", x: 120, y: 430, w: 160, h: 70 },
    { num: "T1", status: "libre", shape: "round", x: 720, y: 140, w: 72, h: 72 },
    { num: "T2", status: "libre", shape: "rect", x: 720, y: 280, w: 100, h: 64 },
    { num: "T3", status: "libre", shape: "round", x: 580, y: 460, w: 72, h: 72 },
  ];
  const pending: { x: number; y: number; w: number; h: number }[] = [
    { x: 350, y: 430, w: 130, h: 80 },
    { x: 100, y: 600, w: 200, h: 90 },
    { x: 380, y: 600, w: 180, h: 90 },
    { x: 600, y: 600, w: 160, h: 90 },
  ];

  return (
    <div className="relative h-[900px] w-[920px] overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#f7f3ee]">
      {/* Grid */}
      {[140, 280, 420, 560, 700, 840].map((x) => (
        <div
          key={`v${x}`}
          className="absolute top-0 h-[900px] w-px bg-[#ede6dc] opacity-50"
          style={{ left: x }}
        />
      ))}
      {[140, 280, 420, 560, 700, 840].map((y) => (
        <div
          key={`h${y}`}
          className="absolute left-0 h-px w-[920px] bg-[#ede6dc] opacity-50"
          style={{ top: y }}
        />
      ))}

      {/* Zone divider */}
      <div className="absolute top-[100px] h-[600px] w-px bg-[#d8cec2] opacity-70" style={{ left: 690 }} />
      <span
        className="absolute font-mono text-[9px] font-semibold tracking-[0.16em] text-[#a89d8e]"
        style={{ left: 24, top: 28 }}
      >
        SALÓN PRINCIPAL · CONFIGURADA
      </span>
      <span
        className="absolute font-mono text-[9px] font-semibold tracking-[0.16em] text-[#a89d8e]"
        style={{ left: 710, top: 28 }}
      >
        TERRAZA · CONFIGURADA
      </span>

      {/* Tables */}
      {tables.map((t) => (
        <div
          key={t.num}
          className="absolute flex items-center justify-center bg-white shadow-[0_2px_8px_rgba(31,31,31,0.06)]"
          style={{
            left: t.x,
            top: t.y,
            width: t.w,
            height: t.h,
            borderRadius: t.shape === "round" ? 9999 : 8,
            border: `2px solid ${COLOR[t.status]}`,
          }}
        >
          <span className="font-mono text-[16px] font-semibold leading-none">{t.num}</span>
        </div>
      ))}

      {/* Pending placeholders */}
      {pending.map((p, i) => (
        <div
          key={`p${i}`}
          className="absolute flex items-center justify-center rounded-lg border-2 border-dashed border-[#D8CEC2] bg-[#f7f3ee]"
          style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
        >
          <div className="flex items-center gap-1.5 text-[#a89d8e]">
            <Plus className="size-3.5" strokeWidth={2} />
            <span className="font-mono text-[10px] font-semibold tracking-[0.14em]">
              AGREGAR MESA
            </span>
          </div>
        </div>
      ))}

      {/* Pending zone overlay */}
      <div
        className="absolute flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#D8CEC2] bg-[#f7f3ee]/60"
        style={{ left: 580, top: 760, width: 280, height: 110 }}
      >
        <Plus className="size-4 text-[#a89d8e]" strokeWidth={2} />
        <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#a89d8e]">
          ZONA PENDIENTE · BARRA
        </span>
        <button className="text-[11px] font-semibold text-[#C2410C]">Configurar ahora →</button>
      </div>

      {/* Zoom */}
      <div
        className="absolute flex flex-col items-center rounded-lg border border-[#EDE6DC] bg-white shadow-[0_4px_12px_rgba(31,31,31,0.08)]"
        style={{ left: 854, top: 736, width: 36, height: 130 }}
      >
        <button className="flex flex-1 items-center justify-center">
          <Plus className="size-3.5" strokeWidth={2} />
        </button>
        <div className="h-px w-6 bg-[#EDE6DC]" />
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-[10px] font-semibold">100</span>
        </div>
        <div className="h-px w-6 bg-[#EDE6DC]" />
        <button className="flex flex-1 items-center justify-center">
          <Minus className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function PpRightDetail() {
  return (
    <aside className="flex w-[344px] flex-col border-l border-[#EDE6DC] bg-[#F7F3EE]">
      {/* Mesa header */}
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
              MESA
            </span>
            <span className="font-mono text-[42px] font-medium leading-none">04</span>
            <div className="flex w-fit items-center gap-1.5 rounded-full bg-[#D8A641] px-2.5 py-[5px]">
              <span className="size-1.5 rounded-full bg-[#F7F3EE]" />
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#1F1F1F]">
                RESERVADA
              </span>
            </div>
          </div>
          <button className="flex size-8 items-center justify-center rounded-lg border border-[#EDE6DC]">
            <MoreVertical className="size-4 text-[#6B4F3A]" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 border-b border-[#EDE6DC] px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">CAPACIDAD</span>
          <span className="text-[12px] font-medium">6 personas</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6B6660]">LLEGA</span>
          <span className="font-mono text-[12px] font-medium">20:30 — en 2h 48m</span>
        </div>
      </div>

      {/* Reserva */}
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          RESERVA
        </span>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#EDE6DC]">
            <span className="font-mono text-[12px] font-semibold text-[#6B4F3A]">FM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold">Familia Mendoza</span>
            <span className="text-[11px] text-[#6B6660]">Cliente recurrente</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <InfoRow Icon={Phone} text="+502 5512 4498" />
          <InfoRow Icon={Mail} text="familia.mendoza@gmail.com" />
          <InfoRow Icon={Calendar} text="Aniversario · 25 años" />
        </div>
      </div>

      {/* Mesero pendiente */}
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] px-6 py-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          ASIGNACIONES
        </span>
        <div className="flex items-center justify-between rounded-lg bg-[#FBE7D6] p-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-3.5 text-[#C2410C]" strokeWidth={2} />
            <span className="text-[12px] font-medium text-[#C2410C]">Sin mesero asignado</span>
          </div>
          <button className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
            Asignar
          </button>
        </div>
        <div className="flex items-center justify-between text-[11.5px] text-[#6B6660]">
          <span>Tiempo estimado en mesa</span>
          <span className="font-mono">120 min</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3 px-6 py-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          ACCIONES
        </span>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-[#1F1F1F] px-3 py-3">
          <span className="text-[12px] font-semibold text-[#FAF5EB]">Confirmar reserva</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-2.5 text-[12px]">
            Modificar
          </button>
          <button className="rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-2.5 text-[12px]">
            Reasignar mesa
          </button>
        </div>
      </div>
    </aside>
  );
}

function InfoRow({
  Icon,
  text,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
      <span className="text-[12px]">{text}</span>
    </div>
  );
}
