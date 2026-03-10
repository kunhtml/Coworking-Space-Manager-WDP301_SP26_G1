const BASE_URL = "http://localhost:5000/api";

export const apiClient = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi server");
    return data;
  },
};

export const loginApi = (identifier, password) =>
  apiClient.post("/auth/login", { identifier, password });
