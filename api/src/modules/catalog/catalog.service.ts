import * as repo from "./catalog.repository.js";
import type { MenuCategory, MenuItem } from "../../db/schema.js";

export interface MenuItemDTO {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  category: string;
  categoryId: string | null;
  isActive: boolean;
  ivaRate: number;
}

export interface MenuCategoryDTO {
  id: string;
  name: string;
  icon: string | null;
  ord: number;
}

function itemToDTO(i: MenuItem): MenuItemDTO {
  return {
    id: i.id,
    name: i.name,
    description: i.description,
    priceCents: i.priceCents,
    category: i.category,
    categoryId: i.categoryId,
    isActive: i.isActive,
    ivaRate: i.ivaRate,
  };
}

function categoryToDTO(c: MenuCategory): MenuCategoryDTO {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    ord: c.ord,
  };
}

export async function listCatalog() {
  const [categories, items] = await Promise.all([
    repo.listCategories(),
    repo.listMenuItems(),
  ]);
  return {
    categories: categories.map(categoryToDTO),
    items: items.map(itemToDTO),
  };
}

export async function getMenuItem(id: string) {
  const item = await repo.getMenuItemById(id);
  return item ? itemToDTO(item) : null;
}
