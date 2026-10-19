import type { CatalogDTO, MenuItemDTO } from "@ember/types";

/**
 * Obtiene el catálogo completo de categorías y platillos desde el cliente
 * a través de la ruta proxy de Next.js (`/api/catalog`).
 */
export async function fetchCatalogClient(): Promise<CatalogDTO> {
  const res = await fetch("/api/catalog");
  if (!res.ok) {
    throw new Error(`Failed to load catalog: ${res.status}`);
  }
  return (await res.json()) as CatalogDTO;
}

/**
 * Obtiene el detalle de un ítem del menú por su ID.
 */
export async function fetchMenuItemClient(id: string): Promise<MenuItemDTO | null> {
  const res = await fetch(`/api/catalog/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to load menu item: ${res.status}`);
  }
  return (await res.json()) as MenuItemDTO;
}
