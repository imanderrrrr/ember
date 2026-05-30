import Link from "next/link";
import { Eye, EyeOff, Globe, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-[#1f1f1f] text-[#faf5eb]">
      {/* Background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={{
          background:
            "linear-gradient(180deg, #1a0f09 0%, #0e0a08 50%, #160c08 100%)",
        }}
      />
      <div
        aria-hidden
        className="login-halo absolute -z-20 h-[600px] w-[600px] rounded-full opacity-85"
        style={{ top: "-120px", left: "calc(50% - 90px)" }}
      />
      <div
        aria-hidden
        className="login-halo-2 absolute -z-20 h-[520px] w-[1200px] rounded-full opacity-60"
        style={{ top: "520px", left: "calc(50% - 600px)" }}
      />
      <div aria-hidden className="login-vignette absolute inset-0 -z-10 opacity-70" />

      {/* Corner labels */}
      <span className="pointer-events-none absolute left-12 top-12 font-mono text-[10px] tracking-[0.2em] text-[#3a322c]">
        EMBER · v1.0
      </span>
      <span className="pointer-events-none absolute right-12 top-12 font-mono text-[10px] tracking-[0.2em] text-[#3a322c]">
        PANTALLA · 02
      </span>
      <span className="pointer-events-none absolute bottom-12 left-12 font-mono text-[10px] tracking-[0.2em] text-[#3a322c]">
        FORJADO EN BRASA
      </span>
      <span className="pointer-events-none absolute bottom-12 right-12 font-mono text-[10px] tracking-[0.2em] text-[#3a322c]">
        SECURE · ENCRYPTED
      </span>

      {/* Centered column */}
      <div className="relative mx-auto flex w-full max-w-[480px] flex-col items-center px-6 pt-20">
        <p className="font-mono text-[10px] font-medium tracking-[0.3em] text-[#a89d8e]">
          EST. 2026 · RESTAURANT OS
        </p>

        <h1
          className="mt-[18px] font-display text-[80px] font-semibold leading-none tracking-[0.15em]"
          style={{
            background:
              "linear-gradient(0deg, #f5b27a 0%, #e07b3c 50%, #b45309 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          EMBER
        </h1>

        <span aria-hidden className="deco-line mt-[14px] h-px w-[120px]" />

        {/* Card */}
        <section className="mt-9 w-full rounded-2xl border border-[#3a322c] bg-[#18120ecc] p-9 backdrop-blur-sm">
          <h2 className="font-display text-[20px] font-medium tracking-[0.015em] text-[#faf5eb]">
            Bienvenido de vuelta
          </h2>
          <p className="mt-1.5 text-[13px] tracking-[0.015em] text-[#a89d8e]">
            Inicia sesión para continuar tu servicio
          </p>

          {/* Email */}
          <label
            htmlFor="email"
            className="mt-7 block font-mono text-[10px] font-medium tracking-[0.18em] text-[#a89d8e]"
          >
            CORREO ELECTRÓNICO
          </label>
          <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-[#3a322c] bg-[#1f1f1f] px-4 py-3.5">
            <Mail className="size-4 text-[#6b6660]" strokeWidth={1.6} />
            <input
              id="email"
              type="email"
              placeholder="chef@restaurante.com"
              className="flex-1 bg-transparent text-[14px] text-[#faf5eb] placeholder:text-[#6b6660] focus:outline-none"
            />
          </div>

          {/* Password */}
          <label
            htmlFor="password"
            className="mt-[18px] block font-mono text-[10px] font-medium tracking-[0.18em] text-[#a89d8e]"
          >
            CONTRASEÑA
          </label>
          <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-[#3a322c] bg-[#1f1f1f] px-4 py-3.5">
            <Lock className="size-4 text-[#6b6660]" strokeWidth={1.6} />
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              className="flex-1 bg-transparent text-[14px] tracking-[0.05em] text-[#faf5eb] placeholder:text-[#a89d8e] focus:outline-none"
            />
            <button
              type="button"
              className="text-[#6b6660] transition-colors hover:text-[#a89d8e]"
              aria-label="Mostrar contraseña"
            >
              <EyeOff className="size-4" strokeWidth={1.6} />
            </button>
          </div>

          {/* Options row */}
          <div className="mt-[18px] flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-[#a89d8e]">
              <span className="block size-3.5 rounded-[4px] border border-[#3a322c] bg-[#1f1f1f]" />
              Recordarme
            </label>
            <Link
              href="#"
              className="text-[12px] font-medium text-[#c2410c] hover:text-[#e07b3c]"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Sign in */}
          <Link
            href="/dashboard"
            className="bg-ember-button mt-6 flex h-[52px] w-full items-center justify-center rounded-[10px] text-[14px] font-semibold tracking-[0.02em] text-[#faf5eb] shadow-[0_8px_24px_-4px_rgba(194,65,12,0.4),inset_0_1px_0_rgba(250,245,235,0.2)] transition-all hover:shadow-[0_10px_28px_-4px_rgba(194,65,12,0.55),inset_0_1px_0_rgba(250,245,235,0.25)]"
          >
            Iniciar sesión
          </Link>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3.5">
            <span className="h-px flex-1 bg-[#3a322c]" />
            <span className="font-mono text-[9px] font-medium tracking-[0.22em] text-[#6b6660]">
              O CONTINUAR CON
            </span>
            <span className="h-px flex-1 bg-[#3a322c]" />
          </div>

          {/* Social */}
          <div className="mt-[18px] grid grid-cols-2 gap-3">
            <button className="flex h-11 items-center justify-center gap-2.5 rounded-[10px] border border-[#3a322c] bg-[#1f1f1f] text-[13px] font-medium text-[#faf5eb] transition-colors hover:bg-[#251a14]">
              <Globe className="size-3.5 text-[#a89d8e]" strokeWidth={1.6} />
              Google
            </button>
            <button className="flex h-11 items-center justify-center gap-2.5 rounded-[10px] border border-[#3a322c] bg-[#1f1f1f] text-[13px] font-medium text-[#faf5eb] transition-colors hover:bg-[#251a14]">
              <AppleGlyph />
              Apple
            </button>
          </div>
        </section>

        {/* Footer link */}
        <div className="mt-8 flex items-center gap-2 text-[12px]">
          <span className="text-[#6b6660]">¿No tienes cuenta?</span>
          <span className="text-[#3a322c]">·</span>
          <Link href="#" className="font-medium text-[#c2410c] hover:text-[#e07b3c]">
            Solicitar acceso
          </Link>
        </div>
      </div>
    </main>
  );
}

function AppleGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[#a89d8e]"
      aria-hidden
    >
      <path d="M17.05 12.04c-.03-2.78 2.27-4.11 2.37-4.17-1.29-1.89-3.3-2.15-4.02-2.18-1.71-.17-3.34 1.01-4.21 1.01-.87 0-2.21-.99-3.63-.96-1.87.03-3.59 1.09-4.55 2.76-1.94 3.36-.5 8.34 1.4 11.08.92 1.34 2.02 2.84 3.45 2.79 1.39-.05 1.91-.9 3.59-.9 1.68 0 2.15.9 3.63.87 1.5-.02 2.45-1.36 3.36-2.71 1.06-1.55 1.49-3.05 1.52-3.13-.03-.01-2.9-1.11-2.91-4.4ZM14.36 4.04c.77-.93 1.29-2.21 1.15-3.49-1.11.04-2.45.74-3.24 1.67-.71.82-1.34 2.13-1.17 3.38 1.24.1 2.5-.63 3.26-1.56Z" />
    </svg>
  );
}
