import { useState, useEffect } from "react";

/** Normalize role sang PascalCase để so sánh nhất quán trong toàn FE */
const normalizeRole = (role) => {
  if (!role) return role;
  const map = {
    admin: "Admin",
    staff: "Staff",
    customer: "Customer",
  };
  return map[role.toLowerCase()] ?? role;
};

const readAuth = () => {
  const token = localStorage.getItem("token");
  const raw = JSON.parse(localStorage.getItem("user") || "null");
  // Normalize role ngay khi đọc — fix case-mismatch giữa DB (lowercase) và FE (PascalCase)
  const user = raw ? { ...raw, role: normalizeRole(raw.role) } : null;
  return { isAuthenticated: !!token, user };
};

export function useAuth() {
  const [auth, setAuth] = useState(readAuth);

  useEffect(() => {
    const onStorage = () => setAuth(readAuth());
    window.addEventListener("storage", onStorage);
    // Also poll for same-tab changes
    const id = setInterval(onStorage, 500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ isAuthenticated: false, user: null });
  };

  return { ...auth, logout };
}