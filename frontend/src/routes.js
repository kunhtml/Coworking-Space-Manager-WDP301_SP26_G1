import { index, route } from "@react-router/dev/routes";

export default [
  index("pages/shared/Home.jsx"),
  route("login", "pages/shared/Login.jsx"),
  route("register", "pages/shared/Register.jsx"),
  route("spaces", "pages/shared/SpacesPage.jsx"),
  route("menu", "pages/shared/OrderPage.jsx"),
  route("payment/:bookingId", "pages/shared/PaymentPage.jsx"),

  route("order-table", "pages/customer/BookingPage.jsx"),
  route("customer-dashboard", "pages/customer/OrderHistory.jsx"),
  // route("dashboard", "pages/customer/OrderHistory.jsx"),
  route("profile", "pages/customer/Profile.jsx"),

];
