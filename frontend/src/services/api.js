const BASE_URL = "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiClient = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { ...authHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi server");
    return data;
  },
  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi server");
    return data;
  },
  patch: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi server");
    return data;
  },
  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi server");
    return data;
  },
};

export const loginApi = (identifier, password) =>
  apiClient.post("/auth/login", { identifier, password });

export const registerApi = (fullName, email, phone, passwordHash) =>
  apiClient.post("/auth/register", {
    fullName,
    email,
    phone,
    passwordHash,
    role: "customer",
    membershipStatus: "active",
  });

export const getMeApi = () => apiClient.get("/auth/me");

export const updateProfileApi = (data) => apiClient.put("/auth/profile", data);

export const changePasswordApi = (data) =>
  apiClient.put("/auth/password", data);

export const getMyBookingsApi = () => apiClient.get("/bookings/my");