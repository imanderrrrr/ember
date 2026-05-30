import type { Component } from "./status.repository.js";

export type RuntimeKind = "docker";
export type NodeRelation = "local" | "remote";

export interface ServiceNode {
  component: Component;
  serviceName: string;
  deviceName: string;
  deviceHost: string;
  containerName: string;
  port: number | null;
  runtime: RuntimeKind;
  relationToBackend: NodeRelation;
  configured: boolean;
}

export type StatusTopology = Record<Component, ServiceNode>;

function numberFrom(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function hostFromUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname || null;
  } catch {
    return null;
  }
}

function portFromUrl(value: string | undefined): number | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.port ? Number(url.port) : null;
  } catch {
    return null;
  }
}

export function getStatusTopology(env: NodeJS.ProcessEnv = process.env): StatusTopology {
  const backendPort = numberFrom(env.STATUS_BACKEND_PORT) ?? numberFrom(env.PORT) ?? 3001;
  const databaseHost = env.STATUS_DATABASE_DEVICE_HOST ?? hostFromUrl(env.DATABASE_URL);
  const databasePort = numberFrom(env.STATUS_DATABASE_PORT) ?? portFromUrl(env.DATABASE_URL) ?? 5432;
  const frontendHost =
    env.STATUS_FRONTEND_DEVICE_HOST ?? env.FRONTEND_HOST ?? hostFromUrl(env.FRONTEND_ORIGIN);
  const frontendPort =
    numberFrom(env.STATUS_FRONTEND_PORT) ?? portFromUrl(env.FRONTEND_ORIGIN) ?? 3000;

  return {
    frontend: {
      component: "frontend",
      serviceName: "Frontend",
      deviceName: env.STATUS_FRONTEND_DEVICE_NAME ?? "PC Frontend",
      deviceHost: frontendHost ?? "pendiente",
      containerName: env.STATUS_FRONTEND_CONTAINER_NAME ?? "ember-web",
      port: frontendPort,
      runtime: "docker",
      relationToBackend: "remote",
      configured: Boolean(frontendHost),
    },
    api: {
      component: "api",
      serviceName: "Backend",
      deviceName: env.STATUS_BACKEND_DEVICE_NAME ?? env.STATUS_DEVICE_NAME ?? "PC Backend",
      deviceHost: env.STATUS_BACKEND_DEVICE_HOST ?? env.STATUS_DEVICE_HOST ?? "pendiente",
      containerName: env.STATUS_BACKEND_CONTAINER_NAME ?? env.STATUS_CONTAINER_NAME ?? "ember-api",
      port: backendPort,
      runtime: "docker",
      relationToBackend: "local",
      configured: true,
    },
    database: {
      component: "database",
      serviceName: "Base de datos",
      deviceName: env.STATUS_DATABASE_DEVICE_NAME ?? "PC Base de datos",
      deviceHost: databaseHost ?? "pendiente",
      containerName: env.STATUS_DATABASE_CONTAINER_NAME ?? "ember-db",
      port: databasePort,
      runtime: "docker",
      relationToBackend: "remote",
      configured: Boolean(databaseHost),
    },
  };
}
