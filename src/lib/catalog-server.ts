import "server-only";
import type { CatalogDTO } from "@ember/types";
import { getAuthHeaders } from "@/lib/server-token";

const API_URL = process.env.API_URL ?? "http://api:3001";

/**
 * Obtiene el catálogo completo de categorías y platillos/bebidas desde la API Hono.
 * Se ejecuta en Server Components.
 */
export async function fetchCatalog(): Promise<CatalogDTO> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/catalog`, {
    cache: "no-store",
    headers,
  }).catch((err) => {
    console.error("[catalog-server] fetchCatalog failed:", err);
    return null;
  });

  if (!res || !res.ok) {
    return { categories: [], items: [] };
  }

  return (await res.json()) as CatalogDTO;
}
