import { index, route } from "@react-router/dev/routes";

export default [
  // Shared pages
  index("pages/shared/Home.jsx"),
  route("login", "pages/shared/Login.jsx"),
  route("register", "pages/shared/Register.jsx"),
  route("spaces", "pages/shared/SpacesPage.jsx"),
  route("menu", "pages/shared/OrderPage.jsx"),
  route("payment/:bookingId", "pages/shared/PaymentPage.jsx"),
  
  // Customer pages
  route("order-table", "pages/customer/BookingPage.jsx"),
  route("dashboard", "pages/customer/OrderHistory.jsx"),
  route("profile", "pages/customer/Profile.jsx"),
  
  // Admin pages
  route("admin", "pages/admin/AdminPage.jsx"),
  route("admin/tables", "pages/admin/TableManagementPage.jsx"),
  route("admin/users", "pages/admin/AdminUsers.jsx"),
  route("admin/reports", "pages/admin/ReportAnalyticsPage.jsx"),
  route("admin/profile", "pages/admin/AdminProfile.jsx"),
];
