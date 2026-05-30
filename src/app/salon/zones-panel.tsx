"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createZone, deleteZone } from "./_lib/client-api";
import type { SalonTable, Zone } from "./_lib/types";
import { STATUS_COLOR } from "./_lib/types";
import { ZoneDeleteModal } from "./zone-delete-modal";

/** Tiempo que el usuario debe mantener presionada la zona activa para
 *  disparar el flujo de eliminación. La duración del CSS keyframe del
 *  progreso debe coincidir con este valor para que la barra termine de
 *  llenarse justo cuando se abre el modal. */
const LONG_PRESS_MS = 2500;

/**
 * Panel de zonas — sección interactiva del sidebar izquierdo del Salón.
 *
 * Responsabilidades:
 *  - Cambiar la zona activa: actualiza `?zone=<id>` y el server re-renderiza
 *    el plano filtrado por esa zona.
 *  - Crear zona: form inline al pulsar "Agregar zona".
 *  - Eliminar zona: NO hay icono de basurero. Solo la zona **seleccionada**
 *    responde al gesto: mantener presionado por 2.5s abre el modal de
 *    confirmación destructiva. Mientras se mantiene, una barra de progreso
 *    se va llenando como gauge visual.
 *
 * Después de cada mutación: `router.refresh()` re-corre el server component
 * para recargar el plano fresco desde el backend.
 */
