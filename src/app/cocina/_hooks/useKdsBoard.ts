"use client";

import { useEffect, useMemo, useState } from "react";
import { updateTable } from "@/app/salon/_lib/client-api";
import { useRealtimeEvents } from "@/lib/use-realtime-events";
import { updateKitchenOrder } from "../_lib/orders";
import type { Station, Ticket, TicketStatus } from "../_lib/kds-data";

export function useKdsBoard(initialTickets: Ticket[]) {
  const [activeStation, setActiveStation] = useState<Station | "todos">("todos");
  const [notified, setNotified] = useState<Set<string>>(new Set());

  // Overlay optimista sobre los datos del servidor: cambios de estado y
  // entregas que el cocinero hace en este board, antes de que el siguiente
  // poll/SSE confirme. `nowMs` es el reloj para los cronómetros en vivo.
  const [overrides, setOverrides] = useState<Map<string, TicketStatus>>(new Map());
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [nowMs, setNowMs] = useState(0);
  const [prevInit, setPrevInit] = useState(initialTickets);

  // Sincronización en tiempo real vía SSE: re-consulta las órdenes del servidor
  // únicamente cuando un mesero crea una comanda ("order:created") o se actualiza ("order:status_updated").
  useRealtimeEvents({
    events: ["order:created", "order:status_updated"],
    refreshOnEvent: true,
  });

  // Reloj para los cronómetros: el cálculo de "ahora" vive en el callback del
  // intervalo (no en el render ni síncrono en el effect), manteniendo el render
  // puro. El primer tick llega a ~1s del montaje.
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Cuando llega data fresca del servidor (poll/SSE), reconciliamos el overlay
  // optimista con la nueva verdad: conservamos SOLO los cambios que el backend
  // aún no refleja. Así, si un poll llega antes de que el PATCH se propague, el
  // ticket no parpadea de vuelta; y en cuanto el servidor confirma (o deja de
  // devolver la orden entregada), el overlay se limpia solo.
  if (initialTickets !== prevInit) {
    setPrevInit(initialTickets);
    setOverrides((prev) => {
      const next = new Map<string, TicketStatus>();
      for (const [id, status] of prev) {
        const server = initialTickets.find((t) => t.id === id);
        // Mantener el override solo si el servidor todavía no lo refleja.
        if (server && server.status !== status) next.set(id, status);
      }
      return next;
    });
    setRemoved((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        // Seguir ocultando mientras el servidor aún devuelva la orden (el
        // "entregada" no se ha propagado); al filtrarse, dejamos de ocultar.
        if (initialTickets.some((t) => t.id === id)) next.add(id);
      }
      return next;
    });
  }

  // Tickets a mostrar: órdenes del servidor + overlay optimista + cronómetro.
  const tickets = useMemo<Ticket[]>(
    () =>
      initialTickets
        .filter((t) => !removed.has(t.id))
        .map((t) => ({
          ...t,
          status: overrides.get(t.id) ?? t.status,
          elapsedSec:
            t.startedAtMs != null && nowMs > 0
              ? Math.max(0, Math.floor((nowMs - t.startedAtMs) / 1000))
              : t.elapsedSec,
        })),
    [initialTickets, overrides, removed, nowMs],
  );

  const visible = useMemo(
    () =>
      activeStation === "todos"
        ? tickets
        : tickets.filter((t) => t.station === activeStation),
    [tickets, activeStation],
  );

  // Una orden activa que supera su objetivo se considera "demorada" (se mueve
  // a esa columna automáticamente), sin tocar su estado real en el backend.
  const effectiveStatus = (t: Ticket): TicketStatus =>
    (t.status === "nueva" || t.status === "preparacion") &&
    t.elapsedSec > t.targetSec
      ? "demorada"
      : t.status;

  const byStatus = (s: TicketStatus) =>
    visible.filter((t) => effectiveStatus(t) === s);
  const nuevas = byStatus("nueva");
  const preparacion = byStatus("preparacion");
  const listas = byStatus("lista");
  const demoradas = byStatus("demorada");

  // Métricas en vivo (sobre todos los tickets activos, no solo el filtro).
  const active = tickets.filter((t) => t.status !== "lista");
  const avgDelaySec =
    active.length > 0
      ? Math.round(active.reduce((a, t) => a + t.elapsedSec, 0) / active.length)
      : 0;
  const criticas = tickets.filter((t) => effectiveStatus(t) === "demorada").length;

  const advance = (id: string, to: TicketStatus) => {
    const ticket = tickets.find((t) => t.id === id);
    // Optimista: el ticket se mueve de columna ya; el siguiente poll lo
    // confirma desde el backend.
    setOverrides((prev) => new Map(prev).set(id, to));
    if (ticket?.orderId && (to === "preparacion" || to === "lista")) {
      updateKitchenOrder(ticket.orderId, to).catch((e) =>
        console.error("[cocina] updateKitchenOrder failed", e),
      );
    }
  };

  const deliver = (t: Ticket) => {
    // Optimista: se quita del board; el backend marca entregada y libera la
    // mesa (→ esperando cuenta), lo que el salón en vivo verá en su próximo
    // refresco.
    setRemoved((prev) => new Set(prev).add(t.id));
    if (t.orderId) {
      updateKitchenOrder(t.orderId, "entregada").catch((e) =>
        console.error("[cocina] updateKitchenOrder failed", e),
      );
    }
    if (t.tableId) {
      updateTable(t.tableId, { status: "esperando" }).catch((e) =>
        console.error("[cocina] updateTable failed", e),
      );
    }
  };

  const toggleNotify = (id: string) =>
    setNotified((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return {
    activeStation,
    setActiveStation,
    notified,
    toggleNotify,
    tickets,
    visible,
    nuevas,
    preparacion,
    listas,
    demoradas,
    effectiveStatus,
    avgDelaySec,
    criticas,
    advance,
    deliver,
  };
}
