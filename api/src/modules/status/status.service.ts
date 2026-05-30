import {
  type Component,
  type DailyRow,
  getDailyRollup,
  pingDb,
  recordCheck,
} from "./status.repository.js";
import { getStatusTopology, type StatusTopology } from "./status.config.js";

export type DayStatus = "operational" | "degraded" | "down" | "nodata";

export interface DayPoint {
  date: string; // 'YYYY-MM-DD' (UTC)
  status: DayStatus;
  total: number; // sondeos registrados ese día (0 = sin monitoreo → nodata)
  fails: number;
}

export interface StatusReport {
  database: { ok: boolean; latencyMs: number; detail: string | null };
  topology: StatusTopology;
  history: Record<Component, DayPoint[]>; // 90 puntos, viejo → nuevo
  uptime90: Record<Component, number | null>; // % sobre días CON datos; null si 0 días
  coverage: Record<Component, number>; // nº de días (de 90) con al menos un sondeo
  generatedAt: string;
}

const WINDOW_DAYS = 90;
const COMPONENTS: Component[] = ["frontend", "api", "database"];

/** Devuelve las últimas `WINDOW_DAYS` fechas (UTC) como 'YYYY-MM-DD', viejo → hoy. */
function lastDays(): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Construye la serie de 90 días de un componente a partir del rollup diario.
 *
 * Modelo HONESTO (el de la pantalla de Pencil): un día sin sondeos registrados
 * es `nodata` (celda gris "Sin historial suficiente"), NO se asume operativo.
 * La disponibilidad se calcula SOLO sobre los días que tienen datos reales; si
 * no hay ninguno, `uptime` es `null` ("Pendiente de cálculo"). `coverage` dice
 * cuántos de los 90 días tienen evidencia, para anotar la cobertura sin mentir.
 */
function buildSeries(
  rows: DailyRow[],
  days: string[],
): { points: DayPoint[]; uptime: number | null; coverage: number } {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  let okChecks = 0;
  let totalChecks = 0;
  let coverage = 0;

  const points: DayPoint[] = days.map((date) => {
    const bucket = byDay.get(date);
    if (!bucket || bucket.total === 0) {
      return { date, status: "nodata", total: 0, fails: 0 };
    }
    coverage += 1;
    okChecks += bucket.total - bucket.fails;
    totalChecks += bucket.total;
    let status: DayStatus = "operational";
    if (bucket.fails >= bucket.total) status = "down";
    else if (bucket.fails > 0) status = "degraded";
    return { date, status, total: bucket.total, fails: bucket.fails };
  });

  const uptime = totalChecks > 0 ? (okChecks / totalChecks) * 100 : null;
  return { points, uptime, coverage };
}

/** Ping aislado a la base de datos (para `GET /status/db` y monitores externos). */
export async function pingDatabase() {
  const r = await pingDb();
  return { component: "database" as const, ...r, checkedAt: new Date().toISOString() };
}

/**
 * Sondea la base de datos y la propia API, registra los sondeos (con throttle)
 * y, si el frontend reportó su estado, también lo registra. Luego devuelve el
 * histórico HONESTO de 90 días por componente. El frontend (web) es quien
 * reporta su propia vida porque la API no puede observarlo desde adentro.
 */
export async function probeAndReport(
  frontend?: { ok: boolean; latencyMs: number | null; detail?: string | null },
): Promise<StatusReport> {
  const dbResult = await pingDb();
  const topology = getStatusTopology();

  await Promise.all([
    recordCheck(
      "api",
      true,
      null,
      `${topology.api.containerName} on ${topology.api.deviceName}`,
    ),
    recordCheck("database", dbResult.ok, dbResult.latencyMs, dbResult.detail),
    frontend
      ? recordCheck("frontend", frontend.ok, frontend.latencyMs ?? null, frontend.detail ?? null)
      : Promise.resolve(false),
  ]);

  const rollup = await getDailyRollup();
  const days = lastDays();

  const history = {} as Record<Component, DayPoint[]>;
  const uptime90 = {} as Record<Component, number | null>;
  const coverage = {} as Record<Component, number>;
  for (const comp of COMPONENTS) {
    const series = buildSeries(
      rollup.filter((r) => r.component === comp),
      days,
    );
    history[comp] = series.points;
    uptime90[comp] = series.uptime;
    coverage[comp] = series.coverage;
  }

  return {
    database: dbResult,
    topology,
    history,
    uptime90,
    coverage,
    generatedAt: new Date().toISOString(),
  };
}
