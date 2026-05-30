const DEFAULT_ORIGINS = ["http://localhost:3000", "http://web:3000"];

function splitOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function resolveCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const explicit = splitOrigins(env.CORS_ORIGINS);
  if (explicit.length > 0) return explicit;

  const frontendOrigin = splitOrigins(env.FRONTEND_ORIGIN);
  if (frontendOrigin.length > 0) return frontendOrigin;

  return DEFAULT_ORIGINS;
}
