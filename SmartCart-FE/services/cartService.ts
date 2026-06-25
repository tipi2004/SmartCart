import api from "@/services/api";
import type { ApiResponse, Cart } from "@/types";

export const emptyCart: Cart = {
  items: [],
  totalItems: 0,
  totalAmount: 0
};

export const cartService = {
  async getCart() {
    const { data } = await api.get<ApiResponse<Cart>>("/cart");
    return data.data ?? emptyCart;
  },

  async addItem(productId: string, quantity = 1) {
    const { data } = await api.post<ApiResponse<Cart>>("/cart/items", { productId, quantity });
    return data.data ?? emptyCart;
  },

  async updateItem(itemId: string, productId: string, quantity: number) {
    const { data } = await api.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { productId, quantity });
    return data.data ?? emptyCart;
  },

  async removeItem(itemId: string) {
    const { data } = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return data.data ?? emptyCart;
  }
};
