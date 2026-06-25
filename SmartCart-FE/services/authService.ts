import api from "@/services/api";
import type { ApiResponse, ForgotPasswordPayload, LoginPayload, RegisterPayload, TokenResponse, VerifySmsResetPayload } from "@/types";

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<ApiResponse<TokenResponse>>("/auth/login", payload);
    return data.data;
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post<ApiResponse<string>>("/auth/register", payload);
    return data.message || data.data || "Đăng ký thành công.";
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    const { data } = await api.post<ApiResponse<string>>("/auth/forgot-password", payload);
    return data.message || data.data || "Vui lòng kiểm tra hướng dẫn xác nhận.";
  },

  async verifySmsReset(payload: VerifySmsResetPayload) {
    const { data } = await api.post<ApiResponse<string>>("/auth/verify-reset-sms", payload);
    return data.message || data.data || "Doi mat khau thanh cong.";
  }
};
