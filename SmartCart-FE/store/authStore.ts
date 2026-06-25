"use client";

import { create } from "zustand";
import { authService } from "@/services/authService";
import type { LoginPayload, RegisterPayload } from "@/types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  hydrate: () => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,

  hydrate: () => {
    if (typeof window === "undefined") return;
    set({
      accessToken: localStorage.getItem("smartcart_access_token"),
      refreshToken: localStorage.getItem("smartcart_refresh_token")
    });
  },

  setTokens: (tokens) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smartcart_access_token", tokens.accessToken);
      localStorage.setItem("smartcart_refresh_token", tokens.refreshToken);
    }
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, error: null });
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const tokens = await authService.login(payload);
      if (!tokens) throw new Error("Không nhận được token từ backend.");
      localStorage.setItem("smartcart_access_token", tokens.accessToken);
      localStorage.setItem("smartcart_refresh_token", tokens.refreshToken);
      set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đăng nhập thất bại.";
      set({ error: message, loading: false });
      throw error;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const message = await authService.register(payload);
      set({ loading: false });
      return message;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đăng ký thất bại.";
      set({ error: message, loading: false });
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("smartcart_access_token");
      localStorage.removeItem("smartcart_refresh_token");
    }
    set({ accessToken: null, refreshToken: null });
  }
}));
