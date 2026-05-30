"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, signIn, useSession } from "next-auth/react";
import { ArrowRight, Eye, EyeOff, Globe, Lock, Mail } from "lucide-react";
import { homeForRole } from "@/lib/roles";

// Credenciales del usuario seed (chef@ember.com / brasa2026) que ya vive en la DB.
// El chip "Rellenar" del form usa esto; la validación real ocurre contra el api.
const DEMO_USER = {
  email: "chef@ember.com",
  password: "brasa2026",
  name: "Marco R.",
};

// Rising embers from the fire (kept as CSS — small bright particles look great on top of video)
const EMBERS = [
  { left: "12%", bottom: "180px", dur: "9s",   delay: "0s",   drift: "30px",  travel: "-540px", size: 5 },
  { left: "22%", bottom: "160px", dur: "11s",  delay: "1.6s", drift: "-25px", travel: "-620px", size: 3 },
  { left: "32%", bottom: "200px", dur: "8s",   delay: "0.8s", drift: "16px",  travel: "-500px", size: 4 },
  { left: "42%", bottom: "170px", dur: "12s",  delay: "3.2s", drift: "-32px", travel: "-660px", size: 6 },
  { left: "50%", bottom: "210px", dur: "9.5s", delay: "0.4s", drift: "10px",  travel: "-560px", size: 3 },
  { left: "58%", bottom: "180px", dur: "10s",  delay: "2.4s", drift: "28px",  travel: "-600px", size: 5 },
  { left: "68%", bottom: "200px", dur: "8.5s", delay: "1.1s", drift: "-20px", travel: "-510px", size: 4 },
  { left: "78%", bottom: "170px", dur: "11.5s",delay: "2.9s", drift: "24px",  travel: "-640px", size: 3 },
  { left: "86%", bottom: "190px", dur: "9s",   delay: "0.2s", drift: "-28px", travel: "-520px", size: 5 },
];

const SPARKS = [
  { left: "22%", top: "62%", dur: "6s",   delay: "0.5s" },
  { left: "48%", top: "48%", dur: "4.5s", delay: "2.1s" },
  { left: "58%", top: "66%", dur: "7s",   delay: "1.4s" },
  { left: "72%", top: "52%", dur: "5.5s", delay: "3.6s" },
  { left: "38%", top: "70%", dur: "5s",   delay: "4.2s" },
];

