import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router";

export default function DashboardEntry() {
  const { user } = useAuth();

  if (user?.role === "Admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (user?.role === "Staff") {
    return <Navigate to="/staff-dashboard" replace />;
  }

  return <Navigate to="/customer-dashboard" replace />;
}
