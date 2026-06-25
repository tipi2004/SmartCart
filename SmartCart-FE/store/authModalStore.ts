"use client";

import { create } from "zustand";

type AuthModalState = {
  open: boolean;
  openLogin: () => void;
  closeLogin: () => void;
};

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  openLogin: () => set({ open: true }),
  closeLogin: () => set({ open: false })
}));
