import { apiClient } from "./api";

export async function getStaffDashboardStats() {
  return apiClient.get("/staff/dashboard/stats");
}

export async function getStaffTables(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  const qs = query.toString();
  return apiClient.get(`/staff/dashboard/tables${qs ? `?${qs}` : ""}`);
}

export async function updateStaffTableStatus(tableId, status) {
  return apiClient.patch(`/staff/dashboard/tables/${tableId}/status`, { status });
}

export async function staffCheckInBooking(bookingId) {
  return apiClient.patch(`/staff/dashboard/bookings/${bookingId}/checkin`);
}

export async function getStaffOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.date) query.set("date", params.date);
  const qs = query.toString();
  return apiClient.get(`/staff/dashboard/orders${qs ? `?${qs}` : ""}`);
}

export async function createCounterOrder(payload) {
  return apiClient.post("/staff/dashboard/orders/counter", payload);
}

export async function findStaffCustomer(keyword) {
  const q = String(keyword || "").trim();
  if (!q) return { found: false, customer: null };
  const query = new URLSearchParams({ q });
  return apiClient.get(`/staff/dashboard/customers/search?${query.toString()}`);
}

export async function updateStaffOrder(orderId, payload) {
  return apiClient.put(`/staff/dashboard/orders/${orderId}`, payload);
}

export async function getStaffOrderInvoice(orderId) {
  return apiClient.get(`/staff/dashboard/orders/${orderId}/invoice`);
}

export async function exportStaffOrderInvoice(orderId) {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `http://localhost:5000/api/staff/dashboard/orders/${orderId}/invoice/export`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!res.ok) {
    let message = "Export hóa đơn thất bại.";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // ignore JSON parse error and use default message
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `invoice-${String(orderId).slice(-6).toUpperCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
