"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Coins,
  ReceiptText,
} from "lucide-react";

const MAX_NOTES = 280;

/** Iniciales de respaldo desde el nombre si la sesión no las trae. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CerrarSesionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notes, setNotes] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  // Usuario real de sesión (antes "Marco R." hardcodeado en varios puntos).
  const fullName = session?.user?.name ?? "Usuario";
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const initials =
    (session?.user as { avatarInitials?: string } | undefined)?.avatarInitials ||
    initialsFrom(fullName);

  const closeShift = async () => {
    if (signingOut) return;
    // signOut con redirect:false → controlamos el timing del overlay y
    // navegamos a la landing una vez la animación ceremonial respiró.
    // Aquí también podríamos POST las notas al api antes del signOut.
    setSigningOut(true);
    await signOut({ redirect: false });
    window.setTimeout(() => router.replace("/"), 900);
  };

  const keepOpen = () => router.push("/dashboard");

  return (
    <>
    <main
      className="relative isolate min-h-screen w-full overflow-hidden text-[#1F1F1F]"
      style={{
        background: "linear-gradient(180deg, #FAF5EB 0%, #FBE7D6 100%)",
      }}
    >
      {/* Copper halo */}
      <div
        aria-hidden
        className="absolute -z-10 -translate-x-1/2"
        style={{
          top: "146px",
          left: "50%",
          width: "860px",
          height: "560px",
          opacity: 0.35,
          background:
            "radial-gradient(closest-side at 50% 50%, rgba(224,123,60,0.25) 0%, rgba(180,83,9,0.12) 50%, rgba(250,245,235,0) 100%)",
        }}
      />
      {/* Ember particles */}
      <span aria-hidden className="absolute size-1 rounded-full bg-[#E07B3C] opacity-40" style={{ top: "738px", left: "33%" }} />
      <span aria-hidden className="absolute size-[3px] rounded-full bg-[#B45309] opacity-30" style={{ top: "680px", left: "67%" }} />
      <span aria-hidden className="absolute size-[3px] rounded-full bg-[#C2410C] opacity-28" style={{ top: "572px", left: "51%" }} />

      {/* Profile chip top-right */}
      <div className="absolute right-12 top-10 z-10 flex items-center gap-3">
        <div className="rounded-full border border-[#EDE6DC] bg-white/60 px-3 py-2 backdrop-blur-sm">
          <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#6B4F3A]">
            CASA OLIVAR
          </span>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-[#1F1F1F]">
          <span className="font-mono text-[11px] font-extrabold text-[#FAF5EB]">
            {initials}
          </span>
        </div>
      </div>

      {/* Content column */}
      <section className="relative z-10 mx-auto flex w-[720px] flex-col items-center gap-6 pt-[112px]">
        {/* Label */}
        <p className="font-mono text-[11px] font-bold tracking-[0.42em] text-[#C2410C]">
          ·&nbsp;&nbsp;TURNO CENA · T2&nbsp;&nbsp;·
        </p>

        {/* Heading */}
        <h1 className="font-display text-[48px] font-medium italic leading-none">
          Bien cerrado, {firstName}.
        </h1>

        {/* Sub */}
        <p className="font-jakarta text-[14px] font-medium text-[#6B6660]">
          Tu turno duró 6 horas 28 minutos. Aquí lo que dejas hecho:
        </p>

        {/* Brand line */}
        <span
          aria-hidden
          className="h-px w-[120px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(224,123,60,0) 0%, #E07B3C 50%, rgba(224,123,60,0) 100%)",
          }}
        />

        {/* Quote */}
        <p className="text-center font-display text-[16px] italic text-[#6B4F3A]">
          &ldquo;La sala queda en calma cuando el cierre queda claro.&rdquo;
        </p>

        {/* Stats grid */}
        <div className="grid w-full grid-cols-4 gap-3.5">
          <StatCard
            icon={<ReceiptText className="size-[22px]" strokeWidth={1.8} />}
            label="VENTAS ATRIBUIDAS"
            number="Q12,450"
            subtitle="8 mesas atendidas"
          />
          <StatCard
            icon={<Coins className="size-[22px]" strokeWidth={1.8} />}
            label="PROPINAS ESTIMADAS"
            number="Q1,830"
            subtitle="14.7% promedio"
          />
          <StatCard
            icon={<CalendarCheck className="size-[22px]" strokeWidth={1.8} />}
            label="RESERVAS GESTIONADAS"
            number="6"
            subtitle="100% completadas"
          />
          <StatCard
            icon={<Clock className="size-[22px]" strokeWidth={1.8} />}
            label="TIEMPO PROMEDIO POR MESA"
            number="1h 12m"
            subtitle="−4 min vs tu promedio"
          />
        </div>

        {/* Notes block */}
        <div className="flex w-full flex-col gap-2.5">
          <label
            htmlFor="notes"
            className="font-mono text-[10px] font-extrabold tracking-[0.18em] text-[#6B4F3A]"
          >
            NOTAS PARA EL SIGUIENTE TURNO
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
            placeholder="Comparte un pendiente, una nota sobre un cliente, o cualquier cosa que el próximo gerente deba saber..."
            className="h-[120px] resize-none rounded-xl border border-[#EDE6DC] bg-white p-4.5 font-jakarta text-[14px] leading-relaxed text-[#1F1F1F] placeholder:font-jakarta placeholder:italic placeholder:text-[#A89D8E] focus:border-[#C2410C]/40 focus:outline-none focus:ring-2 focus:ring-[#C2410C]/15"
            style={{
              boxShadow: "0 8px 18px rgba(31,31,31,0.04)",
            }}
          />
          <p className="self-end font-mono text-[10px] font-bold text-[#A89D8E]">
            {notes.length} / {MAX_NOTES}
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full items-center justify-center gap-3">
          <button
            type="button"
            onClick={closeShift}
            disabled={signingOut}
            className="flex h-[54px] w-[280px] items-center justify-center gap-3 rounded-xl border border-[#FAF5EB]/40 text-[15px] font-bold text-[#FAF5EB] shadow-[0_8px_24px_rgba(194,65,12,0.27)] transition-shadow hover:shadow-[0_10px_28px_rgba(194,65,12,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              background: "linear-gradient(180deg, #E07B3C 0%, #B45309 100%)",
            }}
          >
            Cerrar turno y sesión
            <ArrowRight className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={keepOpen}
            disabled={signingOut}
            className="flex h-[54px] w-[240px] items-center justify-center rounded-xl border border-[#D8CEC2] bg-transparent text-[15px] font-bold text-[#6B4F3A] transition-colors hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mantener sesión abierta
          </button>
        </div>

        {/* Footer note */}
        <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#A89D8E]">
          Tu sesión expirará automáticamente en 15 minutos de inactividad.
        </p>
      </section>
    </main>
    {signingOut && <SignOutOverlay name={fullName} />}
    </>
  );
}

