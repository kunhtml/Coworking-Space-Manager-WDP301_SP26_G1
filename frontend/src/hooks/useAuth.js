import { useMemo } from "react";

export function useAuth() {
  return useMemo(
    () => ({
      isAuthenticated: false,
      user: null,
    }),
    []
  );
}