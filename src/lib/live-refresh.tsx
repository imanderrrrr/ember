"use client";

import { useLiveRefresh } from "./use-live-refresh";

/**
 * Isla cliente reactiva: suscribe a eventos en tiempo real (SSE) y dispara
 * `router.refresh()` reactivamente sin polling ni recargas completas.
 */
export function LiveRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  useLiveRefresh(intervalMs);
  return null;
}
