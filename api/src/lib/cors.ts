const DEFAULT_ORIGINS = ["http://localhost:3000", "http://web:3000"];

type HonoCorsOrigin = string[] | ((origin: string) => string | null);

function splitOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", "[^.]+");
  return new RegExp(`^${escaped}$`);
}

export function resolveCorsOrigin(env: NodeJS.ProcessEnv = process.env): HonoCorsOrigin {
  const explicit = splitOrigins(env.CORS_ORIGINS);
  if (explicit.length > 0) {
    const wildcardPatterns = explicit.filter((origin) => origin.includes("*"));
    const exactOrigins = explicit.filter((origin) => !origin.includes("*"));
    if (wildcardPatterns.length === 0) return exactOrigins;

    const wildcardMatchers = wildcardPatterns.map(wildcardToRegExp);
    return (origin: string) => {
      if (exactOrigins.includes(origin)) return origin;
      return wildcardMatchers.some((matcher) => matcher.test(origin)) ? origin : null;
    };
  }

  const frontendOrigin = splitOrigins(env.FRONTEND_ORIGIN);
  if (frontendOrigin.length > 0) return frontendOrigin;

  return DEFAULT_ORIGINS;
}

export const resolveCorsOrigins = resolveCorsOrigin;
