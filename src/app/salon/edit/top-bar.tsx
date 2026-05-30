"use client";

import { useRouter } from "next/navigation";
import { Check, CircleAlert, Loader2, LogOut, Pencil } from "lucide-react";
import type { SaveStatus } from "./editor";

/**
 * Barra superior del editor.
 *
 * Muestra branding, indicador de "Modo edición" activo, estado de autosave
 * y un botón para volver al modo en vivo. El botón usa router.refresh()
 * para invalidar el router cache de Next y forzar que /salon re-fetcheé
 * el floor plan recién editado.
 */
export function EditorTopBar({ saveStatus }: { saveStatus: SaveStatus }) {
  const router = useRouter();

  function exitToLive() {
    router.push("/salon");
    router.refresh();
  }

  return (
    <header className="flex h-[72px] w-full items-center justify-between border-b border-[#EDE6DC] bg-white px-7">
      <div className="flex items-center gap-[18px]">
        <button
          type="button"
          onClick={exitToLive}
          className="flex items-center gap-2 rounded-[10px] border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-2 hover:bg-white"
          aria-label="Volver al salón en vivo"
          title="Volver al salón en vivo"
        >
          <LogOut className="size-3.5 text-[#6B4F3A] rotate-180" strokeWidth={2} />
          <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            VOLVER AL SALÓN
          </span>
        </button>
        <span className="h-9 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2.5">
          <span className="block size-[30px] rounded-full bg-[#E67E22]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#1F1F1F]">
              CASA OLIVAR
            </span>
            <span className="text-[18px] font-semibold leading-tight">
              Editor de salón
            </span>
          </div>
        </div>
        <span className="h-9 w-px bg-[#EDE6DC]" />
        <div className="flex items-center gap-2 rounded-full border border-[#E67E22] bg-[#FBE7D6] px-3 py-1.5">
          <Pencil className="size-3 text-[#C2410C]" strokeWidth={2} />
          <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#C2410C]">
            MODO EDICIÓN
          </span>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="flex items-center gap-3.5">
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#6B6660]">
          AUTOGUARDADO ACTIVO
        </span>
        <span className="h-7 w-px bg-[#EDE6DC]" />
        <button
          type="button"
          onClick={exitToLive}
          className="flex items-center gap-2 rounded-[10px] bg-[#1F1F1F] px-4 py-2.5 text-white hover:bg-[#2a2a2a]"
        >
          <LogOut className="size-3.5" strokeWidth={2} />
          <span className="text-[13px] font-semibold">Salir del modo edición</span>
        </button>
      </div>
    </header>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <div className="flex items-center gap-2 text-[#6B6660]">
        <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
        <span className="text-[12px]">Guardando…</span>
      </div>
    );
  }
  if (status === "saved") {
    return (
      <div className="flex items-center gap-2 text-[#7C8A6A]">
        <Check className="size-3.5" strokeWidth={2.4} />
        <span className="text-[12px]">Guardado</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-[#C95A3D]">
      <CircleAlert className="size-3.5" strokeWidth={2} />
      <span className="text-[12px]">Error al guardar</span>
    </div>
  );
}
