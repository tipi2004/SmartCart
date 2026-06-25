import api from "@/services/api";
import type { ApiResponse, Category, Product } from "@/types";

export const productService = {
  async getProducts(params?: { keyword?: string; categoryId?: string }) {
    const { data } = await api.get<ApiResponse<Product[]>>("/products", { params });
    return data.data ?? [];
  },

  async getProduct(id: string) {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  async getCategories() {
    const { data } = await api.get<ApiResponse<Category[]>>("/categories");
    return data.data ?? [];
  },

  async getProductsByCategory(categoryId: string) {
    try {
      const { data } = await api.get<ApiResponse<Product[]>>(`/products/category/${categoryId}`);
      return data.data ?? [];
    } catch {
      const { data } = await api.get<ApiResponse<Product[]>>(`/categories/${categoryId}/products`);
      return data.data ?? [];
    }
  }
};
