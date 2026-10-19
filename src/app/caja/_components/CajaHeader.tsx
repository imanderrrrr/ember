"use client";

import Link from "next/link";
import { ArrowLeft, ChefHat, LayoutGrid } from "lucide-react";
import { UserMenu } from "@/app/dashboard/user-menu";
import type { Bill } from "../_lib/billing";
import type { SessionUser } from "../_hooks/useCajaScreen";

export function CajaHeader({
  user,
  selectedBill,
  backHref,
  backLabel,
  showStaffLinks,
}: {
  user: SessionUser | null;
  selectedBill: Bill | null;
  backHref: string;
  backLabel: string;
  showStaffLinks: boolean;
}) {
  const initials =
    user?.avatarInitials ??
    (user?.name
      ? user.name
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "??");

  return (
    <header className="animate-salon-topbar flex h-16 shrink-0 items-center justify-between border-b border-[#d8cec2] bg-white px-6">
      {/* Left */}
      <div className="flex items-center gap-5">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 rounded-md border border-[#d8cec2] px-3 py-1.5 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          {backLabel}
        </Link>
        <span className="h-5 w-px bg-[#d8cec2]" />
        <div className="flex items-center gap-2.5">
          <span className="font-jakarta text-[15px] font-bold tracking-[0.1em] text-[#C2410C]">
            EMBER
          </span>
          <span className="h-4 w-px bg-[#d8cec2]" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#6B4F3A]">
            CAJA · COBRO
          </span>
        </div>
      </div>

      {/* Center pill */}
      {selectedBill && (
        <div className="flex items-center gap-2 rounded-full bg-[#F2F3F0] px-3.5 py-1.5">
          <span className="size-2 rounded-full bg-[#E67E22]" />
          <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-[#1F1F1F]">
            Cobro activo
          </span>
          <span className="font-mono text-[11px] text-[#6B6660]">
            · Mesa {selectedBill.tableLabel} · {selectedBill.zoneName}
          </span>
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-3">
        {showStaffLinks && (
          <>
            <Link
              href="/cocina"
              className="flex items-center gap-1.5 rounded-md border border-[#d8cec2] px-3 py-1.5 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
            >
              <ChefHat className="size-3.5" strokeWidth={1.8} />
              Cocina
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-md border border-[#d8cec2] px-3 py-1.5 text-[12px] font-medium text-[#6B4F3A] hover:bg-[#F2F3F0]"
            >
              <LayoutGrid className="size-3.5" strokeWidth={1.8} />
              Dashboard
            </Link>
          </>
        )}
        {/* Avatar */}
        <div className="flex items-center gap-2 rounded-full border border-[#d8cec2] px-2.5 py-1.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#6B4F3A] font-mono text-[9px] font-bold text-white">
            {initials}
          </span>
          <span className="text-[12px] font-medium">{user?.name ?? "—"}</span>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
