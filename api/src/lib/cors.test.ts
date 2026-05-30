import test from "node:test";
import assert from "node:assert/strict";
import { resolveCorsOrigins } from "./cors.js";

test("resolveCorsOrigins reads comma-separated remote frontend origins", () => {
  assert.deepEqual(
    resolveCorsOrigins({
      CORS_ORIGINS: " http://192.168.1.20:3000, http://frontend.local:3000 ",
    } as NodeJS.ProcessEnv),
    ["http://192.168.1.20:3000", "http://frontend.local:3000"],
  );
});

test("resolveCorsOrigins falls back to FRONTEND_ORIGIN for single-node setup", () => {
  assert.deepEqual(
    resolveCorsOrigins({
      FRONTEND_ORIGIN: "http://192.168.1.20:3000",
    } as NodeJS.ProcessEnv),
    ["http://192.168.1.20:3000"],
  );
});

test("resolveCorsOrigins keeps local defaults when no remote frontend is configured", () => {
  assert.deepEqual(resolveCorsOrigins({} as NodeJS.ProcessEnv), [
    "http://localhost:3000",
    "http://web:3000",
  ]);
});
