"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react";
import { TOTAL_STEPS } from "../_lib/wizard-constants";

interface WizardFooterProps {
  step: number;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onSaveDraft: () => void;
  submitting?: boolean;
  submitError?: string | null;
}

export function WizardFooter({
  step,
  onPrev,
  onNext,
  onFinish,
  onSaveDraft,
  submitting,
  submitError,
}: WizardFooterProps) {
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
