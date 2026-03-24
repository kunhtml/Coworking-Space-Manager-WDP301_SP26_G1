import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export default function AdminToDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const targetPath =
    user?.role === "Admin"
      ? "/admin-dashboard/users"
      : user?.role === "Staff"
        ? "/staff-dashboard"
        : "/customer-dashboard/orders";

  return <Navigate to={targetPath} replace />;
}
