/**
 * Orquestador del estatus del sistema (lado servidor).
 *
 * Replica el modelo HONESTO de la pantalla de Pencil (`Status · Honest`):
 * se muestra "verificado" SOLO cuando hay evidencia real, y se calcula
 * disponibilidad únicamente sobre días con datos. Donde no hay evidencia, la
 * pantalla lo dice: "Pendiente de cálculo", "Sin historial suficiente",
 * "No conectada". Nunca se inventan métricas.
 *
 * Fuentes reales por componente:
 *   - Frontend  → si este código corre, la web sirve la página (auto-reporte).
 *   - Backend   → fetch a `${API_URL}/status` (round-trip real). 200 = verificado.
 *   - Base de datos → la API ejecuta `select 1` y su resultado viaja en la
 *                 respuesta. Si la API está caída, la DB queda "pendiente".
 *
 * El histórico de 90 días y la cobertura los calcula la API (dueña de
 * `status_checks`); aquí solo se interpretan para la vista.
 */

const API_URL = process.env.API_URL ?? "http://api:3001";

export type ComponentKey = "frontend" | "backend" | "database";
export type IconKind = "monitor" | "server" | "database";
export type DayStatus = "operational" | "degraded" | "down" | "nodata";
export type BadgeVariant = "ok" | "warn" | "down";
export type CompState = "operational" | "degraded" | "down" | "pending";

export interface DayPoint {
  date: string; // 'YYYY-MM-DD' (UTC)
  status: DayStatus;
  total: number;
  fails: number;
}

export interface Badge {
  text: string;
  variant: BadgeVariant;
}

export interface ComponentVM {
  key: ComponentKey;
  name: string;
  slug: string;
  icon: IconKind;
  description: string;
  state: CompState;
  verified: boolean;
  badge: Badge;
  estadoActual: string;
  uptimeLabel: string;
  source: string;
  sourceConnected: boolean;
  deployment: DeploymentInfo;
  history: DayPoint[];
  coverage: number; // días (de 90) con datos reales
  latencyMs: number | null;
}

export interface StatusVM {
  headerBadges: Badge[];
  global: { desc: string; stats: { label: string; value: string }[] };
  components: ComponentVM[];
  monitoringActive: boolean;
  generatedAt: string;
}

interface ApiReport {
  database: { ok: boolean; latencyMs: number; detail: string | null };
  topology?: Record<"frontend" | "api" | "database", DeploymentInfo>;
  history: Record<"frontend" | "api" | "database", DayPoint[]>;
  uptime90: Record<"frontend" | "api" | "database", number | null>;
  coverage: Record<"frontend" | "api" | "database", number>;
  generatedAt: string;
}

const WINDOW_DAYS = 90;

export interface DeploymentInfo {
  component: "frontend" | "api" | "database";
  serviceName: string;
  deviceName: string;
  deviceHost: string;
  containerName: string;
  port: number | null;
  runtime: "docker";
  relationToBackend: "local" | "remote";
  configured: boolean;
}

function fallbackDeployment(component: DeploymentInfo["component"]): DeploymentInfo {
  const defaults: Record<DeploymentInfo["component"], Omit<DeploymentInfo, "component">> = {
    frontend: {
      serviceName: "Frontend",
      deviceName: "PC Frontend",
      deviceHost: "pendiente",
      containerName: "ember-web",
      port: 3000,
      runtime: "docker",
      relationToBackend: "remote",
      configured: false,
    },
    api: {
      serviceName: "Backend",
      deviceName: "PC Backend",
      deviceHost: "pendiente",
      containerName: "ember-api",
      port: 3001,
      runtime: "docker",
      relationToBackend: "local",
      configured: true,
    },
    database: {
      serviceName: "Base de datos",
      deviceName: "PC Base de datos",
      deviceHost: "pendiente",
      containerName: "ember-db",
      port: 5432,
      runtime: "docker",
      relationToBackend: "remote",
      configured: false,
    },
  };

  return { component, ...defaults[component] };
}

/** 90 celdas `nodata` — usado cuando aún no hay ninguna evidencia. */
function emptyHistory(): DayPoint[] {
  const now = new Date();
  const out: DayPoint[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    out.push({ date: d.toISOString().slice(0, 10), status: "nodata", total: 0, fails: 0 });
  }
  return out;
}

function uptimeLabel(uptime: number | null, coverage: number): string {
  if (uptime === null || coverage === 0) return "Pendiente de cálculo";
  return `${uptime.toFixed(1)} % · ${coverage}/${WINDOW_DAYS} días`;
}

function badgeFor(state: CompState, verified: boolean): Badge {
  if (!verified || state === "pending") return { text: "PENDIENTE", variant: "warn" };
  if (state === "down") return { text: "CAÍDO VERIFICADO", variant: "down" };
  if (state === "degraded") return { text: "DEGRADADO VERIFICADO", variant: "warn" };
  return { text: "OPERATIVO VERIFICADO", variant: "ok" };
}

function estadoActualFor(state: CompState, verified: boolean): string {
  if (!verified || state === "pending") return "Sin verificación";
  if (state === "down") return "Caído verificado";
  if (state === "degraded") return "Degradado verificado";
  return "Operativo verificado";
}

