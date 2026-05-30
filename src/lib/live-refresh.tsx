"use client";

import { useLiveRefresh } from "./use-live-refresh";

/**
 * Isla cliente mínima: monta el polling de `router.refresh()` sin obligar a
 * convertir toda una página de Server Components en cliente. Se coloca una vez
 * en la página (ej. el dashboard) y mantiene los datos del servidor "vivos".
 */
export function LiveRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  useLiveRefresh(intervalMs);
  return null;
}