export function ZonesPanel({
  zones,
  tables,
  activeZoneId,
}: {
  zones: Zone[];
  tables: SalonTable[];
  activeZoneId: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  // Zona elegida para confirmación destructiva (id o null si modal cerrado).
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const tablesIn = (zoneId: string) => tables.filter((t) => t.zoneId === zoneId);

  const switchTo = (id: string) => {
    if (id === activeZoneId) return;
    startTransition(() => router.push(`/salon?zone=${id}`));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || createBusy) return;
    setError(null);
    setCreateBusy(true);
    try {
      const z = await createZone({ name });
      setNewName("");
      setCreating(false);
      // Después de crear, saltar a la nueva zona.
      startTransition(() => {
        router.push(`/salon?zone=${z.id}`);
        router.refresh();
      });
    } catch {
      setError("No se pudo crear la zona");
    } finally {
      setCreateBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId || deleteBusy) return;
    setError(null);
    setDeleteBusy(true);
    try {
      await deleteZone(deleteTargetId);
      const remaining = zones.filter((z) => z.id !== deleteTargetId);
      const next = remaining[0]?.id;
      setDeleteTargetId(null);
      startTransition(() => {
        router.push(next ? `/salon?zone=${next}` : "/salon");
        router.refresh();
      });
    } catch {
      setError("No se pudo eliminar la zona");
    } finally {
      setDeleteBusy(false);
    }
  };

  const targetZone = zones.find((z) => z.id === deleteTargetId) ?? null;
  const targetTables = targetZone ? tablesIn(targetZone.id) : [];

  return (
    <section className="flex flex-col gap-3 border-b border-[#EDE6DC] p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6B4F3A]">
          ZONAS
        </span>
        <span className="font-mono text-[10px] text-[#6B6660]">{zones.length}</span>
      </div>

      <div className="flex flex-col gap-1">
        {zones.map((z) => (
          <ZoneRow
            key={z.id}
            zone={z}
            tables={tablesIn(z.id)}
            active={z.id === activeZoneId}
            onSelect={() => switchTo(z.id)}
            onRequestDelete={() => {
              setError(null);
              setDeleteTargetId(z.id);
            }}
          />
        ))}
      </div>

      {/* Crear zona */}
      {creating ? (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-2 rounded-lg border border-[#EDE6DC] bg-white p-2.5"
        >
          <label className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#6B4F3A]">
            NUEVA ZONA
          </label>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej. Terraza, Barra, VIP…"
            maxLength={40}
            className="rounded-md border border-[#EDE6DC] bg-[#F7F3EE] px-2.5 py-1.5 text-[12px] text-[#1F1F1F] placeholder:text-[#a89d8e] focus:border-[#E67E22] focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
                setError(null);
              }}
              className="flex size-7 items-center justify-center rounded-md border border-[#EDE6DC] hover:bg-[#F7F3EE]"
              aria-label="Cancelar"
            >
              <X className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || createBusy}
              className="flex-1 rounded-md bg-[#E67E22] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#c2410c] disabled:opacity-50"
            >
              {createBusy ? "Creando…" : "Crear zona"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setError(null);
          }}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#EDE6DC] px-3 py-2.5 hover:bg-[#EDE6DC]/40"
        >
          <Plus className="size-3.5 text-[#6B4F3A]" strokeWidth={1.8} />
          <span className="text-[12px] text-[#6B4F3A]">Agregar zona</span>
        </button>
      )}

      {error && (
        <p className="rounded-md border border-[#C95A3D33] bg-[#C95A3D0A] px-2.5 py-1.5 text-[11px] text-[#C95A3D]">
          {error}
        </p>
      )}

      {targetZone && (
        <ZoneDeleteModal
          zone={targetZone}
          tables={targetTables}
          busy={deleteBusy}
          onCancel={() => {
            if (deleteBusy) return;
            setDeleteTargetId(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
}

/**
 * Fila de zona con gesto de long-press para eliminar.
 *
 * Reglas:
 *  - Solo la zona **activa** responde al long-press. Las demás solo
 *    cambian la zona activa al hacer click (comportamiento normal).
 *  - Mientras se mantiene presionado: una barra horizontal en la base se
 *    llena de izquierda a derecha en {@link LONG_PRESS_MS} ms + un tinte
 *    rojo crece de fondo, dando feedback claro del progreso.
 *  - Si el usuario suelta, mueve el cursor fuera o cancela el touch antes
 *    de completar la duración, el gesto se aborta y la fila vuelve al
 *    estado normal.
 *  - Al completarse, se abre el modal de confirmación (este componente no
 *    elimina nada por sí solo).
 *
 * Para descubrir el gesto: la zona activa muestra un hint discreto al
 * hacer hover ("MANTÉN PARA ELIMINAR").
 */
function ZoneRow({
  zone,
  tables,
  active,
  onSelect,
  onRequestDelete,
}: {
  zone: Zone;
  tables: SalonTable[];
  active: boolean;
  onSelect: () => void;
  onRequestDelete: () => void;
}) {
  const timerRef = useRef<number | null>(null);
  const [pressing, setPressing] = useState(false);

  const dots = Array.from(
    new Set(tables.map((t) => STATUS_COLOR[t.status])),
  ).slice(0, 4);

  const cancelHold = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  }, []);

  const startHold = useCallback(() => {
    // Solo dispara en la zona activa — eso evita borrados accidentales en
    // zonas que el usuario está apenas leyendo de pasada.
    if (!active) return;
    if (timerRef.current !== null) return; // ya hay un hold en curso
    setPressing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setPressing(false);
      onRequestDelete();
    }, LONG_PRESS_MS);
  }, [active, onRequestDelete]);

  // Si la zona deja de ser activa (porque el usuario cambió de zona en
  // medio del press), abortamos el gesto silenciosamente.
  useEffect(() => {
    if (active) return;
    const t = window.setTimeout(cancelHold, 0);
    return () => window.clearTimeout(t);
  }, [active, cancelHold]);

  // Cleanup al desmontar — evita callbacks zombi si el panel se re-renderiza.
  useEffect(() => () => cancelHold(), [cancelHold]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Solo botón principal del mouse. Touch y pen llegan como button=0.
    if (e.button !== 0) return;
    startHold();
  };

  return (
    <div
      className={`group relative flex select-none items-center overflow-hidden rounded-lg transition-colors ${
        active
          ? pressing
            ? "bg-[#C95A3D14]"
            : "bg-[#E67E2214]"
          : "hover:bg-[#EDE6DC]/40"
      }`}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      // Si el usuario arrastra el dedo / cursor demasiado, abortamos también.
      // (En el contexto de un sidebar pequeño basta con `onPointerLeave`.)
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${
          active ? "" : "pl-[15px]"
        }`}
      >
        {active && <span className="h-8 w-[3px] rounded-sm bg-[#E67E22]" />}
        <div className="flex flex-1 flex-col items-start gap-[3px]">
          <span
            className={`text-[13px] ${active ? "font-semibold" : "font-normal"}`}
          >
            {zone.name}
          </span>
          {/* Sub-label fijo. El gesto de long-press no se anuncia con texto
              — el feedback visual (tinte rojo + barra de progreso) basta. */}
          <span className="font-mono text-[10px] text-[#6B6660]">
            {tables.length} {tables.length === 1 ? "mesa" : "mesas"}
          </span>
        </div>
        <div className="flex items-center gap-[3px]">
          {dots.length === 0 ? (
            <span className="font-mono text-[9px] text-[#a89d8e]">vacía</span>
          ) : (
            dots.map((c, i) => (
              <span
                key={i}
                className="block size-1.5 rounded-full"
                style={{ background: c }}
              />
            ))
          )}
        </div>
      </button>

      {/* Gauge de progreso: solo visible durante el press. Crece de 0% a
          100% del ancho de la fila en `LONG_PRESS_MS` mediante un keyframe
          inline para que la duración esté en un único lugar. */}
      {active && pressing && (
        <>
          <style>{`
            @keyframes zone-hold-fill {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `}</style>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[#C95A3D]"
            style={{
              animation: `zone-hold-fill ${LONG_PRESS_MS}ms linear forwards`,
            }}
          />
        </>
      )}
    </div>
  );
}
