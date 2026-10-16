"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export type DomainEventType =
  | "order:created"
  | "order:status_updated"
  | "table:status_updated"
  | "sale:recorded";

export interface RealtimeEvent<T = unknown> {
  type: DomainEventType;
  data: T;
  timestamp?: string;
}

export interface UseRealtimeEventsOptions {
  /** Tipos de eventos a los cuales suscribirse (si se omite, escucha todos) */
  events?: DomainEventType[];
  /** Callback ejecutado al recibir un evento relevante */
  onEvent?: (event: RealtimeEvent) => void;
  /** Si es true, ejecuta router.refresh() de forma reactiva al recibir un evento relevante (default: true) */
  refreshOnEvent?: boolean;
  /** Ventana de debouncing en ms para evitar múltiples refresh consecutivos (default: 150ms) */
  debounceMs?: number;
  /** Habilitar o pausar la conexión SSE (default: true) */
  enabled?: boolean;
}

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 15000;
const BACKOFF_MULTIPLIER = 1.5;

/**
 * Hook reactivo de sincronización en tiempo real vía Server-Sent Events (SSE).
 * Erradica el polling agresivo de 4 segundos:
 *   - Establece un canal unidireccional y eficiente con el backend Hono.
 *   - Maneja reconexión automática resiliente con backoff exponencial y jitter.
 *   - Invalida la caché o muta el estado local únicamente cuando ocurre un evento de dominio relevante.
 */
export function useRealtimeEvents({
  events,
  onEvent,
  refreshOnEvent = true,
  debounceMs = 150,
  enabled = true,
}: UseRealtimeEventsOptions = {}) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const onEventRef = useRef(onEvent);
  const eventsFilterRef = useRef(events);

  useEffect(() => {
    onEventRef.current = onEvent;
    eventsFilterRef.current = events;
  });

  const triggerRefresh = useCallback(() => {
    if (!refreshOnEvent) return;
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      router.refresh();
    }, debounceMs);
  }, [router, refreshOnEvent, debounceMs]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let isSubscribed = true;

    function connect() {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const eventSource = new EventSource("/api/events");
      esRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isSubscribed) return;
        setIsConnected(true);
        retryCountRef.current = 0; // Reset backoff tras conexión exitosa
      };

      const handleDomainEvent = (type: DomainEventType, e: MessageEvent) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(e.data);
          const event: RealtimeEvent = { type, data };

          const filter = eventsFilterRef.current;
          if (!filter || filter.includes(type)) {
            setLastEvent(event);
            if (onEventRef.current) {
              onEventRef.current(event);
            }
            triggerRefresh();
          }
        } catch (err) {
          console.error(`[realtime] Error parseando evento ${type}:`, err);
        }
      };

      // Escuchar eventos de dominio específicos
      const DOMAIN_EVENT_TYPES: DomainEventType[] = [
        "order:created",
        "order:status_updated",
        "table:status_updated",
        "sale:recorded",
      ];

      for (const eventType of DOMAIN_EVENT_TYPES) {
        eventSource.addEventListener(eventType, (e: MessageEvent) => {
          handleDomainEvent(eventType, e);
        });
      }

      eventSource.onerror = () => {
        if (!isSubscribed) return;
        setIsConnected(false);
        eventSource.close();
        esRef.current = null;

        // Cálculo de backoff exponencial con jitter
        const delay = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCountRef.current),
          MAX_RETRY_DELAY,
        ) + Math.random() * 500;

        retryCountRef.current += 1;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isSubscribed) connect();
        }, delay);
      };
    }

    connect();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, triggerRefresh]);

  return { isConnected, lastEvent };
}
