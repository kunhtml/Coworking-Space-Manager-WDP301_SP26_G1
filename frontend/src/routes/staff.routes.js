import { index, route } from "@react-router/dev/routes";

export const staffRoutes = [
  index("pages/staff/StaffDashboard.jsx"),
  route("checkin", "pages/staff/StaffCheckinPage.jsx"),
  route("tables", "pages/staff/StaffSeatMapPage.jsx"),
  route("orders", "pages/staff/StaffOrderManagementPage.jsx"),
  route("create-service", "pages/staff/StaffCreateServicePage.jsx"),
  route("services", "pages/staff/StaffServiceListPage.jsx"),
  route("profile", "pages/admin/AdminProfileNew.jsx", {
    id: "staff/profile",
  }),
  route("password", "pages/customer/CustomerPassword.jsx", {
    id: "staff/password",
  }),
];
