"use client";

import type { Bill } from "./_lib/billing";
import { SplitBillModal } from "./split-bill-modal";
import { useCajaScreen, type SessionUser } from "./_hooks/useCajaScreen";
import { CajaHeader } from "./_components/CajaHeader";
import { CajaLeftPanel } from "./_components/CajaLeftPanel";
import { CajaCenterPanel } from "./_components/CajaCenterPanel";
import { CajaRightPanel } from "./_components/CajaRightPanel";
import { CajaConfirmScreen } from "./_components/CajaConfirmScreen";

export function CajaScreen({
  bills,
  totalTables,
  user,
  initialTableId,
  backHref = "/dashboard",
  backLabel = "Volver al dashboard",
  homeHref = "/salon",
  showStaffLinks = true,
  showTableSelector = true,
}: {
  bills: Bill[];
  totalTables: number;
  user: SessionUser | null;
  initialTableId?: string;
  backHref?: string;
  backLabel?: string;
  homeHref?: string;
  showStaffLinks?: boolean;
  showTableSelector?: boolean;
}) {
  const {
    selectedId,
    setSelectedId,
    selectedBill,
    method,
    setMethod,
    amount,
    exactAmount,
    done,
    splitOpen,
    setSplitOpen,
    split,
    paying,
    payError,
    handleApplySplit,
    cancelSplit,
    handleKey,
    handleQuick,
    handleConfirm,
    handleNext,
  } = useCajaScreen({ bills, initialTableId, user });

  /* Pantalla de confirmación */
  if (done !== null) {
    return (
      <CajaConfirmScreen
        tableLabel={done}
        onNext={handleNext}
        homeHref={homeHref}
      />
    );
  }

  return (
    <div className="flex h-screen w-full min-w-[1280px] flex-col bg-[#F2F3F0] font-jakarta text-[#1F1F1F]">
      <CajaHeader
        user={user}
        selectedBill={selectedBill}
        backHref={backHref}
        backLabel={backLabel}
        showStaffLinks={showStaffLinks}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[560px_minmax(0,1fr)_520px] overflow-hidden">
        {/* LEFT */}
        <CajaLeftPanel
          bills={bills}
          selectedId={selectedId}
          onSelect={setSelectedId}
          bill={selectedBill}
          homeHref={homeHref}
          showTableSelector={showTableSelector}
          split={split}
          onCancelSplit={cancelSplit}
        />
        {/* CENTER */}
        <CajaCenterPanel
          bill={selectedBill}
          method={method}
          onMethod={setMethod}
          amount={amount}
          exactAmount={exactAmount}
          onKey={handleKey}
          onQuick={handleQuick}
          onConfirm={handleConfirm}
          onSplit={() => setSplitOpen(true)}
          cancelHref={backHref}
          split={split}
          paying={paying}
          payError={payError}
        />
        {/* RIGHT */}
        <CajaRightPanel
          bill={selectedBill}
          bills={bills}
          totalTables={totalTables}
          homeHref={homeHref}
        />
      </div>

      {/* Modal "Dividir cuenta" — opera sobre la factura real seleccionada. */}
      {splitOpen && selectedBill && (
        <SplitBillModal
          bill={selectedBill}
          onClose={() => setSplitOpen(false)}
          onContinue={handleApplySplit}
        />
      )}
    </div>
  );
}
