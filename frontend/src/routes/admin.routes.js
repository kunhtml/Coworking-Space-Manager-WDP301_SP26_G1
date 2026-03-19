import { index, route } from "@react-router/dev/routes";

export const adminRoutes = [
  index("pages/admin/AdminAnalytics.jsx"),
  route("analytics", "pages/admin/AdminAnalytics.jsx", {
    id: "admin/analytics",
  }),
  route("users", "pages/admin/AdminUsers.jsx"),
  route("spaces", "pages/admin/AdminTablesNew.jsx"),
  route("services", "pages/admin/AdminServiceListPage.jsx"),
  route("revenue", "pages/admin/AdminRevenuePage.jsx"),
  route("profile", "pages/admin/AdminProfileNew.jsx", {
    id: "admin/profile",
  }),
  route("password", "pages/customer/CustomerPassword.jsx", {
    id: "admin/password",
  }),
];