export async function getStatus(): Promise<StatusVM> {
  // El frontend está vivo si esto corre; medimos su propio overhead (sub-ms).
  const t0 = performance.now();
  const feLatency = Math.max(0, Math.round(performance.now() - t0));

  // Backend: la latencia es el round-trip real a la API.
  const beStart = performance.now();
  let api: ApiReport | null = null;
  try {
    const res = await fetch(`${API_URL}/status?feOk=1&feMs=${feLatency}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as Partial<ApiReport> | null;
      // Solo confiamos en la respuesta si trae la forma esperada; parcial → caído.
      if (json && json.history && json.uptime90 && json.coverage && json.database) {
        api = json as ApiReport;
      }
    }
  } catch {
    api = null;
  }
  const beLatency = Math.round(performance.now() - beStart);

  const backendUp = api !== null;
  const dbUp = api?.database?.ok ?? false;

  // ─── Frontend ───────────────────────────────────────────────────────────
  const feState: CompState = "operational"; // esta página renderiza → sirve
  const frontend: ComponentVM = {
    key: "frontend",
    name: "Frontend",
    slug: "frontend.ui",
    icon: "monitor",
    description:
      "La aplicación web responde y reporta su estado de runtime en vivo a la API. El historial de 90 días se está acumulando desde el primer sondeo.",
    state: feState,
    verified: true,
    badge: badgeFor(feState, true),
    estadoActual: estadoActualFor(feState, true),
    uptimeLabel: uptimeLabel(api?.uptime90?.frontend ?? null, api?.coverage?.frontend ?? 0),
    source: "Auto-reporte web",
    sourceConnected: true,
    deployment: api?.topology?.frontend ?? fallbackDeployment("frontend"),
    history: api?.history?.frontend ?? emptyHistory(),
    coverage: api?.coverage?.frontend ?? 0,
    latencyMs: feLatency,
  };

  // ─── Backend ────────────────────────────────────────────────────────────
  const beState: CompState = backendUp ? "operational" : "down";
  const backend: ComponentVM = {
    key: "backend",
    name: "Backend",
    slug: "backend.api",
    icon: "server",
    description: backendUp
      ? "Endpoint /status activo: responde verificando la API y ejecutando un ping a la base de datos. El historial se está acumulando."
      : "No respondió el endpoint /status del API. El estado queda pendiente hasta restablecer la fuente real.",
    state: beState,
    verified: backendUp,
    badge: badgeFor(beState, backendUp),
    estadoActual: estadoActualFor(beState, backendUp),
    uptimeLabel: uptimeLabel(api?.uptime90?.api ?? null, api?.coverage?.api ?? 0),
    source: backendUp ? "GET /status" : "No conectada",
    sourceConnected: backendUp,
    deployment: api?.topology?.api ?? fallbackDeployment("api"),
    history: api?.history?.api ?? emptyHistory(),
    coverage: api?.coverage?.api ?? 0,
    latencyMs: backendUp ? beLatency : null,
  };

  // ─── Base de datos ────────────────────────────────────────────────────────
  const dbState: CompState = !backendUp ? "pending" : dbUp ? "operational" : "down";
  const dbVerified = backendUp && dbUp;
  const database: ComponentVM = {
    key: "database",
    name: "Base de datos",
    slug: "database.primary",
    icon: "database",
    description: dbVerified
      ? "Conexión verificada mediante un ping select 1 ejecutado por la API. El historial de consultas se está acumulando."
      : "No hay evidencia de conexión a la base de datos. No se calcula disponibilidad sin un ping verificado.",
    state: dbState,
    verified: dbVerified,
    badge: badgeFor(dbState, dbVerified),
    estadoActual: estadoActualFor(dbState, dbVerified),
    uptimeLabel: uptimeLabel(api?.uptime90?.database ?? null, api?.coverage?.database ?? 0),
    source: dbVerified ? "API · select 1" : "No conectada",
    sourceConnected: dbVerified,
    deployment: api?.topology?.database ?? fallbackDeployment("database"),
    history: api?.history?.database ?? emptyHistory(),
    coverage: api?.coverage?.database ?? 0,
    latencyMs: dbVerified ? api?.database?.latencyMs ?? null : null,
  };

  const components = [frontend, backend, database];

  // ─── Cabecera ─────────────────────────────────────────────────────────────
  const historyComplete = components.every((c) => c.coverage >= WINDOW_DAYS);
  const headerBadges: Badge[] = [
    historyComplete
      ? { text: "HISTORIAL COMPLETO", variant: "ok" }
      : { text: "HISTORIAL PENDIENTE", variant: "warn" },
    backendUp
      ? { text: "HEALTH CHECKS ACTIVOS", variant: "ok" }
      : { text: "SIN HEALTH CHECKS", variant: "warn" },
  ];

  // ─── Estado global ─────────────────────────────────────────────────────────
  const global = {
    desc: backendUp
      ? "Health checks activos para los tres componentes (frontend, API y base de datos). La disponibilidad se calcula solo sobre días con datos reales; el historial de 90 días se está acumulando y el feed de incidentes aún no está conectado."
      : "No se encontraron endpoints de health, logs, historial de incidentes ni conexión de base de datos verificable. No se calcula disponibilidad sin una fuente real.",
    stats: [
      { label: "Servicios", value: backendUp ? "3 activos" : "3 definidos" },
      { label: "Disponibilidad", value: backendUp ? "En medición" : "Pendiente" },
      { label: "Ventana", value: "90 días" },
      { label: "Incidentes", value: "Sin feed" },
    ],
  };

  return {
    headerBadges,
    global,
    components,
    monitoringActive: backendUp,
    generatedAt: api?.generatedAt ?? new Date().toISOString(),
  };
}
