import { Beef, Cake, Coffee, Fish, Leaf, Utensils, Wheat, Wine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Catálogo de menú y helpers de comanda — módulo neutro (sin "use client") para
 * que pueda usarse tanto en Server Components (KDS) como en Client Components
 * (OrderModal, Mesa activa, rail del mesero).
 *
 * Todo es mock: aún no existe el módulo de productos/órdenes en el backend.
 */

export interface Product {
  id: string;
  name: string;
  desc: string;
  price: number; // precio unitario IVA incluido
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

export const CATEGORIES: Category[] = [
  { key: "entradas", label: "Entradas", icon: Leaf, count: 8 },
  { key: "principales", label: "Principales", icon: Utensils, count: 14 },
  { key: "pasta", label: "Pasta y arroces", icon: Wheat, count: 6 },
  { key: "carnes", label: "Carnes a la brasa", icon: Beef, count: 9 },
  { key: "pescados", label: "Pescados y mariscos", icon: Fish, count: 7 },
  { key: "bebidas", label: "Bebidas", icon: Coffee, count: 18 },
  { key: "vinos", label: "Vinos", icon: Wine, count: 24 },
  { key: "postres", label: "Postres", icon: Cake, count: 10 },
];

/**
 * Catálogo mock por categoría. Las ids son estables (categoria-índice) para
 * que el carrito pueda identificarlos y consolidar líneas duplicadas.
 */
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

/** Estados en los que una mesa tiene un pedido en curso. */
const SERVICE_STATUSES = ["ocupada", "cocina", "esperando"];

/**
 * Comanda representativa por mesa. Mientras no exista el módulo de órdenes en
 * el backend, derivamos una comanda determinística a partir del `tableId` para
 * que el rail del mesero, Mesa activa y el KDS muestren lo mismo. Las mesas que
 * no están en servicio devuelven una comanda vacía.
 */
export function mockOrderForTable(tableId: string, status: string): CartLine[] {
  if (!SERVICE_STATUSES.includes(status)) return [];
  const flat = Object.values(CATALOG).flat();
  if (flat.length === 0) return [];
  let h = 0;
  for (let i = 0; i < tableId.length; i++) h = (h * 31 + tableId.charCodeAt(i)) >>> 0;
  const n = 2 + (h % 3); // 2..4 líneas
  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (let i = 0; i < n; i++) {
    const p = flat[(h + i * 7) % flat.length];
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const qty = 1 + ((h >>> (i + 1)) & 1); // 1..2 (shift sin signo)
    lines.push({ productId: p.id, name: p.name, unitPrice: p.price, qty });
  }
  return lines;
}
