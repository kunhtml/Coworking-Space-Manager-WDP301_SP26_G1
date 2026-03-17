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
  route("dashboard", "pages/customer/OrderHistory.jsx"),
  route("profile", "pages/customer/Profile.jsx"),

  // Admin pages
  route("admin", "pages/admin/AdminDashboard.jsx"),
  route("admin/menu", "pages/admin/AdminPage.jsx"),
  route("admin/tables", "pages/admin/AdminTablesNew.jsx"),
  route("admin/users", "pages/admin/AdminUsers.jsx"),
  route("admin/reports", "pages/admin/ReportAnalyticsPage.jsx"),
  route("admin/analytics", "pages/admin/AdminAnalytics.jsx"),
  route("admin/profile", "pages/admin/AdminProfileNew.jsx"),
  route("admin/password", "pages/admin/AdminPassword.jsx"),
];
