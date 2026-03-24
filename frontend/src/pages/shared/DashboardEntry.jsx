import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router";

export default function DashboardEntry() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "Admin") {
    return <Navigate to="/admin-dashboard/users" replace />;
  }

  if (user?.role === "Staff") {
    return <Navigate to="/staff-dashboard" replace />;
  }

  return <Navigate to="/customer-dashboard/orders" replace />;
}
