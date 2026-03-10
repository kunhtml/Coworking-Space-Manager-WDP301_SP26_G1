import { index, route } from "@react-router/dev/routes";

export default [
  index("pages/Home.jsx"),
  route("spaces", "pages/BookingPage.jsx"),
  route("menu", "pages/OrderPage.jsx"),
  route("dashboard", "pages/OrderHistory.jsx"),
  route("login", "pages/Login.jsx"),
  route("register", "pages/Register.jsx"),
  route("profile", "pages/Profile.jsx"),
];
