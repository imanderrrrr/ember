/**
 * Contrato DTO compartido para el Catálogo de Menú.
 */

export interface MenuItemDTO {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  category: string;
  categoryId: string;
  ivaRate: number;
  isActive: boolean;
}

export interface MenuCategoryDTO {
  id: string;
  name: string;
  icon: string | null;
  ord: number;
}

export interface CatalogDTO {
  categories: MenuCategoryDTO[];
  items: MenuItemDTO[];
}
