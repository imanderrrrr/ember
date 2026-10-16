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

const SEED_CATEGORIES = [
  { id: "entradas", name: "Entradas", icon: "Leaf", ord: 1 },
  { id: "principales", name: "Principales", icon: "Utensils", ord: 2 },
  { id: "pasta", name: "Pasta y arroces", icon: "Wheat", ord: 3 },
  { id: "carnes", name: "Carnes a la brasa", icon: "Beef", ord: 4 },
  { id: "pescados", name: "Pescados y mariscos", icon: "Fish", ord: 5 },
  { id: "bebidas", name: "Bebidas", icon: "Coffee", ord: 6 },
  { id: "vinos", name: "Vinos", icon: "Wine", ord: 7 },
  { id: "postres", name: "Postres", icon: "Cake", ord: 8 },
];

const SEED_MENU_ITEMS = [
  { id: "ent-1", name: "Tartar de atún", description: "Cubos de atún rojo, aguacate, sésamo y soja yuzu.", priceCents: 8900, category: "entradas", categoryId: "entradas", ivaRate: 12 },
  { id: "ent-2", name: "Burrata con tomates asados", description: "Burrata fresca, cherry confitado, albahaca y aceite de oliva.", priceCents: 7200, category: "entradas", categoryId: "entradas", ivaRate: 12 },
  { id: "ent-3", name: "Croquetas de jamón ibérico", description: "Bechamel cremosa de jamón ibérico, rebozadas y fritas al momento.", priceCents: 6400, category: "entradas", categoryId: "entradas", ivaRate: 12 },
  { id: "ent-4", name: "Ceviche de corvina", description: "Corvina fresca marinada en leche de tigre, cebolla morada y cilantro.", priceCents: 9800, category: "entradas", categoryId: "entradas", ivaRate: 12 },
  { id: "pri-1", name: "Risotto de hongos", description: "Arroz Carnaroli, hongos porcini, parmesano y trufa negra.", priceCents: 9500, category: "principales", categoryId: "principales", ivaRate: 12 },
  { id: "pri-2", name: "Lasagna boloñesa", description: "Capas de pasta fresca, ragú de res, bechamel y parmesano gratinado.", priceCents: 11000, category: "principales", categoryId: "principales", ivaRate: 12 },
  { id: "pas-1", name: "Fettuccine alfredo", description: "Pasta al huevo, crema, mantequilla y parmesano reggiano.", priceCents: 8800, category: "pasta", categoryId: "pasta", ivaRate: 12 },
  { id: "car-1", name: "Cordero al horno", description: "Pierna de cordero cocinada a baja temperatura, romero y vino tinto.", priceCents: 16500, category: "carnes", categoryId: "carnes", ivaRate: 12 },
  { id: "car-2", name: "Bife de chorizo", description: "Corte argentino 400g, brasa, chimichurri de la casa.", priceCents: 18000, category: "carnes", categoryId: "carnes", ivaRate: 12 },
  { id: "pes-1", name: "Salmón a la plancha", description: "Filete de salmón con costra de hierbas y puré de papa.", priceCents: 14000, category: "pescados", categoryId: "pescados", ivaRate: 12 },
  { id: "beb-1", name: "Agua mineral 750ml", description: "Con gas o sin gas, sin costo de descorche.", priceCents: 2800, category: "bebidas", categoryId: "bebidas", ivaRate: 12 },
  { id: "beb-2", name: "Limonada de hierbas", description: "Limón fresco, menta, jengibre y hierbabuena.", priceCents: 3200, category: "bebidas", categoryId: "bebidas", ivaRate: 12 },
  { id: "vin-1", name: "Vino Ribera del Duero", description: "Tempranillo crianza, notas de fruta negra y especias.", priceCents: 29500, category: "vinos", categoryId: "vinos", ivaRate: 12 },
  { id: "vin-2", name: "Malbec mendocino", description: "Cuerpo medio, ideal para carnes a la brasa.", priceCents: 24000, category: "vinos", categoryId: "vinos", ivaRate: 12 },
  { id: "pos-1", name: "Tiramisú de la casa", description: "Bizcocho de café, mascarpone, cacao amargo y licor amaretto.", priceCents: 5800, category: "postres", categoryId: "postres", ivaRate: 12 },
  { id: "test-ribeye", name: "Ribeye a la brasa", description: "Corte grueso a las brasas", priceCents: 15000, category: "carnes", categoryId: "carnes", ivaRate: 12 },
  { id: "test-malbec", name: "Copa Malbec", description: "Copa de vino tinto Malbec", priceCents: 6000, category: "vinos", categoryId: "vinos", ivaRate: 12 },
  { id: "test-platillo", name: "Platillo Especial", description: "Platillo especial del chef", priceCents: 15000, category: "principales", categoryId: "principales", ivaRate: 12 },
];

async function seedCatalog() {
  const { menuCategories, menuItems } = await import("../src/db/schema.js");
  for (const cat of SEED_CATEGORIES) {
    await db
      .insert(menuCategories)
      .values(cat)
      .onConflictDoUpdate({
        target: menuCategories.id,
        set: { name: cat.name, icon: cat.icon, ord: cat.ord, updatedAt: new Date() },
      });
  }
  for (const item of SEED_MENU_ITEMS) {
    await db
      .insert(menuItems)
      .values(item)
      .onConflictDoUpdate({
        target: menuItems.id,
        set: {
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          category: item.category,
          categoryId: item.categoryId,
          ivaRate: item.ivaRate,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`[seed] catálogo inicializado (${SEED_MENU_ITEMS.length} items en ${SEED_CATEGORIES.length} categorías).`);
}

async function main() {
  console.log("[seed] sembrando usuarios …");
  for (const u of SEED_USERS) {
    await seedUser(u);
  }
  console.log("[seed] sembrando catálogo de menú …");
  await seedCatalog();
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
