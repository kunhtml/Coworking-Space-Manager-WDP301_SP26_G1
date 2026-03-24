import { Navigate } from "react-router";

export default function StaffOrdersRedirect() {
  return <Navigate to="/staff-dashboard/orders" replace />;
}
