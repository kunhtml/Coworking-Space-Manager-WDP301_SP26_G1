import { apiClient } from "./api";

export async function getBookings() {
  return apiClient.get("/api/bookings");
}