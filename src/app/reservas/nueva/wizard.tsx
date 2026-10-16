"use client";

import { useReservationWizard } from "./_hooks/useReservationWizard";
import { WizardHeader } from "./_components/WizardHeader";
import { WizardStepperHeader } from "./_components/WizardStepperHeader";
import { WizardFooter } from "./_components/WizardFooter";
import { SuccessScreen } from "./_components/SuccessScreen";
import { Step1 } from "./_components/Step1";
import { Step2 } from "./_components/Step2";
import { Step3 } from "./_components/Step3";
import { StepCustomerDetails } from "./_components/StepCustomerDetails";
import { Step5Confirmation } from "./_components/Step5Confirmation";
import { Sidebar2 } from "./_components/Sidebar2";
import { Sidebar3 } from "./_components/Sidebar3";
import { ReservationSummarySidebar } from "./_components/ReservationSummarySidebar";

export function Wizard() {
  const {
    step,
    draft,
    setDraft,
    confirmed,
    submitting,
    submitError,
    draftLabel,
    reservations,
    zones,
    totalOpenTables,
    meseros,
    goNext,
    goPrev,
    saveDraftNow,
    handleFinish,
  } = useReservationWizard();

  if (confirmed) return <SuccessScreen draft={draft} />;

  return (
    <div className="flex min-h-screen w-full min-w-[1600px] flex-col bg-[#faf5eb] text-[#1F1F1F]">
      <WizardHeader chipText={draftLabel} />
      <WizardStepperHeader step={step} />
      <main className="flex flex-1 gap-6 px-7 py-6">
        <div className="flex flex-1 flex-col gap-5">
          {step === 1 && (
            <Step1
              draft={draft}
              onChange={setDraft}
              reservations={reservations}
              totalOpenTables={totalOpenTables}
              zones={zones}
            />
          )}
          {step === 2 && (
            <Step2
              draft={draft}
              onChange={setDraft}
              reservations={reservations}
              zones={zones}
            />
          )}
          {step === 3 && (
            <Step3
              draft={draft}
              onChange={setDraft}
              reservations={reservations}
              zones={zones}
            />
          )}
          {step === 4 && (
            <StepCustomerDetails
              draft={draft}
              onChange={setDraft}
              meseros={meseros}
            />
          )}
          {step === 5 && <Step5Confirmation draft={draft} />}
        </div>
        {step === 2 ? (
          <Sidebar2
            draft={draft}
            reservations={reservations}
            zones={zones}
          />
        ) : step === 3 ? (
          <Sidebar3
            draft={draft}
            reservations={reservations}
            zones={zones}
          />
        ) : (
          <ReservationSummarySidebar draft={draft} step={step} />
        )}
      </main>
      <WizardFooter
        step={step}
        onPrev={goPrev}
        onNext={goNext}
        onFinish={handleFinish}
        onSaveDraft={saveDraftNow}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  );
}
