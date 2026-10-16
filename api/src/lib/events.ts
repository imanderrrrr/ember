import { EventEmitter } from "node:events";

export type DomainEventType =
  | "order:created"
  | "order:status_updated"
  | "table:status_updated"
  | "sale:recorded";

export interface DomainEvent<T = unknown> {
  type: DomainEventType;
  data: T;
  timestamp: string;
}

class EventHub extends EventEmitter {
  emitEvent<T>(type: DomainEventType, data: T): void {
    const event: DomainEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit("domain_event", event);
    this.emit(type, event);
  }

  subscribe(listener: (event: DomainEvent) => void): () => void {
    this.on("domain_event", listener);
    return () => {
      this.off("domain_event", listener);
    };
  }
}

export const eventHub = new EventHub();
eventHub.setMaxListeners(200);
