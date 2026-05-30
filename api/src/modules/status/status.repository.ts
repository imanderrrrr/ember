import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { statusChecks } from "../../db/schema.js";

export type Component = "frontend" | "api" | "database";

/**
 * `pingDb` — chequeo de vida de Postgres. Ejecuta `select 1` y mide la latencia
 * de ida y vuelta. Nunca lanza: si la DB está caída, devuelve `ok: false` con
 * el mensaje de error para registrarlo en el sondeo.
 */
export async function pingDb(): Promise<{ ok: boolean; latencyMs: number; detail: string | null }> {
  const start = performance.now();
  try {
    await db.execute(sql`select 1`);
    return { ok: true, latencyMs: Math.round(performance.now() - start), detail: null };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      detail: err instanceof Error ? err.message : "error desconocido",
    };
  }
}

/**
 * `recordCheck` — inserta un sondeo, con throttle de ~1/min por componente.
 * Esto evita que una página abierta haga polling cada 60s e infle la tabla:
 * si ya hay un sondeo de ese componente en los últimos 55s, no inserta.
 * Devuelve `true` si insertó.
 */
export async function recordCheck(
  component: Component,
  ok: boolean,
  latencyMs: number | null,
  detail: string | null = null,
): Promise<boolean> {
  const recent = await db
    .select({ id: statusChecks.id })
    .from(statusChecks)
    .where(
      sql`${statusChecks.component} = ${component} and ${statusChecks.checkedAt} > now() - interval '55 seconds'`,
    )
    .limit(1);

  if (recent.length > 0) return false;

  await db.insert(statusChecks).values({ component, ok, latencyMs, detail });
  return true;
}

export interface DailyRow {
  component: string;
  day: string; // 'YYYY-MM-DD' (UTC)
  total: number;
  fails: number;
}

/**
 * `getDailyRollup` — agrupa los sondeos de los últimos 90 días por componente
 * y día (UTC), con el total de chequeos y cuántos fallaron. La página arma las
 * barras y el % a partir de esto.
 */
export async function getDailyRollup(): Promise<DailyRow[]> {
  const dayExpr = sql<string>`to_char(date_trunc('day', ${statusChecks.checkedAt}), 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      component: statusChecks.component,
      day: dayExpr,
      total: sql<number>`count(*)`,
      fails: sql<number>`count(*) filter (where not ${statusChecks.ok})`,
    })
    .from(statusChecks)
    .where(sql`${statusChecks.checkedAt} > now() - interval '90 days'`)
    .groupBy(statusChecks.component, dayExpr)
    .orderBy(dayExpr);

  // count(*) llega como string (bigint) desde postgres-js → coerción a number.
  return rows.map((r) => ({
    component: r.component,
    day: r.day,
    total: Number(r.total),
    fails: Number(r.fails),
  }));
}
