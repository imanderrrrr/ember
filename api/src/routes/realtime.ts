import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eventHub, type DomainEvent } from "../lib/events.js";

const realtime = new Hono();

realtime.get("/", async (c) => {
  return streamSSE(c, async (stream) => {
    // Evento inicial de conexión
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ ok: true, timestamp: new Date().toISOString() }),
    });

    // Suscripción al EventHub de dominio
    const unsubscribe = eventHub.subscribe((evt: DomainEvent) => {
      stream.writeSSE({
        event: evt.type,
        data: JSON.stringify(evt.data),
      }).catch(() => {
        // el stream puede haberse cerrado
      });
    });

    // Heartbeat periódico (cada 20s) para mantener viva la conexión
    const pingInterval = setInterval(() => {
      stream.writeSSE({
        event: "ping",
        data: "{}",
      }).catch(() => {
        // el stream puede haberse cerrado
      });
    }, 20000);
    pingInterval.unref?.();

    stream.onAbort(() => {
      clearInterval(pingInterval);
      unsubscribe();
    });

    // Mantener la conexión abierta hasta que el cliente cierre
    await new Promise<void>((resolve) => {
      stream.onAbort(resolve);
    });
  });
});

export default realtime;