function SignOutOverlay({ name }: { name: string }) {
  return (
    <div className="signin-overlay fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-[#0e0a08]">
      <div className="bg-ember-halo absolute left-1/2 top-1/2 -z-10 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-50" />

      <p className="font-mono text-[10px] font-medium tracking-[0.42em] text-[#c2410c]">
        ·&nbsp;&nbsp;HASTA&nbsp;PRONTO&nbsp;&nbsp;·
      </p>

      <h1 className="ember-wordmark font-display text-[96px] font-semibold leading-none tracking-[0.06em]">
        EMBER
      </h1>

      <div className="flex flex-col items-center gap-1.5">
        <span className="font-display text-[16px] italic tracking-[0.04em] text-[#faf5eb]">
          {name}
        </span>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="signin-pulse block size-1 rounded-full bg-[#E67E22]" />
          <span className="font-mono text-[10px] font-medium tracking-[0.38em] text-[#a89d8e]">
            CERRANDO TURNO · CENA · T2
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  number,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  number: string;
  subtitle: string;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-2xl border border-[#EDE6DC] bg-white p-5"
      style={{ boxShadow: "0 6px 18px rgba(107,79,58,0.09)" }}
    >
      <span className="text-[#C2410C] opacity-85">{icon}</span>
      <span className="font-mono text-[9px] font-bold leading-tight tracking-[0.11em] text-[#8A5A32]">
        {label}
      </span>
      <span className="font-display text-[32px] font-semibold italic leading-none text-[#1F1F1F]">
        {number}
      </span>
      <span className="font-jakarta text-[11px] font-medium leading-tight text-[#6B6660]">
        {subtitle}
      </span>
    </div>
  );
}
