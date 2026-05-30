"use client";

import type { FloorPlan, SalonTable, Shape, Zone } from "./types";

/**
 * Cliente browser del módulo Salón.
 *
 * Habla con los Next route handlers en `/api/salon/*`, que son proxies
 * autenticados al api Hono. El browser nunca debe golpear directo al api.
 *
 * Convención: `throwOnError` interno — devolvemos el body parseado o
 * lanzamos un Error con el status. El editor maneja los errores arriba.
 */

async function jsonOrThrow<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

function postJson(path: string, body: unknown) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchJson(path: string, body: unknown) {
  return fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── Floor plan ─── */

export async function getFloorPlan(): Promise<FloorPlan> {
  return jsonOrThrow(fetch("/api/salon/floor-plan", { cache: "no-store" }));
}

/* ─── Zones ─── */

export async function createZone(input: { name: string }): Promise<Zone> {
  return jsonOrThrow(postJson("/api/salon/zones", input));
}

export async function updateZone(
  id: string,
  input: { name?: string; ord?: number },
): Promise<Zone> {
  return jsonOrThrow(patchJson(`/api/salon/zones/${id}`, input));
}

export async function deleteZone(id: string): Promise<void> {
  await jsonOrThrow(fetch(`/api/salon/zones/${id}`, { method: "DELETE" }));
}

/* ─── Tables ─── */

export async function createTable(input: {
  zoneId: string;
  label: string;
  shape: "round" | "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  seats?: number;
  rotation?: number;
  status?: string;
}): Promise<SalonTable> {
  return jsonOrThrow(postJson("/api/salon/tables", input));
}

export async function updateTable(
  id: string,
  input: Partial<Omit<SalonTable, "id">>,
): Promise<SalonTable> {
  return jsonOrThrow(patchJson(`/api/salon/tables/${id}`, input));
}

export async function deleteTable(id: string): Promise<void> {
  await jsonOrThrow(fetch(`/api/salon/tables/${id}`, { method: "DELETE" }));
}

/* ─── Shapes ─── */

export async function createShape(input: {
  zoneId?: string | null;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string | null;
}): Promise<Shape> {
  return jsonOrThrow(postJson("/api/salon/shapes", input));
}

export async function updateShape(
  id: string,
  input: Partial<Omit<Shape, "id">>,
): Promise<Shape> {
  return jsonOrThrow(patchJson(`/api/salon/shapes/${id}`, input));
}

export async function deleteShape(id: string): Promise<void> {
  await jsonOrThrow(fetch(`/api/salon/shapes/${id}`, { method: "DELETE" }));
}
