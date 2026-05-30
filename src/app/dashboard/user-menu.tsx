"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  ChevronDown,
  Lock,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  gerente_operativo: "Gerente operativo",
  chef: "Chef de cocina",
  cocina: "Chef de partida",
  mesero: "Mesero",
  cajero: "Cajero",
  host: "Anfitrión",
  admin: "Administrador",
};

type MenuOption = {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  destructive?: boolean;
  disabled?: boolean;
};

const OPTIONS: MenuOption[] = [
  {
    href: "/lock",
    icon: Lock,
    label: "Bloquear pantalla",
    hint: "Pide PIN para volver al servicio",
  },
  {
    href: "/estado-del-sistema",
    icon: Activity,
    label: "Estado del sistema",
    hint: "API, impresoras, red y periféricos",
    disabled: true,
  },
  {
    href: "/cerrar-sesion",
    icon: LogOut,
    label: "Cerrar sesión",
    hint: "Cierra el turno y termina tu sesión",
    destructive: true,
  },
];

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Datos reales de la sesión Auth.js, con fallbacks por si todavía no carga.
  const name = session?.user?.name ?? "—";
  const initials = session?.user?.avatarInitials ?? "··";
  const roleLabel = ROLE_LABELS[session?.user?.role ?? ""] ?? "Sin rol";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`group flex items-center gap-2.5 rounded-full border bg-white py-1.5 pl-1.5 pr-3.5 transition-colors ${
          open
            ? "border-[#C2410C]/40 bg-[#FBE7D6]/40"
            : "border-[#EDE6DC] hover:border-[#C2410C]/40 hover:bg-[#FBE7D6]/40"
        }`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-[#1F1F1F]">
          <span className="font-mono text-[11px] font-bold text-[#FAF5EB]">
            {initials}
          </span>
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-jakarta text-[12px] font-semibold text-[#1F1F1F]">
            {name}
          </span>
          <span className="font-jakarta text-[10px] text-[#A89D8E]">
            {roleLabel}
          </span>
        </span>
        <ChevronDown
          className={`size-[13px] text-[#A89D8E] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="user-menu-popover absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] overflow-hidden rounded-xl border border-[#EDE6DC] bg-white shadow-[0_18px_42px_rgba(31,31,31,0.14)]"
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-[#EDE6DC] bg-[#FBE7D6]/35 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1F1F1F]">
              <span className="font-mono text-[13px] font-bold text-[#FAF5EB]">
                {initials}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-jakarta text-[14px] font-semibold leading-tight text-[#1F1F1F]">
                {name}
              </span>
              <span className="font-jakarta text-[11px] leading-tight text-[#6B6660]">
                {roleLabel} · Turno Cena · T2
              </span>
              <span className="mt-1 font-mono text-[9px] font-semibold tracking-[0.16em] text-[#A89D8E]">
                CASA OLIVAR · POLANCO
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="flex flex-col">
            {OPTIONS.map((opt) => (
              <MenuRow
                key={opt.href}
                option={opt}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-[#EDE6DC] bg-[#FAF5EB] px-4 py-2.5">
            <span className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#A89D8E]">
              EMBER · v1.0
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({
  option,
  onClick,
}: {
  option: MenuOption;
  onClick: () => void;
}) {
  const Icon = option.icon;

  const content = (
    <>
      <span
        className={`mt-0.5 shrink-0 ${
          option.disabled
            ? "text-[#A89D8E]"
            : option.destructive
            ? "text-[#C2410C]"
            : "text-[#6B4F3A]"
        }`}
      >
        <Icon className="size-[15px]" strokeWidth={1.8} />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-jakarta text-[13px] font-semibold leading-tight ${
              option.disabled
                ? "text-[#A89D8E]"
                : option.destructive
                ? "text-[#C2410C]"
                : "text-[#1F1F1F]"
            }`}
          >
            {option.label}
          </span>
          {option.disabled && (
            <span className="rounded-full bg-[#EDE6DC] px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.14em] text-[#6B4F3A]">
              PRÓXIMAMENTE
            </span>
          )}
        </div>
        <span className="font-jakarta text-[11px] leading-tight text-[#A89D8E]">
          {option.hint}
        </span>
      </div>
    </>
  );

  const className = `flex items-start gap-3 border-t border-[#EDE6DC] px-4 py-3 first:border-t-0 transition-colors ${
    option.disabled
      ? "cursor-not-allowed opacity-65"
      : option.destructive
      ? "hover:bg-[#FBE7D6]/60"
      : "hover:bg-[#F7F3EE]"
  }`;

  if (option.disabled) {
    return (
      <div role="menuitem" aria-disabled className={className}>
        {content}
      </div>
    );
  }

  return (
    <Link
      role="menuitem"
      href={option.href}
      onClick={onClick}
      className={className}
    >
      {content}
    </Link>
  );
}
