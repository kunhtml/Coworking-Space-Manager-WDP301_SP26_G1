import { apiClient } from "./api";

export async function getOrders() {
  return apiClient.get("/api/orders");
}