export default function BienvenidaPage() {
  const router = useRouter();
  const { status, data: sessionData } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // `submitting`: la petición a Auth.js está en vuelo. Bloquea el auto-redirect
  // por sesión durante el fetch (~80ms) para que no se pierda el overlay.
  // `signing`: el overlay ceremonial está visible. Bloquea el auto-redirect
  // por sesión hasta que terminamos el segundo de animación y navegamos.
  const [submitting, setSubmitting] = useState(false);
  const [signing, setSigning] = useState(false);
  // Nombre real del usuario autenticado, para el overlay de bienvenida.
  const [signedInName, setSignedInName] = useState(DEMO_USER.name);

  // `readOnlyInputs` arranca en true para los inputs de email/password.
  // Safari/iCloud Keychain NO ofrece autofill sobre inputs `readonly`, lo
  // que bloquea el popup de credenciales que ignoraba `autoComplete="off"`.
  // En `onFocus` lo desactivamos para que el usuario pueda escribir
  // normalmente. Esta es la técnica más confiable y compatible.
  const [readOnlyInputs, setReadOnlyInputs] = useState(true);
  const unlockInputs = () => setReadOnlyInputs(false);

  // `formMounted` controla si los inputs del formulario están en el DOM.
  // Safari/iCloud Keychain ignora `autoComplete="off"` en campos de password
  // y muestra el popup de credenciales con solo detectar `type="password"`
  // en el DOM. La única forma de bloquearlo es no renderizar el form mientras
  // el usuario no haya pedido iniciar sesión. El botón ghost siempre se
  // renderiza (queda fuera de esta condición). Al cerrar, esperamos 500ms para
  // que termine el fade-out antes de desmontar.
  const [formMounted, setFormMounted] = useState(false);
  useEffect(() => {
    if (showForm) {
      const t = window.setTimeout(() => {
        setFormMounted(true);
        // Cada vez que se reabre el form, los inputs vuelven a nacer readonly
        // para que Safari no autofilee sobre ellos.
        setReadOnlyInputs(true);
      }, 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setFormMounted(false), 500);
    return () => window.clearTimeout(t);
  }, [showForm]);

  // Si ya hay sesión activa (cookie de Auth.js), saltar la landing directo al
  // dashboard. Esto evita que el botón "atrás" del navegador después del login
  // regrese al formulario.
  //
  // Los guards `!submitting && !signing` tapan el race: cuando signIn() acaba
  // de setear la cookie, `status` pasa a "authenticated" antes de que el
  // siguiente paso de handleSubmit corra — sin guard, ese efecto redirige y
  // mata el overlay. Solo auto-redirigimos si llegaron a la landing YA
  // logueados (refresh, navegación directa, back desde dashboard).
  useEffect(() => {
    if (status === "authenticated" && !submitting && !signing) {
      router.replace(homeForRole(sessionData?.user?.role));
    }
  }, [status, submitting, signing, router, sessionData]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    // Llama a /api/auth/callback/credentials, que internamente invoca el
    // authorize() de Auth.js → api/auth/verify → Postgres. Con redirect:false
    // controlamos el flujo nosotros (overlay ceremonial + router.replace).
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setSubmitting(false);
      setError("Credenciales inválidas. Verifica el correo y la contraseña.");
      return;
    }

    // Leemos la sesión recién creada para saludar con el nombre real del
    // usuario (no el placeholder) y enrutar según su rol. Si por timing aún
    // no está, cae a los defaults.
    const session = await getSession();
    if (session?.user?.name) setSignedInName(session.user.name);
    const home = homeForRole(session?.user?.role);

    // signing=true antes que submitting=false, así nunca hay un frame en el
    // que ambos sean false con status="authenticated" (que dispararía la
    // redirección automática del useEffect).
    setSigning(true);
    setSubmitting(false);
    window.setTimeout(() => router.replace(home), 1000);
  };

  const fillDemo = () => {
    setEmail(DEMO_USER.email);
    setPassword(DEMO_USER.password);
    setError(null);
  };

  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-ember-vignette text-[#faf5eb]">
      {/* Background halos — breathing */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[34%] -z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="bg-ember-halo animate-ember-breathe-slow h-[560px] w-[1000px] opacity-50" />
      </div>
      <div
        aria-hidden
        className="absolute left-1/2 top-[42%] -z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="bg-ember-glow animate-ember-breathe h-[280px] w-[480px] opacity-55" />
      </div>

      {/* Vignette mask softens edges so the content stays legible */}
      <div aria-hidden className="bg-ember-vignette-mask absolute inset-0 -z-3" />

      {/* Rising embers */}
      {EMBERS.map((e, i) => (
        <span
          key={`ember-${i}`}
          aria-hidden
          className="ember-particle"
          style={
            {
              left: e.left,
              bottom: e.bottom,
              width: `${e.size}px`,
              height: `${e.size}px`,
              "--duration": e.dur,
              "--delay": e.delay,
              "--drift": e.drift,
              "--travel": e.travel,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Bright sparks */}
      {SPARKS.map((s, i) => (
        <span
          key={`spark-${i}`}
          aria-hidden
          className="ember-particle-spark"
          style={
            {
              left: s.left,
              top: s.top,
              "--spark-duration": s.dur,
              "--spark-delay": s.delay,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Header */}
      <header className="ember-intro [animation-delay:0ms] relative z-10 flex items-center justify-between px-12 pt-9">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[18px] font-bold leading-none text-[#e67e22]">
            E
          </span>
          <span className="h-3.5 w-px bg-[#3a322c]" />
          <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-[#a89d8e]">
            RESTAURANT OS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="block h-1.5 w-1.5 rounded-full bg-[#7c8a6a]" />
          <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-[#a89d8e]">
            SISTEMA EN LÍNEA
          </span>
        </div>
      </header>

      {/* Center */}
      <section className="relative z-10 flex min-h-[calc(100vh-160px)] flex-col items-center justify-center gap-10 px-6">
        {/* Top group: WELCOME TO + EMBER + ornaments */}
        <div className="flex flex-col items-center gap-6">
          <p
            className={`ember-intro [animation-delay:120ms] font-mono text-[14px] font-medium tracking-[0.42em] text-[#c2410c] transition-all duration-500 ease-out ${
              showForm ? "max-h-0 -translate-y-2 opacity-0" : "max-h-6 opacity-100"
            }`}
          >
            ·&nbsp;&nbsp;WELCOME&nbsp;TO&nbsp;&nbsp;·
          </p>

          {/* Wordmark — solid metallic gold, shrinks on morph */}
          <div className="relative">
            <div
              aria-hidden
              className={`wordmark-glow animate-ember-flicker-slow absolute inset-0 -z-10 scale-110 transition-opacity duration-500 ${
                showForm ? "opacity-0" : "opacity-40"
              }`}
            />
            <h1
              className={`ember-intro-wordmark [animation-delay:250ms] ember-wordmark font-display font-semibold leading-none transition-[font-size,letter-spacing] duration-700 ease-out ${
                showForm
                  ? "text-[64px] tracking-[0.12em]"
                  : "text-[220px] tracking-[0.04em]"
              }`}
            >
              EMBER
            </h1>
          </div>

          {/* Ornaments — fade out on morph */}
          <div
            className={`flex flex-col items-center gap-6 transition-all duration-500 ease-out ${
              showForm
                ? "max-h-0 -translate-y-2 overflow-hidden opacity-0"
                : "max-h-32 opacity-100"
            }`}
          >
            <span aria-hidden className="ember-intro [animation-delay:850ms] brand-line h-px w-[220px]" />

            <p className="ember-intro [animation-delay:1000ms] font-mono text-[10px] font-medium tracking-[0.5em] text-[#b45309]">
              EST&nbsp;&nbsp;·&nbsp;&nbsp;MMXXVI
            </p>

            <p className="ember-intro [animation-delay:1150ms] font-display text-[16px] italic tracking-[0.05em] text-[#a89d8e]">
              Cocina de brasas · Servicio de autor
            </p>
          </div>
        </div>

        {/* Morphing container: ghost button → form card.
            Usamos `h-` explícito en lugar de `max-h-` en el estado cerrado:
            con el form desmontado el contenedor no tiene contenido interno
            que le dé altura, así que `max-h-[48px]` lo dejaba en 0px y el
            botón ghost (absolute inset-0) quedaba invisible. */}
        <div
          className={`ember-intro [animation-delay:1350ms] relative overflow-hidden backdrop-blur-md transition-all duration-700 ease-out ${
            showForm
              ? "h-[620px] w-[440px] rounded-2xl border border-[#3a322c] bg-[#18120ecc]"
              : "h-[48px] w-[200px] rounded-sm border border-[#c2410c]/40 bg-transparent"
          }`}
        >
          {/* Ghost button content — fades out */}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className={`absolute inset-0 flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-[#faf5eb] transition-all duration-300 ${
              showForm
                ? "pointer-events-none opacity-0"
                : "opacity-100 hover:bg-[#c2410c]/10"
            }`}
          >
            Iniciar sesión
            <ArrowRight className="size-3" />
          </button>

          {/* Form content — fades in. El botón ghost de arriba siempre está
              renderizado; solo este bloque se monta cuando el usuario hace
              click. Esto saca el `<input type="password">` del DOM para que
              Safari/iCloud Keychain no muestre el popup de credenciales. */}
          {formMounted && (
          <div
            className={`p-8 transition-opacity duration-500 ${
              showForm
                ? "opacity-100 delay-300"
                : "pointer-events-none opacity-0"
            }`}
          >
            <h2 className="font-display text-[20px] font-medium tracking-[0.015em] text-[#faf5eb]">
              Bienvenido de vuelta
            </h2>
            <p className="mt-1.5 text-[13px] tracking-[0.015em] text-[#a89d8e]">
              Inicia sesión para continuar tu servicio
            </p>

            {/* Demo user chip */}
            <div className="mt-5 flex items-center justify-between gap-3 rounded-md border border-[#3a322c] bg-[#1f1f1f]/50 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-medium tracking-[0.22em] text-[#6b6660]">
                  USUARIO DE PRUEBA
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-[#a89d8e]">
                  chef@ember.com · brasa2026
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="shrink-0 rounded-md border border-[#c2410c]/50 px-3 py-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-[#faf5eb] transition-colors hover:bg-[#c2410c]/10"
              >
                Rellenar
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              autoComplete="off"
            >
              {/* Inputs señuelo: Safari/Keychain a veces autofilea el PRIMER
                  par username/password que encuentra. Si esos son inputs
                  ocultos, los reales quedan limpios y no se dispara el popup
                  sobre ellos. `aria-hidden` + `tabIndex={-1}` los saca de la
                  navegación y de lectores de pantalla. */}
              <input
                type="text"
                name="username"
                autoComplete="username"
                tabIndex={-1}
                aria-hidden
                className="absolute -left-[9999px] size-0 opacity-0"
              />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                tabIndex={-1}
                aria-hidden
                className="absolute -left-[9999px] size-0 opacity-0"
              />
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
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  readOnly={readOnlyInputs}
                  onFocus={unlockInputs}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  readOnly={readOnlyInputs}
                  onFocus={unlockInputs}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••"
                  className="flex-1 bg-transparent text-[14px] tracking-[0.05em] text-[#faf5eb] placeholder:text-[#a89d8e] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-[#6b6660] transition-colors hover:text-[#a89d8e]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <Eye className="size-4" strokeWidth={1.6} />
                  ) : (
                    <EyeOff className="size-4" strokeWidth={1.6} />
                  )}
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

              {/* Error */}
              {error && (
                <p className="mt-4 text-[12px] tracking-[0.02em] text-[#ff5c33]">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="bg-ember-button mt-6 flex h-[52px] w-full items-center justify-center rounded-[10px] text-[14px] font-semibold tracking-[0.02em] text-[#faf5eb] shadow-[0_8px_24px_-4px_rgba(194,65,12,0.4),inset_0_1px_0_rgba(250,245,235,0.2)] transition-all hover:shadow-[0_10px_28px_-4px_rgba(194,65,12,0.55),inset_0_1px_0_rgba(250,245,235,0.25)]"
              >
                Iniciar sesión
              </button>
            </form>

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

            {/* Back to landing */}
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="mt-6 block w-full font-mono text-[10px] font-medium tracking-[0.28em] text-[#6b6660] transition-colors hover:text-[#a89d8e]"
            >
              ← VOLVER
            </button>
          </div>
          )}
        </div>

        <p
          className={`ember-intro [animation-delay:1550ms] text-[11px] tracking-[0.02em] text-[#6b6660] transition-opacity duration-500 ${
            showForm ? "opacity-0" : "opacity-100"
          }`}
        >
          Acceso restringido al personal autorizado
        </p>
      </section>

      {/* Footer */}
      <footer className="ember-intro [animation-delay:1700ms] absolute inset-x-0 bottom-9 z-10 flex items-center justify-between px-12">
        <p className="font-mono text-[10px] tracking-[0.12em] text-[#6b6660]">
          © 2026 EMBER · Restaurant Operating System
        </p>
        <div className="flex items-center gap-5 font-mono text-[10px] tracking-[0.15em] text-[#6b6660]">
          <span>PRIVACIDAD</span>
          <span>TÉRMINOS</span>
          <span>v1.0</span>
        </div>
      </footer>

      {/* Overlay ceremonial al iniciar sesión — puente visual entre form y dashboard */}
      {signing && <SignInOverlay name={signedInName} />}
    </main>
  );
}

function SignInOverlay({ name }: { name: string }) {
  return (
    <div className="signin-overlay fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-[#0e0a08]">
      {/* Radial halo */}
      <div className="bg-ember-halo absolute left-1/2 top-1/2 -z-10 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-50" />

      <p className="font-mono text-[10px] font-medium tracking-[0.42em] text-[#c2410c]">
        ·&nbsp;&nbsp;BIENVENIDO&nbsp;&nbsp;·
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
            INICIANDO TURNO · CENA · T2
          </span>
        </div>
      </div>
    </div>
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
