import { index, route } from "@react-router/dev/routes";

export const customerRoutes = [
  index("pages/customer/OrderHistory.jsx"),
  route("order-table", "pages/customer/BookingPage.jsx"),
  route("profile", "pages/customer/routes/CustomerProfilePage.jsx"),
  route("password", "pages/customer/CustomerPassword.jsx"),
];
