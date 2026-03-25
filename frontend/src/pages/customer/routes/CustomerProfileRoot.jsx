import { Navigate } from "react-router";

<<<<<<<< HEAD:frontend/src/pages/customer/routes/CustomerProfileRoot.jsx
export default function CustomerProfileRoot() {
  return <CustomerProfilePage />;
========
export default function LegacyCustomerProfilePage() {
  return <Navigate to="/customer-dashboard/profile" replace />;
>>>>>>>> main:frontend/src/pages/customer/routes/LegacyCustomerProfilePage.jsx
}
