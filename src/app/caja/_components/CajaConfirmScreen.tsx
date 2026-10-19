"use client";

import React from "react";
import Link from "next/link";
import { ChefHat, CircleCheck, LayoutGrid, Receipt } from "lucide-react";

export function InfoChip({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[12px] border border-[#EDE6DC] bg-white px-6 py-4">
      <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#A89D8E]">
        {label.toUpperCase()}
      </span>
      <span
        className={`text-[14px] font-bold ${
          green ? "text-[#7C8A6A]" : "text-[#1F1F1F]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function InfoCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-[#EDE6DC] bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12.5px] font-semibold">{title}</span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-[#6B6660]">{desc}</p>
    </div>
  );
}

export function CajaConfirmScreen({
  tableLabel,
  onNext,
  homeHref,
}: {
  tableLabel: string;
  onNext: () => void;
  homeHref: string;
}) {
  return (
    <div className="cobro-stagger flex h-screen flex-col items-center justify-center gap-8 bg-[#FAF5EB] font-jakarta">
      {/* Header minimal */}
      <div className="absolute inset-x-0 top-0 flex h-16 items-center justify-between border-b border-[#EDE6DC] bg-white px-8">
        <span className="font-jakarta text-[15px] font-bold tracking-[0.1em] text-[#C2410C]">
          EMBER · CAJA
        </span>
        <span className="rounded-full border border-[#EDE6DC] bg-[#F7F3EE] px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-[#7C8A6A]">
          COBRO COMPLETADO · Mesa {tableLabel}
        </span>
      </div>

      {/* Centro ceremonial */}
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="animate-cobro-check relative flex size-20 items-center justify-center rounded-[24px] bg-[#7C8A6A]/10">
          <span className="animate-cobro-ring absolute inset-0 rounded-[24px] bg-[#7C8A6A]/25" />
          <CircleCheck
            className="relative size-10 text-[#7C8A6A]"
            strokeWidth={1.5}
          />
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#7C8A6A]">
            OPERACIÓN COMPLETADA
          </span>
          <h1 className="font-jakarta text-[36px] font-bold tracking-[-0.015em] text-[#1F1F1F]">
            Confirmación enviada
          </h1>
          <p className="text-[14px] text-[#6B6660]">
            El cobro quedó registrado y la mesa pasó a limpieza.
          </p>
        </div>
      </div>

      {/* Detalles */}
      <div className="flex gap-8">
        <InfoChip label="Mesa" value={`Mesa ${tableLabel}`} />
        <InfoChip label="Estado" value="Éxito verificado" green />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        <Link
          href={homeHref}
          className="flex items-center gap-2 rounded-[12px] border border-[#EDE6DC] bg-white px-6 py-3 text-[13px] font-medium text-[#1F1F1F] hover:bg-[#F7F3EE]"
        >
          <LayoutGrid className="size-4" strokeWidth={1.8} />
          Volver al salón
        </Link>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-[12px] bg-[#E67E22] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(230,126,34,0.25)] hover:bg-[#c2410c]"
        >
          <Receipt className="size-4" strokeWidth={2} />
          Ver siguiente cuenta
        </button>
      </div>

      {/* Info cards */}
      <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
        <InfoCard
          icon={<ChefHat className="size-4 text-[#E67E22]" strokeWidth={1.8} />}
          title="Equipo avisado"
          desc="La mesa quedó en estado de limpieza pendiente."
        />
        <InfoCard
          icon={<Receipt className="size-4 text-[#4E7DA6]" strokeWidth={1.8} />}
          title="Historial EMBER"
          desc="El cobro se registró en el historial del turno."
        />
        <InfoCard
          icon={<CircleCheck className="size-4 text-[#7C8A6A]" strokeWidth={1.8} />}
          title="Siguiente paso"
          desc="Puedes asignar la mesa de nuevo cuando esté lista."
        />
      </div>
    </div>
  );
}
