import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("spaces", "routes/spaces.jsx"),
  route("dashboard", "routes/dashboard.jsx"),
  route("menu", "routes/menu.jsx"),
  route("login", "routes/login.jsx"),
];
