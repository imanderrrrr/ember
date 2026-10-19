import {
  Beef,
  Cake,
  Coffee,
  Fish,
  Leaf,
  Utensils,
  Wheat,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CatalogDTO, KitchenOrderDTO } from "@ember/types";

/**
 * Catálogo de menú y helpers de comanda.
 * Soporta carga dinámica desde el backend oficial (PostgreSQL /api/catalog)
 * y mantiene fallback seguro para resiliencia offline.
 */

export interface Product {
  id: string;
  name: string;
  desc: string;
  price: number; // precio unitario IVA incluido (en Quetzales)
}

export interface Category {
  key: string;
  label: string;
  icon: LucideIcon;
  count: number;
}

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
}

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  leaf: Leaf,
  utensils: Utensils,
  wheat: Wheat,
  beef: Beef,
  fish: Fish,
  coffee: Coffee,
  wine: Wine,
  cake: Cake,
  entradas: Leaf,
  principales: Utensils,
  pasta: Wheat,
  carnes: Beef,
  pescados: Fish,
  bebidas: Coffee,
  vinos: Wine,
  postres: Cake,
};

export function resolveCategoryIcon(iconOrKey?: string | null): LucideIcon {
  if (!iconOrKey) return Utensils;
  const lower = iconOrKey.toLowerCase();
  return CATEGORY_ICON_MAP[lower] ?? Utensils;
}

export const CATEGORIES: Category[] = [
  { key: "entradas", label: "Entradas", icon: Leaf, count: 4 },
  { key: "principales", label: "Principales", icon: Utensils, count: 2 },
  { key: "pasta", label: "Pasta y arroces", icon: Wheat, count: 1 },
  { key: "carnes", label: "Carnes a la brasa", icon: Beef, count: 2 },
  { key: "pescados", label: "Pescados y mariscos", icon: Fish, count: 1 },
  { key: "bebidas", label: "Bebidas", icon: Coffee, count: 2 },
  { key: "vinos", label: "Vinos", icon: Wine, count: 2 },
  { key: "postres", label: "Postres", icon: Cake, count: 1 },
];

export const CATALOG: Record<string, Product[]> = {
  entradas: [
    { id: "ent-1", name: "Tartar de atún", desc: "Cubos de atún rojo, aguacate, sésamo y soja yuzu.", price: 89 },
    { id: "ent-2", name: "Burrata con tomates asados", desc: "Burrata fresca, cherry confitado, albahaca y aceite de oliva.", price: 72 },
    { id: "ent-3", name: "Croquetas de jamón ibérico", desc: "Bechamel cremosa de jamón ibérico, rebozadas y fritas al momento.", price: 64 },
    { id: "ent-4", name: "Ceviche de corvina", desc: "Corvina fresca marinada en leche de tigre, cebolla morada y cilantro.", price: 98 },
  ],
  principales: [
    { id: "pri-1", name: "Risotto de hongos", desc: "Arroz Carnaroli, hongos porcini, parmesano y trufa negra.", price: 95 },
    { id: "pri-2", name: "Lasagna boloñesa", desc: "Capas de pasta fresca, ragú de res, bechamel y parmesano gratinado.", price: 110 },
  ],
  pasta: [
    { id: "pas-1", name: "Fettuccine alfredo", desc: "Pasta al huevo, crema, mantequilla y parmesano reggiano.", price: 88 },
  ],
  carnes: [
    { id: "car-1", name: "Cordero al horno", desc: "Pierna de cordero cocinada a baja temperatura, romero y vino tinto.", price: 165 },
    { id: "car-2", name: "Bife de chorizo", desc: "Corte argentino 400g, brasa, chimichurri de la casa.", price: 180 },
  ],
  pescados: [
    { id: "pes-1", name: "Salmón a la plancha", desc: "Filete de salmón con costra de hierbas y puré de papa.", price: 140 },
  ],
  bebidas: [
    { id: "beb-1", name: "Agua mineral 750ml", desc: "Con gas o sin gas, sin costo de descorche.", price: 28 },
    { id: "beb-2", name: "Limonada de hierbas", desc: "Limón fresco, menta, jengibre y hierbabuena.", price: 32 },
  ],
  vinos: [
    { id: "vin-1", name: "Vino Ribera del Duero", desc: "Tempranillo crianza, notas de fruta negra y especias.", price: 295 },
    { id: "vin-2", name: "Malbec mendocino", desc: "Cuerpo medio, ideal para carnes a la brasa.", price: 240 },
  ],
  postres: [
    { id: "pos-1", name: "Tiramisú de la casa", desc: "Bizcocho de café, mascarpone, cacao amargo y licor amaretto.", price: 58 },
  ],
};

export const IVA_RATE = 0.12;

export function formatQ(n: number): string {
  return `Q${n.toFixed(2)}`;
}

/**
 * Convierte un DTO de catálogo del backend en las estructuras que consume la interfaz.
 */
export function buildCatalogFromDTO(dto: CatalogDTO | null | undefined): {
  categories: Category[];
  catalog: Record<string, Product[]>;
  allProducts: Product[];
} {
  if (!dto || !dto.categories || dto.categories.length === 0) {
    return {
      categories: CATEGORIES,
      catalog: CATALOG,
      allProducts: Object.values(CATALOG).flat(),
    };
  }

  const catalog: Record<string, Product[]> = {};
  const allProducts: Product[] = [];

  for (const item of dto.items) {
    if (!item.isActive) continue;
    const catKey = item.categoryId || item.category || "otros";
    if (!catalog[catKey]) {
      catalog[catKey] = [];
    }
    const product: Product = {
      id: item.id,
      name: item.name,
      desc: item.description ?? "",
      price: item.priceCents / 100,
    };
    catalog[catKey].push(product);
    allProducts.push(product);
  }

  const categories: Category[] = dto.categories.map((c) => ({
    key: c.id,
    label: c.name,
    icon: resolveCategoryIcon(c.icon ?? c.id),
    count: (catalog[c.id] ?? []).length,
  }));

  return { categories, catalog, allProducts };
}

/**
 * Convierte órdenes reales de cocina de una mesa en líneas de carrito `CartLine[]`.
 */
export function ordersToCartLines(orders: KitchenOrderDTO[]): CartLine[] {
  const lineMap = new Map<string, CartLine>();
  const flatFallback = Object.values(CATALOG).flat();

  for (const order of orders) {
    if (order.status === "entregada" || order.status === "cancelada") continue;
    for (const item of order.items) {
      const id = item.menuItemId || item.name;
      let unitPrice =
        item.priceCents && item.priceCents > 0
          ? item.priceCents / 100
          : 0;

      if (unitPrice === 0) {
        const found = flatFallback.find(
          (p) => p.id === id || p.name.toLowerCase() === item.name.toLowerCase(),
        );
        if (found) unitPrice = found.price;
      }

      const existing = lineMap.get(id);
      if (existing) {
        existing.qty += item.qty;
      } else {
        lineMap.set(id, {
          productId: id,
          name: item.name,
          unitPrice,
          qty: item.qty,
        });
      }
    }
  }

  return [...lineMap.values()];
}

/**
 * Retorna las líneas de comanda de una mesa a partir de sus órdenes de cocina reales.
 * Si no hay órdenes registradas, retorna un carrito vacío.
 */
export function mockOrderForTable(
  _tableId: string,
  _status: string,
  orders?: KitchenOrderDTO[],
): CartLine[] {
  if (orders && orders.length > 0) {
    return ordersToCartLines(orders);
  }
  return [];
}
