import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function SkeletonLoading() {
  return (
    <div className="animate-page-enter flex min-h-screen w-full min-w-[1600px] flex-col bg-[#F7F3EE] font-sans">
      <SkTopBar />
      <div className="animate-page-enter-body flex flex-1 min-h-[1028px]">
        <SkLeft />
        <SkMain />
        <SkRight />
      </div>
      <BottomLoadingPill />
    </div>
  );
}

function Bar({ w, h = 10, light }: { w: number | string; h?: number; light?: boolean }) {
  return (
    <span
      className={`block rounded-full ${light ? "bg-[#EDE6DC]" : "bg-[#D8CEC2]"}`}
      style={{ width: w, height: h }}
    />
  );
}

function Block({ w, h, rounded = 8, light }: { w: number | string; h: number; rounded?: number; light?: boolean }) {
  return (
    <span
      className={`block ${light ? "bg-[#EDE6DC]" : "bg-[#D8CEC2]"}`}
      style={{ width: w, height: h, borderRadius: rounded }}
    />
  );
}

function SkTopBar() {
  return (
    <header className="flex h-[72px] w-full items-center justify-between border-b border-[#EDE6DC] bg-white px-7">
      <div className="flex items-center gap-4">
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
        <span className="block size-7 rounded-full bg-[#D8CEC2]" />
        <div className="flex flex-col gap-2">
          <Bar w={120} />
          <Bar w={88} light />
        </div>
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <Bar w={160} />
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <Bar w={140} light />
      </div>
      <div className="flex items-center gap-3.5">
        <Block w={320} h={38} rounded={10} light />
        <Block w={120} h={36} rounded={10} light />
        <Block w={148} h={36} rounded={10} />
        <span className="block size-9 rounded-full bg-[#D8CEC2]" />
      </div>
    </header>
  );
}

