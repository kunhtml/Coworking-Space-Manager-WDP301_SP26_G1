import { Navigate } from "react-router";

export default function LegacyCustomerProfilePage() {
  return <Navigate to="/customer-dashboard/profile" replace />;
}
