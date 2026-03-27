const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseResponse = async (res) => {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const apiClient = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      cache: "no-store",
      headers: { ...authHeader() },
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data?.message || data || "Loi server");
    return data;
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data?.message || "Loi server");
    return data;
  },
  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data?.message || "Loi server");
    return data;
  },
  patch: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body || {}),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data?.message || "Loi server");
    return data;
  },
  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data?.message || "Loi server");
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

export const sendRegisterOtpApi = (email) =>
  apiClient.post("/auth/register/send-otp", { email });

export const verifyRegisterOtpApi = (email, otp) =>
  apiClient.post("/auth/register/verify-otp", { email, otp });

export const sendForgotPasswordOtpApi = (email) =>
  apiClient.post("/auth/forgot-password/send-otp", { email });

export const verifyForgotPasswordOtpApi = (email, otp) =>
  apiClient.post("/auth/forgot-password/verify-otp", { email, otp });

export const resetForgotPasswordApi = (email, newPassword, confirmPassword) =>
  apiClient.post("/auth/forgot-password/reset", {
    email,
    newPassword,
    confirmPassword,
  });

export const getMeApi = () => apiClient.get("/auth/me");

export const updateProfileApi = (data) => apiClient.put("/auth/profile", data);

export const sendProfileEmailOtpApi = (newEmail) =>
  apiClient.post("/auth/profile/send-email-otp", { newEmail });

export const verifyProfileEmailOtpApi = (newEmail, otp) =>
  apiClient.post("/auth/profile/verify-email-otp", { newEmail, otp });

export const changePasswordApi = (data) =>
  apiClient.put("/auth/password", data);

export const sendOtpApi = (purpose) =>
  apiClient.post("/auth/send-otp", { purpose });

export const verifyOtpApi = (purpose, otp) =>
  apiClient.post("/auth/verify-otp", { purpose, otp });

export const getMyBookingsApi = () => apiClient.get("/bookings/my");

export const getMenuItemsApi = () => apiClient.get("/menu/items");

export const getCategoriesApi = () => apiClient.get("/menu/categories");

export const getTablesApi = ({ status, search } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.append("status", status);
  if (search) params.append("search", search);
  const qs = params.toString();
  return apiClient.get(`/staff/dashboard/tables${qs ? "?" + qs : ""}`);
};

export const updateTableStatusApi = (tableId, status) =>
  apiClient.patch(`/staff/dashboard/tables/${tableId}/status`, { status });

export const getHourlyOccupancyApi = ({ date, period } = {}) => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (period) params.append("period", period);
  const qs = params.toString();
  return apiClient.get(`/reports/analytics/hourly${qs ? `?${qs}` : ""}`);
};

export const getReportAnalyticsApi = ({ timeFilter } = {}) => {
  const params = new URLSearchParams();
  if (timeFilter) params.append("timeFilter", timeFilter);
  const qs = params.toString();
  return apiClient.get(`/reports/analytics${qs ? `?${qs}` : ""}`);
};

export const getDailyTableUsageApi = ({ year, month } = {}) => {
  const params = new URLSearchParams();
  if (year) params.append("year", year);
  if (month) params.append("month", month);
  params.append("_v", "2");
  params.append("_t", Date.now().toString());
  const qs = params.toString();
  return apiClient.get(
    `/reports/analytics/daily-table-usage${qs ? `?${qs}` : ""}`,
  );
};
