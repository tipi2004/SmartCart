"use client";

import { create } from "zustand";
import { productService } from "@/services/productService";
import type { Category, Product } from "@/types";
import { applyProductFilters, type ProductSortOrder } from "@/utils/productFilters";

type ProductState = {
  rawProducts: Product[];
  products: Product[];
  categories: Category[];
  selectedCategoryId: string | null;
  keyword: string;
  sortOrder: ProductSortOrder;
  minPrice: string;
  maxPrice: string;
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setKeyword: (keyword: string) => void;
  setCategory: (categoryId: string | null) => Promise<void>;
  setSortOrder: (sortOrder: ProductSortOrder) => void;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
  clearAdvancedFilters: () => void;
};

export const useProductStore = create<ProductState>((set, get) => ({
  rawProducts: [],
  products: [],
  categories: [],
  selectedCategoryId: null,
  keyword: "",
  sortOrder: "newest",
  minPrice: "",
  maxPrice: "",
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const { keyword, selectedCategoryId } = get();
      const products = await productService.getProducts({
        keyword: keyword || undefined,
        categoryId: selectedCategoryId || undefined
      });
      const { sortOrder, minPrice, maxPrice } = get();
      set({ rawProducts: products, products: applyProductFilters(products, { sortOrder, minPrice, maxPrice }), loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Không tải được sản phẩm.", loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await productService.getCategories();
      set({ categories });
    } catch {
      set({ categories: [] });
    }
  },

  setKeyword: (keyword) => set({ keyword }),

  setCategory: async (categoryId) => {
    set({ selectedCategoryId: categoryId });
    await get().fetchProducts();
  },

  setSortOrder: (sortOrder) => {
    const { rawProducts, minPrice, maxPrice } = get();
    set({ sortOrder, products: applyProductFilters(rawProducts, { sortOrder, minPrice, maxPrice }) });
  },

  setMinPrice: (minPrice) => {
    const { rawProducts, sortOrder, maxPrice } = get();
    set({ minPrice, products: applyProductFilters(rawProducts, { sortOrder, minPrice, maxPrice }) });
  },

  setMaxPrice: (maxPrice) => {
    const { rawProducts, sortOrder, minPrice } = get();
    set({ maxPrice, products: applyProductFilters(rawProducts, { sortOrder, minPrice, maxPrice }) });
  },

  clearAdvancedFilters: () => {
    const { rawProducts } = get();
    set({
      sortOrder: "newest",
      minPrice: "",
      maxPrice: "",
      products: applyProductFilters(rawProducts, { sortOrder: "newest", minPrice: "", maxPrice: "" })
    });
  }
}));
