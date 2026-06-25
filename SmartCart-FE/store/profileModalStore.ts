"use client";

import { create } from "zustand";

type ProfileModalState = {
  open: boolean;
  openProfile: () => void;
  closeProfile: () => void;
};

export const useProfileModalStore = create<ProfileModalState>((set) => ({
  open: false,
  openProfile: () => set({ open: true }),
  closeProfile: () => set({ open: false })
}));
