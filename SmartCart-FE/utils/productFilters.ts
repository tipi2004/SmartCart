import type { Product } from "@/types";

export type ProductSortOrder = "newest" | "price_asc" | "price_desc" | "name_asc";

export type ProductFilterOptions = {
  sortOrder: ProductSortOrder;
  minPrice?: string;
  maxPrice?: string;
};

const toPriceNumber = (value?: string) => {
  if (!value) return null;
  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) return null;
  return Number(normalized);
};

export function applyProductFilters(products: Product[], options: ProductFilterOptions) {
  const minPrice = toPriceNumber(options.minPrice);
  const maxPrice = toPriceNumber(options.maxPrice);

  const filteredProducts = products.filter((product) => {
    if (minPrice !== null && product.basePrice < minPrice) return false;
    if (maxPrice !== null && product.basePrice > maxPrice) return false;
    return true;
  });

  return [...filteredProducts].sort((first, second) => {
    if (options.sortOrder === "price_asc") return first.basePrice - second.basePrice;
    if (options.sortOrder === "price_desc") return second.basePrice - first.basePrice;
    if (options.sortOrder === "name_asc") return first.name.localeCompare(second.name, "vi");

    const firstCreated = first.createdAt ? new Date(first.createdAt).getTime() : 0;
    const secondCreated = second.createdAt ? new Date(second.createdAt).getTime() : 0;
    return secondCreated - firstCreated;
  });
}
