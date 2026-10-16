"use client";

import { useRealtimeEvents, type DomainEventType } from "./use-realtime-events";

/**
 * Hook reactivo de sincronización en tiempo real.
 * Reemplaza el polling destructivo de setInterval(..., 4000) por Server-Sent Events (SSE).
 * Se actualiza reactivamente solo cuando se emite un evento relevante de dominio.
 */
export function useLiveRefresh(events?: DomainEventType[] | number) {
  const eventList = Array.isArray(events) ? events : undefined;
  useRealtimeEvents({
    events: eventList,
    refreshOnEvent: true,
  });
}
