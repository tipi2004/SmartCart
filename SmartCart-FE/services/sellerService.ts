import api from "@/services/api";
import type { ApiResponse, Order, Product, Shop } from "@/types";

export type SellerProductPayload = {
  name: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  categoryId: string;
  imageUrl?: string;
  imageFile?: File | null;
};

export const sellerService = {
  async getMyShop() {
    const { data } = await api.get<ApiResponse<Shop>>("/shops/my");
    return data.data;
  },

  async updateMyShop(payload: { name: string }) {
    const { data } = await api.put<ApiResponse<Shop>>("/shops/my", payload);
    return data.data;
  },

  async getMyProducts() {
    const { data } = await api.get<ApiResponse<Product[]>>("/shops/my/products");
    return data.data ?? [];
  },

  async getMyOrders() {
    const { data } = await api.get<ApiResponse<Order[]>>("/shops/my/orders");
    return data.data ?? [];
  },

  async createProduct(payload: SellerProductPayload) {
    const formData = productFormData(payload);
    const { data } = await api.post<ApiResponse<string>>("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data.message || data.data || "Đã đăng sản phẩm.";
  },

  async updateProduct(id: string, payload: SellerProductPayload) {
    const formData = productFormData(payload);
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}/multipart`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data.data;
  },

  async hideProduct(id: string) {
    const { data } = await api.delete<ApiResponse<string>>(`/products/${id}`);
    return data.message || data.data || "Đã ẩn sản phẩm.";
  }
};

function productFormData(payload: SellerProductPayload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("price", String(payload.price));
  if (payload.stockQuantity !== undefined) formData.append("stockQuantity", String(payload.stockQuantity));
  formData.append("categoryId", payload.categoryId);
  if (payload.imageUrl) formData.append("imageUrl", payload.imageUrl);
  if (payload.imageFile) formData.append("imageFile", payload.imageFile);
  return formData;
}
