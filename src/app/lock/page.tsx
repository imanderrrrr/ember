"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { homeForRole, roleLabel } from "@/lib/roles";
import {
  ArrowLeft,
  BadgeDollarSign,
  CircleCheck,
  Coins,
  ReceiptText,
} from "lucide-react";

const PIN_LENGTH = 4;

export default function LockScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const userName = session?.user?.name ?? "—";
  const userInitials = session?.user?.avatarInitials ?? "··";
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const enter = (digit: string) => {
    setPin((p) => (p.length < PIN_LENGTH ? p + digit : p));
    setError(false);
  };

  const back = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  // Auto-validar contra el api cuando se completen los 4 dígitos.
  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch("/api/lock/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });
        if (cancelled) return;
        if (res.ok) {
          // Volver a la ventana principal del rol (mesero → /mesero, etc.),
          // no siempre al dashboard.
          router.replace(homeForRole(userRole));
        } else {
          setError(true);
          setVerifying(false);
          window.setTimeout(() => {
            if (!cancelled) {
              setPin("");
              setError(false);
            }
          }, 700);
        }
      } catch (err) {
        console.error("[lock] verify failed:", err);
        if (!cancelled) {
          setError(true);
          setVerifying(false);
          window.setTimeout(() => {
            if (!cancelled) {
              setPin("");
              setError(false);
            }
          }, 700);
        }
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [pin, router, userRole]);

  // Keyboard input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") enter(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-[#1f1f1f] text-[#FAF5EB]">
      {/* Background gradient */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={{
          background:
            "linear-gradient(180deg, #1A0F09 0%, #0E0A08 50%, #160C08 100%)",
        }}
      />
      {/* Central copper halo */}
      <div
        aria-hidden
        className="absolute -z-20 -translate-x-1/2"
        style={{
          top: "76px",
          left: "50%",
          width: "810px",
          height: "610px",
          opacity: 0.55,
          background:
            "radial-gradient(closest-side at 50% 50%, rgba(194,65,12,0.3) 0%, rgba(124,45,18,0.14) 52%, rgba(14,10,8,0) 100%)",
        }}
      />
      {/* Lower pause glow */}
      <div
        aria-hidden
        className="absolute -z-20 -translate-x-1/2"
        style={{
          top: "540px",
          left: "50%",
          width: "1020px",
          height: "320px",
          opacity: 0.42,
          background:
            "radial-gradient(closest-side at 50% 50%, rgba(224,123,60,0.2) 0%, rgba(180,83,9,0.1) 42%, rgba(14,10,8,0) 100%)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(closest-side at 50% 50%, rgba(14,10,8,0) 46%, rgba(14,10,8,0.85) 100%)",
          opacity: 0.78,
        }}
      />
      {/* Ember particles */}
      <span aria-hidden className="absolute size-1 rounded-full bg-[#E07B3C] opacity-55" style={{ top: "712px", left: "30%" }} />
      <span aria-hidden className="absolute size-[3px] rounded-full bg-[#B45309] opacity-45" style={{ top: "624px", left: "70%" }} />
      <span aria-hidden className="absolute size-[3px] rounded-full bg-[#E67E22] opacity-50" style={{ top: "512px", left: "39%" }} />
      <span aria-hidden className="absolute size-1 rounded-full bg-[#C2410C] opacity-40" style={{ top: "390px", left: "62%" }} />
      <span aria-hidden className="absolute size-[2px] rounded-full bg-[#E07B3C] opacity-50" style={{ top: "742px", left: "49%" }} />

      {/* Corner labels */}
      <span className="absolute left-12 top-12 z-10 font-mono text-[10px] tracking-[0.2em] text-[#3A322C]">
        EMBER · v1.0
      </span>
      <span className="absolute right-12 top-12 z-10 font-mono text-[10px] tracking-[0.2em] text-[#3A322C]">
        PANTALLA · 03
      </span>
      <span className="absolute bottom-12 left-12 z-10 font-mono text-[10px] tracking-[0.2em] text-[#3A322C]">
        FORJADO EN BRASA
      </span>
      <span className="absolute bottom-12 right-12 z-10 font-mono text-[10px] tracking-[0.2em] text-[#3A322C]">
        SECURE · ENCRYPTED
      </span>

      {/* Security header */}
      <header className="absolute inset-x-0 top-9 z-10 flex items-center justify-between px-12">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#E67E22]">
            EMBER
          </span>
          <span className="h-3.5 w-px bg-[#3A322C]" />
          <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-[#A89D8E]">
            RESTAURANT OS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#E67E22]" />
          <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-[#A89D8E]">
            PANTALLA BLOQUEADA
          </span>
        </div>
      </header>

      {/* Centered content column */}
      <section className="relative z-10 mx-auto flex w-[480px] flex-col gap-5 pt-[92px]">
        {/* PIN Card */}
        <div
          className={`flex flex-col gap-5 rounded-2xl border bg-[#18120ecc] p-8 shadow-[0_22px_52px_rgba(14,10,8,0.48)] backdrop-blur-sm transition-colors ${
            error
              ? "lock-shake border-[#C95A3D]"
              : "border-[#3A322C]"
          }`}
        >
          {/* Identity */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex size-20 items-center justify-center rounded-full border border-[#3A322C] bg-[#1F1F1F]">
              <span className="font-mono text-[24px] font-bold tracking-[0.06em] text-[#FAF5EB]">
                {userInitials}
              </span>
            </div>
            <h1 className="font-display text-[24px] font-semibold leading-none">
              {userName}
            </h1>
            <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-[#A89D8E]">
              {roleLabel(userRole)} · Turno Cena · T2
            </p>
            <div className="rounded-full bg-[#C2410C]/15 px-3 py-1.5">
              <span className="font-mono text-[9px] font-bold tracking-[0.22em] text-[#E07B3C]">
                EN PAUSA · HACE 4 MIN
              </span>
            </div>
          </div>

          {/* PIN dots */}
          <div className="flex items-center justify-center gap-4">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <span
                key={i}
                className={`size-3 rounded-full transition-colors ${
                  error
                    ? "bg-[#C95A3D]"
                    : i < pin.length
                    ? "bg-[#E67E22]"
                    : "bg-[#3A322C]"
                }`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-center font-mono text-[10px] font-bold tracking-[0.22em] text-[#C95A3D]">
              PIN INCORRECTO
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <KeyBtn key={d} onClick={() => enter(d)}>
                {d}
              </KeyBtn>
            ))}
            <KeyBtn onClick={back} aria-label="Borrar">
              <ArrowLeft className="size-4" strokeWidth={1.8} />
            </KeyBtn>
            <KeyBtn onClick={() => enter("0")}>0</KeyBtn>
            <button
              type="button"
              className="flex h-[54px] items-center justify-center font-mono text-[10px] font-medium tracking-[0.18em] text-[#A89D8E] transition-colors hover:text-[#E07B3C]"
            >
              Olvidé mi PIN
            </button>
          </div>

          {/* Helper text */}
          <p className="text-center font-mono text-[10px] font-medium tracking-[0.18em] text-[#A89D8E]">
            {verifying
              ? "Verificando…"
              : pin.length < PIN_LENGTH
              ? "Ingresa tu PIN para reanudar el turno"
              : ""}
          </p>
        </div>

        {/* Mientras no estabas */}
        <div className="flex flex-col gap-2 rounded-xl border border-[#3A322C] bg-[#160F0Bcc] p-3.5">
          <div className="mb-1 flex items-center gap-2">
            <span aria-hidden className="block h-1.5 w-1.5 rounded-sm bg-[#E07B3C]" />
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#E07B3C]">
              MIENTRAS NO ESTABAS
            </span>
          </div>
          <EventRow
            icon={<ReceiptText className="size-3.5" strokeWidth={1.8} />}
            text="Mesa 07 abrió pedido · hace 2 min"
            color="#E07B3C"
          />
          <EventRow
            icon={<CircleCheck className="size-3.5" strokeWidth={1.8} />}
            text="Cocina marcó orden lista (Mesa 04) · hace 3 min"
            color="#C2410C"
          />
          <EventRow
            icon={<Coins className="size-3.5" strokeWidth={1.8} />}
            text="+Q280 en ventas durante tu pausa"
            color="#E07B3C"
            bold
          />
          <EventRow
            icon={<BadgeDollarSign className="size-3.5" strokeWidth={1.8} />}
            text="Mesa 11 solicitó cuenta · hace 1 min"
            color="#C2410C"
            muted
          />
        </div>

      </section>
    </main>
  );
}

function KeyBtn({
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className="flex h-[54px] items-center justify-center rounded-md border border-[#3A322C] bg-[#1F1F1F] font-mono text-[20px] font-medium text-[#FAF5EB] transition-colors hover:border-[#5A3A25] hover:bg-[#241711] active:bg-[#3a322c]"
    >
      {children}
    </button>
  );
}

function EventRow({
  icon,
  text,
  color,
  bold,
  muted,
}: {
  icon: React.ReactNode;
  text: string;
  color: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ color }}>{icon}</span>
      <span
        className={`font-mono text-[11px] ${bold ? "font-semibold" : "font-medium"} ${
          muted ? "text-[#A89D8E]" : "text-[#FAF5EB]"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
