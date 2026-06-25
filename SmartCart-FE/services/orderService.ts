import api from "@/services/api";
import type { ApiResponse, CreateOrderPayload, Order } from "@/types";

export const orderService = {
  async createOrder(payload: CreateOrderPayload) {
    const { data } = await api.post<ApiResponse<Order>>("/orders", payload);
    return data.data;
  },

  async getMyOrders() {
    const { data } = await api.get<ApiResponse<Order[]>>("/orders");
    return data.data ?? [];
  },

  async getOrder(id: string) {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return data.data;
  },

  async lookupOrder(id: string) {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/lookup/${id}`);
    return data.data;
  },

  async cancelOrder(id: string) {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return data.data;
  },

  async confirmPayment(id: string) {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/confirm-payment`);
    return data.data;
  },

  async confirmOrder(id: string) {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/confirm`);
    return data.data;
  }
};
