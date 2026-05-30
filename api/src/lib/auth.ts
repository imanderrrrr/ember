import { hash, verify } from "@node-rs/argon2";

/**
 * Wrappers thin sobre argon2id. Parámetros conservadores adecuados para passwords
 * de servicio (no para enkriptación masiva ni para sistemas con throughput alto):
 *   - memoryCost 19 MiB
 *   - timeCost 2 iteraciones
 *   - parallelism 1
 *
 * Si subimos a producción real, ajustar según el hardware del container `api`.
 */
const ARGON2_OPTS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashSecret(secret: string): Promise<string> {
  return hash(secret, ARGON2_OPTS);
}

export async function verifySecret(
  hashed: string,
  candidate: string,
): Promise<boolean> {
  try {
    return await verify(hashed, candidate);
  } catch {
    return false;
  }
}
