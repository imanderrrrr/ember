import test from "node:test";
import assert from "node:assert/strict";
import { getStatusTopology } from "./status.config.js";

test("getStatusTopology marks the backend as the local node on this computer", () => {
  const topology = getStatusTopology({
    PORT: "3001",
    STATUS_BACKEND_DEVICE_NAME: "Caja Backend",
    STATUS_BACKEND_DEVICE_HOST: "192.168.1.21",
    STATUS_BACKEND_CONTAINER_NAME: "ember-api",
  } as NodeJS.ProcessEnv);

  assert.deepEqual(topology.api, {
    component: "api",
    serviceName: "Backend",
    deviceName: "Caja Backend",
    deviceHost: "192.168.1.21",
    containerName: "ember-api",
    port: 3001,
    runtime: "docker",
    relationToBackend: "local",
    configured: true,
  });
});

test("getStatusTopology derives the remote database node from DATABASE_URL without exposing credentials", () => {
  const topology = getStatusTopology({
    DATABASE_URL: "postgres://ember:secret@192.168.1.30:5432/ember",
  } as NodeJS.ProcessEnv);

  assert.equal(topology.database.deviceHost, "192.168.1.30");
  assert.equal(topology.database.port, 5432);
  assert.equal(topology.database.configured, true);
});

test("getStatusTopology leaves frontend pending until a remote frontend host is configured", () => {
  const topology = getStatusTopology({} as NodeJS.ProcessEnv);

  assert.equal(topology.frontend.deviceHost, "pendiente");
  assert.equal(topology.frontend.configured, false);
});
