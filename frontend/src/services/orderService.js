import { apiClient } from "./api";

export async function getMyOrders() {
  return apiClient.get("/orders/my");
}

export async function createOrderApi(data) {
  return apiClient.post("/orders", data);
}

export async function updateOrderApi(orderId, data) {
  return apiClient.put(`/orders/${orderId}`, data);
}