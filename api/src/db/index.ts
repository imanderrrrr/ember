import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL ?? "postgres://ember:ember@localhost:5432/ember";

// `max: 1` para dev — evita pool overhead durante hot reload. En prod subir.
const client = postgres(url, { max: process.env.NODE_ENV === "production" ? 10 : 1 });

export const db = drizzle(client, { schema });
export { client as pgClient };
