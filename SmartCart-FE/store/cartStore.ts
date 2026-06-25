"use client";

import { create } from "zustand";
import { cartService, emptyCart } from "@/services/cartService";
import type { Cart } from "@/types";

type CartState = {
  cart: Cart;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
};

export const useCartStore = create<CartState>((set) => ({
  cart: emptyCart,
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const cart = await cartService.getCart();
      set({ cart, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Không tải được giỏ hàng.", loading: false });
    }
  },

  addToCart: async (productId, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      const cart = await cartService.addItem(productId, quantity);
      set({ cart, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Không thêm được sản phẩm.", loading: false });
      throw error;
    }
  },

  updateQuantity: async (itemId, productId, quantity) => {
    if (quantity < 1) return;
    set({ loading: true, error: null });
    try {
      const cart = await cartService.updateItem(itemId, productId, quantity);
      set({ cart, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Không cập nhật được giỏ hàng.", loading: false });
    }
  },

  removeItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const cart = await cartService.removeItem(itemId);
      set({ cart, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Không xóa được sản phẩm.", loading: false });
      throw error;
    }
  }
}));
