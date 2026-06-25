import api from "@/services/api";
import type { ApiResponse, Category, Order, Product, Shop, UserProfile } from "@/types";

export type CategoryPayload = {
  name: string;
  slug?: string;
  imageUrl?: string;
  displayOrder?: number;
  parentId?: string | null;
};

export const adminService = {
  async getOrders() {
    const { data } = await api.get<ApiResponse<Order[]>>("/admin/orders");
    return data.data ?? [];
  },

  async getOrder(id: string) {
    const { data } = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return data.data;
  },

  async getUsers() {
    const { data } = await api.get<ApiResponse<UserProfile[]>>("/admin/users");
    return data.data ?? [];
  },

  async getProducts() {
    const { data } = await api.get<ApiResponse<Product[]>>("/admin/products");
    return data.data ?? [];
  },

  async updateProductStatus(id: string, isActive: boolean) {
    const { data } = await api.put<ApiResponse<Product>>(`/admin/products/${id}/status`, null, {
      params: { isActive }
    });
    return data.data;
  },

  async updateProductApprovalStatus(id: string, approvalStatus: "pending" | "approved" | "rejected", rejectionReason?: string) {
    const { data } = await api.put<ApiResponse<Product>>(`/admin/products/${id}/approval`, null, {
      params: { approvalStatus, rejectionReason }
    });
    return data.data;
  },

  async updateUserStatus(id: string, isActive: boolean) {
    const { data } = await api.put<ApiResponse<UserProfile>>(`/admin/users/${id}/status`, null, {
      params: { isActive }
    });
    return data.data;
  },

  async getShops() {
    const { data } = await api.get<ApiResponse<Shop[]>>("/admin/shops");
    return data.data ?? [];
  },

  async updateShopStatus(id: string, status: "pending" | "active" | "suspended") {
    const { data } = await api.put<ApiResponse<Shop>>(`/admin/shops/${id}/status`, null, {
      params: { status }
    });
    return data.data;
  },

  async getCategories() {
    const { data } = await api.get<ApiResponse<Category[]>>("/admin/categories");
    return data.data ?? [];
  },

  async createCategory(payload: CategoryPayload) {
    const { data } = await api.post<ApiResponse<Category>>("/admin/categories", payload);
    return data.data;
  },

  async updateCategory(id: string, payload: CategoryPayload) {
    const { data } = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, payload);
    return data.data;
  },

  async deleteCategory(id: string) {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/categories/${id}`);
    return data;
  }
};
