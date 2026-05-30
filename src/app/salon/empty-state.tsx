import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Keyboard,
  Layers,
  LayoutGrid,
  Leaf,
  MousePointerClick,
  Plus,
  Search,
} from "lucide-react";

export function EmptyState() {
  return (
    <div className="animate-page-enter flex min-h-screen w-full min-w-[1600px] flex-col bg-[#F7F3EE] font-sans text-[#1F1F1F]">
      <TopBar />
      <div className="animate-page-enter-body flex flex-1 min-h-[1028px]">
        <LeftSidebar />
        <Main />
        <RightPanel />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex h-[72px] w-full items-center justify-between border-b border-[#EDE6DC] bg-white px-7">
      <div className="flex h-full items-center gap-[18px]">
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
          <span className="block size-7 rounded-full bg-[#E67E22]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[11px] font-semibold tracking-[0.16em]">
              CASA OLIVAR
            </span>
            <span className="text-[14px] font-semibold leading-tight">Configurar salón</span>
          </div>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px]">Sáb, 02 mayo 2026</span>
          <span className="font-mono text-[11px] text-[#6B6660]">21:48</span>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <div className="flex flex-col gap-[3px]">
          <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#6B6660]">
            TURNO
          </span>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
            <span className="text-[12px] font-medium">Cena · 18:30—23:00</span>
          </div>
        </div>
      </div>

      <div className="flex h-full items-center gap-3.5">
        <div className="flex h-[38px] w-[320px] items-center gap-2 rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] px-3">
          <Search className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
          <span className="flex-1 text-[12px] text-[#6B6660]">Buscar mesa o cliente</span>
          <span className="rounded border border-[#EDE6DC] bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold">
            /
          </span>
        </div>
        <span className="h-8 w-px bg-[#EDE6DC]" />
        <Link
          href="/salon/edit"
          className="flex h-9 items-center gap-2 rounded-lg border border-[#1F1F1F] bg-white px-3.5 hover:bg-[#F7F3EE]"
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
        <div className="flex h-10 items-center gap-2.5 rounded-full bg-[#F7F3EE] p-1 pr-2.5">
          <span className="block size-8 rounded-full bg-[#6B4F3A]" />
          <div className="flex flex-col gap-px">
            <span className="text-[12px] font-semibold leading-tight">Sofía Mora</span>
            <span className="text-[10px] text-[#6B6660]">Anfitriona</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function LeftSidebar() {
  return (
    <aside className="flex w-[286px] flex-col border-r border-[#EDE6DC] bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-[#EDE6DC] px-5 py-5">
        <span className="block size-9 rounded-full bg-[#E67E22]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold leading-tight">Casa Olivar</span>
          <span className="text-[11px] text-[#6B6660]">Gestión de salón</span>
        </div>
      </div>

      {/* Zonas */}
      <section className="flex flex-col gap-3 border-b border-[#EDE6DC] px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B6660]">
            ZONAS
          </span>
          <span className="font-mono text-[11px] font-semibold text-[#6B6660]">0</span>
        </div>
        <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#EDE6DC] bg-[#f7f3ee] p-[18px]">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            <span className="text-[12px] font-semibold text-[#1F1F1F]">Aún sin zonas</span>
          </div>
          <span className="text-[11px] text-[#6B6660]">
            Crea tu primera zona para empezar a colocar mesas.
          </span>
          <button className="flex h-[34px] items-center justify-center gap-2 rounded-lg bg-[#E67E22]">
            <Plus className="size-3.5 text-white" strokeWidth={2} />
            <span className="text-[12px] font-semibold text-white">Crear zona</span>
          </button>
          <button className="flex h-[34px] items-center justify-center gap-2 rounded-lg border border-[#1F1F1F] bg-white">
            <span className="text-[12px] font-medium">Usar plantilla</span>
          </button>
        </div>
      </section>

      {/* Filtros (faded) */}
      <section className="flex flex-col gap-2.5 border-b border-[#EDE6DC] px-5 py-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B6660]">
          FILTROS POR ESTADO
        </span>
        <div className="flex flex-col gap-0.5 opacity-40">
          {["Libre", "Ocupada", "Reservada", "En cocina", "Esperando", "Limpieza"].map((label) => (
            <div
              key={label}
              className="flex h-[30px] items-center justify-between px-2"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#a89d8e]" />
                <span className="text-[12px]">{label}</span>
              </div>
              <span className="font-mono text-[11px] text-[#6B6660]">0</span>
            </div>
          ))}
        </div>
      </section>

      {/* Leyenda (faded) */}
      <section className="flex flex-col gap-2.5 border-b border-[#EDE6DC] p-5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B6660]">
          LEYENDA
        </span>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 opacity-50">
          {[
            "Libre",
            "Ocupada",
            "Reservada",
            "En cocina",
            "Esp. cuenta",
            "Limpieza",
          ].map((l) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="block size-2.5 rounded-sm bg-[#a89d8e]" />
              <span className="text-[11px]">{l}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="px-5 py-[18px]">
        <span className="text-[10px] italic text-[#6B6660]">
          Los filtros se activarán al crear mesas
        </span>
      </div>
    </aside>
  );
}

function Main() {
  return (
    <main className="flex flex-1 flex-col bg-[#F7F3EE]">
      {/* Sub-Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-white px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 opacity-55">
            <Layers className="size-3.5 text-[#6B6660]" strokeWidth={1.8} />
            <span className="text-[13px] font-medium">Salón principal</span>
            <span className="text-[13px] text-[#6B6660]">·</span>
            <span className="font-mono text-[11px] text-[#6B6660]">0 mesas</span>
          </div>
          <span className="h-6 w-px bg-[#EDE6DC]" />
          <div className="flex items-center gap-2 rounded-full border border-[#EDE6DC] bg-[#f7f3ee] px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-[#7C8A6A]" />
            <span className="text-[11px] font-medium">Listo para configurar</span>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] text-[#6B6660]">Aforo —/—</span>
          <div className="flex items-center gap-0.5 rounded-lg border border-[#EDE6DC] bg-[#F7F3EE] p-[3px]">
            <button className="flex items-center gap-1.5 rounded-md border border-[#EDE6DC] bg-white px-3 py-1.5">
              <span className="text-[12px] font-medium">Plano</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5">
              <span className="text-[12px] text-[#6B6660]">Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 p-6">
        <EmptyCanvas />
      </div>
    </main>
  );
}

function EmptyCanvas() {
  return (
    <div className="relative h-[920px] w-[920px] overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#f7f3ee]">
      {/* Grid */}
      {[120, 240, 360, 480, 600, 720, 840].map((x) => (
        <div
          key={`v${x}`}
          className="absolute top-0 h-[916px] w-px bg-[#ede6dc] opacity-50"
          style={{ left: x }}
        />
      ))}
      {[120, 240, 360, 480, 600, 720, 840].map((y) => (
        <div
          key={`h${y}`}
          className="absolute left-0 h-px w-[922px] bg-[#ede6dc] opacity-50"
          style={{ top: y }}
        />
      ))}

      {/* Zone outlines (dashed-feel via thin border) */}
      <div
        className="absolute border border-[#d8cec2] opacity-70"
        style={{ left: 40, top: 60, width: 520, height: 380 }}
      />
      <div
        className="absolute border border-[#d8cec2] opacity-70"
        style={{ left: 600, top: 60, width: 280, height: 200 }}
      />
      <div
        className="absolute border border-[#d8cec2] opacity-70"
        style={{ left: 600, top: 300, width: 280, height: 140 }}
      />

      {/* Zone labels */}
      <span
        className="absolute font-mono text-[9px] font-semibold tracking-[0.16em] text-[#a89d8e]"
        style={{ left: 52, top: 44 }}
      >
        ZONA SALÓN PRINCIPAL
      </span>
      <span
        className="absolute font-mono text-[9px] font-semibold tracking-[0.16em] text-[#a89d8e]"
        style={{ left: 612, top: 44 }}
      >
        ZONA TERRAZA
      </span>
      <span
        className="absolute font-mono text-[9px] font-semibold tracking-[0.16em] text-[#a89d8e]"
        style={{ left: 612, top: 284 }}
      >
        ZONA BARRA
      </span>

      {/* Ghost tables */}
      <div
        className="absolute rounded-full border border-[#d8cec2] opacity-60"
        style={{ left: 100, top: 120, width: 56, height: 56 }}
      />
      <span
        className="absolute font-mono text-[10px] text-[#a89d8e] opacity-70"
        style={{ left: 118, top: 140 }}
      >
        4p?
      </span>
      <div
        className="absolute rounded border border-[#d8cec2] opacity-60"
        style={{ left: 220, top: 340, width: 90, height: 48 }}
      />
      <span
        className="absolute font-mono text-[10px] text-[#a89d8e] opacity-70"
        style={{ left: 252, top: 354 }}
      >
        6p?
      </span>
      <div
        className="absolute rounded-full border border-[#d8cec2] opacity-60"
        style={{ left: 650, top: 140, width: 48, height: 48 }}
      />
      <span
        className="absolute font-mono text-[10px] text-[#a89d8e] opacity-70"
        style={{ left: 662, top: 156 }}
      >
        2p?
      </span>
      <div
        className="absolute rounded border border-[#d8cec2] opacity-60"
        style={{ left: 760, top: 155, width: 80, height: 32 }}
      />
      <span
        className="absolute font-mono text-[10px] text-[#a89d8e] opacity-70"
        style={{ left: 786, top: 163 }}
      >
        4p?
      </span>
      <div
        className="absolute rounded border border-[#d8cec2] opacity-60"
        style={{ left: 640, top: 340, width: 200, height: 24 }}
      />
      <span
        className="absolute font-mono text-[9px] text-[#a89d8e] opacity-70"
        style={{ left: 720, top: 344 }}
      >
        BARRA · 8p?
      </span>

      {/* Pasillo line */}
      <div
        className="absolute h-px bg-[#6B4F3A] opacity-[0.18]"
        style={{ left: 40, top: 520, width: 840 }}
      />
      <span
        className="absolute font-mono text-[8px] tracking-[0.16em] text-[#a89d8e] opacity-70"
        style={{ left: 160, top: 740 }}
      >
        PASILLO
      </span>
      <div
        className="absolute h-px bg-[#6B4F3A] opacity-[0.15]"
        style={{ left: 130, top: 760, width: 680 }}
      />

      {/* Entrada */}
      <div
        className="absolute flex items-center gap-1.5 rounded border border-[#EDE6DC] bg-white px-2 py-1 opacity-85"
        style={{ left: 40, top: 870 }}
      >
        <svg className="size-3 text-[#6B4F3A]" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14M13 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
          ENTRADA
        </span>
      </div>

      {/* Leaves */}
      <Leaf
        className="absolute text-[#7C8A6A] opacity-45"
        style={{ left: 30, top: 30, width: 18, height: 18 }}
        strokeWidth={1.8}
      />
      <Leaf
        className="absolute text-[#7C8A6A] opacity-45"
        style={{ left: 870, top: 870, width: 18, height: 18 }}
        strokeWidth={1.8}
      />

      {/* Zoom */}
      <div
        className="absolute flex flex-col rounded-lg border border-[#EDE6DC] bg-white shadow-[0_2px_6px_rgba(31,31,31,0.06)]"
        style={{ left: 864, top: 680 }}
      >
        <button className="flex size-8 items-center justify-center border-b border-[#EDE6DC]">
          <Plus className="size-3.5 text-[#1F1F1F]" strokeWidth={2} />
        </button>
        <button className="flex size-8 items-center justify-center border-b border-[#EDE6DC]">
          <span className="font-mono text-[10px] font-semibold">100</span>
        </button>
        <button className="flex size-8 items-center justify-center">
          <ChevronDown className="size-3.5 text-[#1F1F1F]" strokeWidth={2} />
        </button>
      </div>

      {/* Shortcut chip */}
      <div
        className="absolute flex items-center gap-2 rounded-full border border-[#EDE6DC] bg-white px-2.5 py-1.5 shadow-[0_2px_6px_rgba(31,31,31,0.07)]"
        style={{ left: 680, top: 870 }}
      >
        <Keyboard className="size-3 text-[#6B4F3A]" strokeWidth={1.8} />
        <span className="text-[10px] font-medium">Atajos disponibles</span>
        <span className="font-mono text-[10px] font-semibold text-[#6B4F3A]">? · N · Z</span>
      </div>

      {/* Center modal */}
      <div
        className="absolute flex flex-col items-center gap-4 rounded-2xl border border-[#EDE6DC] bg-white p-[38px] shadow-[0_8px_24px_rgba(31,31,31,0.07)]"
        style={{ left: 221, top: 230, width: 480 }}
      >
        <div className="flex size-[88px] items-center justify-center rounded-2xl bg-[#f7f3ee]">
          <LayoutGrid className="size-9 text-[#E67E22]" strokeWidth={1.6} />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#f7f3ee] px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-[#E67E22]" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            PRIMER PASO · CONFIGURACIÓN
          </span>
        </div>
        <h2 className="text-center text-[22px] font-semibold leading-tight">
          Tu salón aún no ha sido configurado
        </h2>
        <p className="max-w-[400px] text-center text-[13px] leading-[1.5] text-[#6B6660]">
          Crea zonas, agrega mesas y organiza la distribución de tu restaurante para comenzar a operar en tiempo real.
        </p>
        <div className="flex items-center gap-2.5">
          <Link
            href="/salon/edit"
            className="flex items-center gap-2 rounded-lg bg-[#E67E22] px-4 py-2.5"
          >
            <Plus className="size-3.5 text-white" strokeWidth={2.2} />
            <span className="text-[12.5px] font-semibold text-white">Agregar primera zona</span>
          </Link>
          <button className="flex items-center gap-2 rounded-lg border border-[#1F1F1F] bg-white px-4 py-2.5">
            <span className="text-[12.5px] font-semibold">Crear mesa</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[11px] text-[#6B6660]">¿Prefieres empezar desde una</span>
          <span className="text-[11px] font-semibold text-[#C2410C]">plantilla de salón</span>
          <span className="text-[11px] text-[#6B6660]">?</span>
        </div>
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <aside className="flex w-[344px] flex-col items-center justify-center gap-[18px] border-l border-[#EDE6DC] bg-white p-8 text-center">
      <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B6660]">
        PANEL DE MESA
      </span>

      {/* Illustration */}
      <div className="relative size-[160px]">
        <div className="absolute inset-0 rounded-full bg-[#f7f3ee]" />
        <div
          className="absolute rounded-full border-[1.5px] border-[#E67E22] bg-white"
          style={{ left: 50, top: 50, width: 60, height: 60 }}
        />
        {[
          { left: 14, top: 78 },
          { left: 136, top: 78 },
          { left: 78, top: 14 },
          { left: 78, top: 136 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute size-2.5 rounded-full bg-[#D8CEC2] opacity-70"
            style={{ left: p.left, top: p.top }}
          />
        ))}
        <div
          className="absolute flex size-[30px] items-center justify-center rounded-full border border-[#EDE6DC] bg-white shadow-[0_2px_4px_rgba(31,31,31,0.1)]"
          style={{ left: 96, top: 36 }}
        >
          <MousePointerClick className="size-3.5 text-[#E67E22]" strokeWidth={2} />
        </div>
      </div>

      <h3 className="text-[17px] font-semibold">Ninguna mesa seleccionada</h3>
      <p className="max-w-[280px] text-[12px] leading-[1.5] text-[#6B6660]">
        Selecciona o crea una mesa para ver aquí su información, pedidos y acciones disponibles.
      </p>

      <div className="h-px w-[200px] bg-[#EDE6DC]" />

      <div className="flex w-full flex-col gap-2">
        <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#1F1F1F] bg-white">
          <Plus className="size-3.5" strokeWidth={2} />
          <span className="text-[12px] font-semibold">Crear mesa</span>
        </button>
        <button className="flex h-10 items-center justify-center gap-2 rounded-lg">
          <BookOpen className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] font-medium text-[#6B4F3A]">Ver guía rápida</span>
        </button>
      </div>

      <span className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#7C8A6A]">
        TIP · PULSA E PARA EDITAR EL LAYOUT
      </span>
    </aside>
  );
}
