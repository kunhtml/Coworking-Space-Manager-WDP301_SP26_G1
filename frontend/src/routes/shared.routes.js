import { index, route } from "@react-router/dev/routes";

export const sharedRoutes = [
  index("pages/shared/HomeNew.jsx"),
  route("login", "pages/shared/Login.jsx"),
  route("register", "pages/shared/Register.jsx"),
  route("spaces", "pages/shared/SpacesPage.jsx"),
  route("menu", "pages/shared/OrderPage.jsx"),
  route("payment/:bookingId", "pages/shared/PaymentPage.jsx"),
];
