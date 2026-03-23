import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export default function AdminToDashboard() {
  const { user } = useAuth();

  const targetPath =
    user?.role === "Admin"
      ? "/admin-dashboard/users"
      : user?.role === "Staff"
        ? "/staff-dashboard"
        : "/customer-dashboard";

  return <Navigate to={targetPath} replace />;
}
