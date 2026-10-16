import { eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { menuCategories, menuItems } from "../../db/schema.js";

export async function listCategories() {
  return db.select().from(menuCategories).orderBy(menuCategories.ord);
}

export async function listMenuItems(category?: string) {
  if (category) {
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.category, category))
      .orderBy(menuItems.name);
  }
  return db.select().from(menuItems).orderBy(menuItems.name);
}

export async function getMenuItemById(id: string) {
  const [item] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);
  return item ?? null;
}

export async function getMenuItemsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.select().from(menuItems).where(inArray(menuItems.id, ids));
}

export async function findMenuItemByName(name: string) {
  const [item] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.name, name))
    .limit(1);
  return item ?? null;
}
