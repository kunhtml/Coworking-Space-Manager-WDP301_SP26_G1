import { index, route } from "@react-router/dev/routes";

export default [
  // Shared pages
  index("pages/shared/HomeNew.jsx"),
  route("login", "pages/shared/Login.jsx"),
  route("register", "pages/shared/Register.jsx"),
  route("spaces", "pages/shared/SpacesPage.jsx"),
  route("menu", "pages/shared/OrderPageNew.jsx"),
  route("payment/:bookingId", "pages/shared/PaymentPage.jsx"),

  // Customer pages
  route("order-table", "pages/customer/BookingPageNew.jsx"),
  route("customer-dashboard", "pages/customer/routes/CustomerDashboardRedirect.jsx"),
  route("customer-dashboard/orders", "pages/customer/routes/CustomerOrdersPage.jsx"),
  route("customer-dashboard/profile", "pages/customer/routes/CustomerProfilePage.jsx"),
  route("customer-dashboard/password", "pages/customer/CustomerPassword.jsx"),
  route("dashboard", "pages/shared/DashboardEntry.jsx"),
  route("profile", "pages/customer/routes/LegacyCustomerProfilePage.jsx"),

  // Staff pages
  route("staff-dashboard", "pages/staff/StaffDashboard.jsx"),
  route("staff-dashboard/checkin", "pages/staff/StaffCheckinPage.jsx"),
  route("staff-dashboard/tables", "pages/staff/StaffSeatMapPage.jsx"),
  route("staff-dashboard/orders", "pages/staff/StaffOrderManagementPage.jsx"),
  route(
    "staff-dashboard/create-service",
    "pages/staff/StaffCreateServicePage.jsx",
  ),
  route("staff-dashboard/services", "pages/staff/StaffServiceListPage.jsx"),
  route("staff-dashboard/profile", "pages/admin/AdminProfileNew.jsx"),
  route("staff-dashboard/password", "pages/admin/AdminPassword.jsx"),

  // Admin pages
  route("admin-dashboard", "pages/admin/AdminDashboard.jsx"),
  route("admin-dashboard/users", "pages/admin/AdminUsers.jsx"),
  route("admin-dashboard/services", "pages/admin/AdminPage.jsx"),
  route("admin-dashboard/spaces", "pages/admin/AdminTablesNew.jsx"),
  route("admin-dashboard/revenue", "pages/admin/AdminRevenuePage.jsx"),
  route("admin-dashboard/analytics", "pages/admin/AdminAnalytics.jsx"),
  route("admin-dashboard/profile", "pages/admin/routes/AdminProfilePage.jsx"),
  route("admin-dashboard/password", "pages/admin/routes/AdminPasswordPage.jsx"),

  route("admin", "pages/shared/AdminToDashboard.jsx"),
];