function SkLeft() {
  return (
    <aside className="flex w-[286px] flex-col border-r border-[#EDE6DC] bg-white">
      <div className="flex items-center gap-3 border-b border-[#EDE6DC] p-5">
        <span className="block size-9 rounded-full bg-[#D8CEC2]" />
        <div className="flex flex-col gap-2">
          <Bar w={120} />
          <Bar w={80} light />
        </div>
      </div>

      <section className="flex flex-col gap-3 border-b border-[#EDE6DC] p-5">
        <div className="flex items-center justify-between">
          <Bar w={50} light />
          <Bar w={20} light />
        </div>
        {[80, 88, 76, 92].map((w, i) => (
          <div
            key={i}
            className="flex h-11 items-center gap-2.5 rounded-lg bg-[#f7f3ee] px-3"
          >
            <Bar w={w} />
            <div className="flex-1" />
            <Bar w={28} h={6} light />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2.5 border-b border-[#EDE6DC] p-5">
        <Bar w={100} light />
        {[60, 80, 70, 90, 75, 65].map((w, i) => (
          <div key={i} className="flex h-7 items-center gap-2.5 px-2">
            <span className="size-2 rounded-full bg-[#D8CEC2]" />
            <Bar w={w} light />
            <div className="flex-1" />
            <Bar w={18} h={8} light />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2.5 border-b border-[#EDE6DC] p-5">
        <Bar w={50} light />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-[#D8CEC2]" />
              <Bar w={36} h={6} light />
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />
      <div className="px-5 pb-5 pt-3">
        <Bar w={180} light />
      </div>
    </aside>
  );
}

function SkMain() {
  return (
    <main className="flex flex-1 flex-col bg-[#F7F3EE]">
      {/* Sub Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-[#F7F3EE] px-7">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <Block w={14} h={14} rounded={3} light />
            <Bar w={120} />
          </div>
          <span className="h-6 w-px bg-[#EDE6DC]" />
          <Block w={140} h={26} rounded={999} light />
        </div>
        <div className="flex items-center gap-3">
          <Bar w={100} light />
          <Block w={120} h={32} rounded={8} light />
        </div>
      </div>

      {/* Canvas with ghost mesas */}
      <div className="flex flex-1 p-6">
        <div className="relative h-[900px] w-[920px] overflow-hidden rounded-lg border border-[#EDE6DC] bg-[#f7f3ee]">
          {/* Grid */}
          {[120, 240, 360, 480, 600, 720, 840].map((x) => (
            <div key={`v${x}`} className="absolute top-0 h-[900px] w-px bg-[#ede6dc] opacity-50" style={{ left: x }} />
          ))}
          {[120, 240, 360, 480, 600, 720, 840].map((y) => (
            <div key={`h${y}`} className="absolute left-0 h-px w-[920px] bg-[#ede6dc] opacity-50" style={{ top: y }} />
          ))}

          {/* Section labels */}
          <span
            className="absolute font-mono text-[9px] font-semibold tracking-[0.16em] text-[#a89d8e] opacity-70"
            style={{ left: 60, top: 28 }}
          >
            ZONA VENTANAL
          </span>
          <span
            className="absolute font-mono text-[9px] font-semibold tracking-[0.16em] text-[#a89d8e] opacity-70"
            style={{ left: 450, top: 28 }}
          >
            ZONA INTERIOR
          </span>

          {/* Skeleton round mesas */}
          {[
            { x: 80, y: 130, r: 80 },
            { x: 250, y: 130, r: 80 },
            { x: 450, y: 130, r: 80 },
            { x: 600, y: 130, r: 100 },
            { x: 450, y: 430, r: 80 },
            { x: 740, y: 430, r: 80 },
            { x: 150, y: 600, r: 100 },
          ].map((m, i) => (
            <div
              key={`r${i}`}
              className="absolute rounded-full bg-white"
              style={{
                left: m.x,
                top: m.y,
                width: m.r,
                height: m.r,
                border: "2px solid #EDE6DC",
                boxShadow: "0 2px 6px rgba(31,31,31,0.04)",
              }}
            >
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Bar w={24} h={8} light />
              </span>
            </div>
          ))}

          {/* Skeleton rect mesas */}
          {[
            { x: 88, y: 308, w: 64, h: 64 },
            { x: 215, y: 308, w: 130, h: 64 },
            { x: 758, y: 148, w: 64, h: 64 },
            { x: 120, y: 445, w: 160, h: 70 },
            { x: 608, y: 448, w: 64, h: 64 },
            { x: 340, y: 620, w: 200, h: 80 },
          ].map((m, i) => (
            <div
              key={`x${i}`}
              className="absolute bg-white"
              style={{
                left: m.x,
                top: m.y,
                width: m.w,
                height: m.h,
                borderRadius: 8,
                border: "2px solid #EDE6DC",
                boxShadow: "0 2px 6px rgba(31,31,31,0.04)",
              }}
            >
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Bar w={28} h={8} light />
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function SkRight() {
  return (
    <aside className="flex w-[344px] flex-col border-l border-[#EDE6DC] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] p-6">
        <Bar w={120} light />
        <Bar w={180} />
        <Bar w={90} light />
      </div>
      <div className="grid grid-cols-3 gap-3 border-b border-[#EDE6DC] p-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Bar w={60} h={6} light />
            <Bar w={70} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] p-6">
        <Bar w={110} light />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Bar w={20} h={8} light />
            <Bar w={120} />
            <div className="flex-1" />
            <Bar w={50} h={8} light />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-b border-[#EDE6DC] p-6">
        <Bar w={130} light />
        <Block w="100%" h={48} rounded={10} light />
      </div>
      <div className="flex flex-col gap-3 p-6">
        <Bar w={140} light />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} w="100%" h={40} rounded={8} light />
          ))}
        </div>
      </div>
    </aside>
  );
}

function BottomLoadingPill() {
  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full bg-[#1F1F1F] px-4 py-2.5 shadow-[0_8px_20px_rgba(31,31,31,0.18)]">
        <span className="flex items-center gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-[#E67E22]" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#E67E22] [animation-delay:0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#E67E22] [animation-delay:0.3s]" />
        </span>
        <span className="text-[12px] font-medium text-[#FAF5EB]">
          Cargando salón y mesas activas...
        </span>
      </div>
    </div>
  );
}
