import { apiClient } from "./api";

export async function getBookings() {
  return apiClient.get("/bookings/my");
}

export async function searchAvailableTables(data) {
  return apiClient.post("/tables/available", data);
}

export async function createBookingApi(data) {
  return apiClient.post("/bookings", data);
}

export async function getPaymentData(bookingId) {
  return apiClient.get(`/payments/${bookingId}`);
}

export async function createPaymentApi(bookingId) {
  return apiClient.post("/payments/create", { bookingId });
}

export async function cancelPaymentApi(bookingId) {
  return apiClient.post("/payments/cancel", { bookingId });
}

// Staff / Admin
export async function getAllBookingsApi({ date, search } = {}) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (search) params.append("search", search);
  const qs = params.toString();
  return apiClient.get(`/bookings/all${qs ? "?" + qs : ""}`);
}

export async function checkInBookingApi(bookingId) {
  return apiClient.patch(`/bookings/${bookingId}/checkin`);
}
