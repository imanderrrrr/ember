"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, X } from "lucide-react";
import type { SalonTable } from "./_lib/types";

/**
 * Modal de confirmación destructiva para eliminar una zona.
 *
 * Sigue el patrón visual de los modales del .pen (Mover mesa, Dividir cuenta):
 *   - Overlay #1F1F1F66
 *   - Card cornerRadius 18, fill #F7F3EE, stroke #EDE6DC 1px
 *   - Drop shadow blur 80 / y32 / #1F1F1F40
 *   - Header y Footer #FFFFFF, body #F7F3EE
 *
 * Requiere que el usuario escriba dos cosas para habilitar el botón
 * destructivo:
 *   1. La palabra literal "confirmación"
 *   2. El nombre exacto de la zona
 *
 * Sirve como freno doble — la palabra evita clicks accidentales; el nombre
 * evita confundir una zona con otra cuando hay varias parecidas.
 */
export function ZoneDeleteModal({
  zone,
  tables,
  busy,
  onCancel,
  onConfirm,
}: {
  zone: { id: string; name: string };
  /** Mesas que se van a borrar en cascada. */
  tables: SalonTable[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [wordInput, setWordInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Comparación normalizada: trim + lowercase. La palabra "confirmación"
  // debe coincidir literalmente, con o sin tilde — aceptamos ambas variantes
  // para no castigar a quien tenga teclado sin acentos.
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase();

  const wordOK = normalize(wordInput) === "confirmacion";
  const nameOK = normalize(nameInput) === normalize(zone.name);
  const canConfirm = wordOK && nameOK && !busy;

  // Cerrar con Escape, foco inicial al primer input, y bloqueo del scroll
  // del body mientras el modal está abierto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
      if (e.key === "Enter" && canConfirm) onConfirm();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [busy, canConfirm, onCancel, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zone-delete-title"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Cancelar"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 cursor-default bg-[#1F1F1F66] backdrop-blur-[2px]"
      />

      {/* Card */}
      <div
        className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-[18px] border border-[#EDE6DC] bg-[#F7F3EE]"
        style={{ boxShadow: "0 32px 80px 0 #1F1F1F40" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#EDE6DC] bg-white px-7 pt-[22px] pb-5">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#C95A3D14]">
              <TriangleAlert
                className="size-[18px] text-[#C95A3D]"
                strokeWidth={1.8}
              />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#C95A3D]">
                ACCIÓN PERMANENTE
              </span>
              <h2
                id="zone-delete-title"
                className="text-[18px] font-semibold leading-tight text-[#1F1F1F]"
              >
                Eliminar zona “{zone.name}”
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Cerrar"
            className="flex size-8 items-center justify-center rounded-lg bg-[#F7F3EE] text-[#6B4F3A] hover:bg-[#EDE6DC] disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-7 py-6">
          <p className="text-[13.5px] leading-[1.55] text-[#1F1F1F]">
            Estás a punto de eliminar la zona{" "}
            <strong className="font-semibold">«{zone.name}»</strong>. Esta acción{" "}
            <strong className="font-semibold text-[#C95A3D]">no se puede deshacer</strong>{" "}
            y la información no podrá restaurarse después.
          </p>

          {/* Lista de consecuencias */}
          <ul className="flex flex-col gap-2.5 rounded-xl border border-[#EDE6DC] bg-white px-4 py-3.5">
            <ConsequenceItem>
              Se eliminarán las{" "}
              <strong className="font-semibold">
                {tables.length}{" "}
                {tables.length === 1 ? "mesa asociada" : "mesas asociadas"}
              </strong>{" "}
              a esta zona.
            </ConsequenceItem>
            <ConsequenceItem>
              Los datos de cada mesa (cliente, comensales, notas) se borrarán
              junto con la zona.
            </ConsequenceItem>
            <ConsequenceItem>
              Los elementos decorativos (paredes, plantas, baños) que vivían en
              esta zona quedarán sin zona asignada.
            </ConsequenceItem>
            <ConsequenceItem>
              No hay papelera ni opción de recuperación: si la necesitas más
              tarde, deberás recrearla desde cero.
            </ConsequenceItem>
          </ul>

          {/* Doble confirmación */}
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="zd-word"
                className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]"
              >
                ESCRIBE LA PALABRA «CONFIRMACIÓN»
              </label>
              <input
                id="zd-word"
                autoFocus
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="confirmación"
                disabled={busy}
                className={`rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none transition-colors ${
                  wordOK
                    ? "border-[#7C8A6A] text-[#1F1F1F]"
                    : "border-[#EDE6DC] text-[#1F1F1F] focus:border-[#C95A3D]"
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="zd-name"
                className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6B4F3A]"
              >
                ESCRIBE EL NOMBRE DE LA ZONA: «{zone.name}»
              </label>
              <input
                id="zd-name"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={zone.name}
                disabled={busy}
                className={`rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none transition-colors ${
                  nameOK
                    ? "border-[#7C8A6A] text-[#1F1F1F]"
                    : "border-[#EDE6DC] text-[#1F1F1F] focus:border-[#C95A3D]"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#EDE6DC] bg-white px-7 py-4">
          <span className="font-mono text-[10.5px] text-[#a89d8e]">
            Presiona Esc para cancelar
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-[#EDE6DC] bg-white px-4 py-2.5 text-[12.5px] font-medium text-[#1F1F1F] hover:bg-[#F7F3EE] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="rounded-lg px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors"
              style={{
                background: canConfirm ? "#C95A3D" : "#C95A3D55",
                cursor: canConfirm ? "pointer" : "not-allowed",
              }}
            >
              {busy ? "Eliminando…" : "Eliminar zona"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsequenceItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-[#1F1F1F]">
      <span className="mt-[7px] block size-1.5 shrink-0 rounded-full bg-[#C95A3D]" />
      <span className="flex-1">{children}</span>
    </li>
  );
}
