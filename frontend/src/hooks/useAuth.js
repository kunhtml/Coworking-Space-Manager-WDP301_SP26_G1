import { useState, useEffect } from "react";

export function useAuth() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return { isAuthenticated: !!token, user };
  });

  useEffect(() => {
    const onStorage = () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setAuth({ isAuthenticated: !!token, user });
    };
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