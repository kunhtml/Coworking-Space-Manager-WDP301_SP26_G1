// Simple auth helpers using localStorage (no Redux needed yet)

/** Normalize role sang PascalCase để FE luôn so sánh nhất quán */
const normalizeRole = (role) => {
  if (!role) return role;
  const map = {
    admin: "Admin",
    staff: "Staff",
    customer: "Customer",
  };
  return map[role.toLowerCase()] ?? role;
};

export const saveAuth = (token, user) => {
  // Normalize role trước khi lưu
  const normalizedUser = user
    ? { ...user, role: normalizeRole(user.role) }
    : user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(normalizedUser));
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getAuth = () => ({
  token: localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user") || "null"),
});

export const isAuthenticated = () => !!localStorage.getItem("token");
