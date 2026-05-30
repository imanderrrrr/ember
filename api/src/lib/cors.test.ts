import test from "node:test";
import assert from "node:assert/strict";
import { resolveCorsOrigin } from "./cors.js";

test("resolveCorsOrigins reads comma-separated remote frontend origins", () => {
  assert.deepEqual(
    resolveCorsOrigin({
      CORS_ORIGINS: " http://192.168.1.20:3000, http://frontend.local:3000 ",
    } as NodeJS.ProcessEnv),
    ["http://192.168.1.20:3000", "http://frontend.local:3000"],
  );
});

test("resolveCorsOrigins falls back to FRONTEND_ORIGIN for single-node setup", () => {
  assert.deepEqual(
    resolveCorsOrigin({
      FRONTEND_ORIGIN: "http://192.168.1.20:3000",
    } as NodeJS.ProcessEnv),
    ["http://192.168.1.20:3000"],
  );
});

test("resolveCorsOrigins keeps local defaults when no remote frontend is configured", () => {
  assert.deepEqual(resolveCorsOrigin({} as NodeJS.ProcessEnv), [
    "http://localhost:3000",
    "http://web:3000",
  ]);
});

test("resolveCorsOrigin allows Vercel preview origins from wildcard config", () => {
  const origin = resolveCorsOrigin({
    CORS_ORIGINS: "https://*.vercel.app,http://localhost:3000",
  } as NodeJS.ProcessEnv);

  assert.equal(typeof origin, "function");
  assert.equal(
    typeof origin === "function" ? origin("https://ember-frontend-git-main.vercel.app") : null,
    "https://ember-frontend-git-main.vercel.app",
  );
  assert.equal(
    typeof origin === "function" ? origin("https://evil.example.com") : "bad",
    null,
  );
});
