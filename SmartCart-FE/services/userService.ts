import api from "@/services/api";
import type { ApiResponse, ChangePasswordPayload, UpdateProfilePayload, UserProfile } from "@/types";

export const userService = {
  async getProfile() {
    const { data } = await api.get<ApiResponse<UserProfile>>("/users/me");
    return data.data;
  },

  async updateProfile(payload: UpdateProfilePayload) {
    const { data } = await api.put<ApiResponse<UserProfile>>("/users/me", payload);
    return data.data;
  },

  async changePassword(payload: ChangePasswordPayload) {
    const { data } = await api.put<ApiResponse<string>>("/users/me/password", payload);
    return data.message || data.data || "Doi mat khau thanh cong.";
  }
};
