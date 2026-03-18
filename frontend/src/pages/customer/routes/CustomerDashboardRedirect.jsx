import { Navigate } from "react-router";

export default function CustomerDashboardRedirect() {
  return <Navigate to="/customer-dashboard/orders" replace />;
}
