import { eq } from "drizzle-orm";
import { db, pgClient } from "../src/db/index.js";
import { users } from "../src/db/schema.js";
import { hashSecret } from "../src/lib/auth.js";

/**
 * Usuarios seed. Idempotente por email: si ya existe, se omite.
 * Agrega aquí cualquier perfil de prueba con su rol.
 */
const SEED_USERS = [
  {
    email: "chef@ember.com",
    password: "brasa2026",
    pin: "2026",
    name: "Marco R.",
    role: "gerente_operativo",
    avatarInitials: "MR",
  },
  {
    email: "mesero@ember.com",
    password: "brasa2026",
    pin: "2026",
    name: "Diego Ramos",
    role: "mesero",
    avatarInitials: "DR",
  },
  {
    email: "cocina@ember.com",
    password: "brasa2026",
    pin: "2026",
    name: "Daniela Rojas",
    role: "cocina",
    avatarInitials: "DR",
  },
  // Meseros adicionales — para el roster del salón y el selector de
  // "mesero responsable" en las reservas.
  {
    email: "andres@ember.com",
    password: "brasa2026",
    pin: "2026",
    name: "Andrés López",
    role: "mesero",
    avatarInitials: "AL",
  },
  {
    email: "carla@ember.com",
    password: "brasa2026",
    pin: "2026",
    name: "Carla Ruiz",
    role: "mesero",
    avatarInitials: "CR",
  },
  {
    email: "pablo@ember.com",
    password: "brasa2026",
    pin: "2026",
    name: "Pablo Estrada",
    role: "mesero",
    avatarInitials: "PE",
  },
];

async function seedUser(u: (typeof SEED_USERS)[number]) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, u.email),
  });
  if (existing) {
    console.log(`[seed] ${u.email} ya existe, omitido.`);
    return;
  }
  const [passwordHash, pinHash] = await Promise.all([
    hashSecret(u.password),
    hashSecret(u.pin),
  ]);
  await db.insert(users).values({
    email: u.email,
    passwordHash,
    pinHash,
    name: u.name,
    role: u.role,
    avatarInitials: u.avatarInitials,
  });
  console.log(`[seed] creado ${u.email} (${u.role}) — pass: ${u.password}`);
}

async function main() {
  console.log("[seed] sembrando usuarios …");
  for (const u of SEED_USERS) {
    await seedUser(u);
  }
  console.log("[seed] done.");
}

main()
  .catch((err) => {
    console.error("[seed] FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pgClient.end();
  });
