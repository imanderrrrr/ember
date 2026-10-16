"use client";

import Link from "next/link";
import { X } from "lucide-react";

interface WizardHeaderProps {
  chipText: string;
}

export function WizardHeader({ chipText }: WizardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#ede6dc] bg-white px-7">
      <div className="flex items-center gap-3.5">
        <div className="flex size-8 items-center justify-center rounded bg-[#1f1f1f]">
          <span className="font-mono text-[18px] font-semibold text-[#f7f3ee]">
            E
          </span>
        </div>
        <span
          className="font-mono text-[20px] font-semibold text-[#1f1f1f]"
          style={{ letterSpacing: "1px" }}
        >
          EMBER
        </span>
        <span className="h-5 w-px bg-[#ede6dc]" />
        <nav className="flex items-center gap-1.5 text-[13px]">
          <Link href="/salon" className="text-[#6b4f3a] hover:text-[#1F1F1F]">
            Casa Olivar
          </Link>
          <span className="text-[#a89d8e]">/</span>
          <Link href="/salon" className="text-[#6b4f3a] hover:text-[#1F1F1F]">
            Reservas
          </Link>
          <span className="text-[#a89d8e]">/</span>
          <span className="font-semibold text-[#1f1f1f]">Nueva reserva</span>
        </nav>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-[#e67e22] bg-[#f7f3ee] py-1.5 pl-3.5 pr-4">
        <span className="relative block size-3.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#e67e22] opacity-25" />
          <span className="absolute inset-[3.5px] rounded-full bg-[#e67e22]" />
        </span>
        <span className="text-[12px] text-[#6b4f3a]">{chipText}</span>
      </div>

      <div className="flex items-center gap-3.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#1f1f1f]">
          <span
            className="text-[11px] font-semibold text-[#f7f3ee]"
            style={{ letterSpacing: "0.5px" }}
          >
            SM
          </span>
        </span>
        <Link
          href="/salon"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[#6b4f3a] hover:bg-[#f7f3ee]"
        >
          <X className="size-3.5" strokeWidth={1.8} />
          <span className="text-[13px] font-medium">Cerrar</span>
        </Link>
      </div>
    </header>
  );
}
