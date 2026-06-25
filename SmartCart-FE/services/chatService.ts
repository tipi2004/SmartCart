import api from "@/services/api";
import type { ApiResponse } from "@/types";

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | string;
  content: string;
  createdAt?: string;
  actions?: ChatAction[];
};

export type ChatAction = {
  label: string;
  href: string;
  type?: string;
};

export type ChatResponse = {
  reply: string;
  actions?: ChatAction[];
};

export const chatService = {
  async sendMessage(message: string) {
    const { data } = await api.post<ApiResponse<ChatResponse>>("/chat", { message });
    return data.data || { reply: "" };
  },

  async getHistory() {
    const { data } = await api.get<ApiResponse<ChatMessage[]>>("/chat/history");
    return data.data || [];
  }
};
