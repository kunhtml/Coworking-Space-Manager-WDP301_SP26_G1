import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("spaces", "routes/spaces.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("menu", "routes/menu.tsx"),
  route("login", "routes/login.tsx"),
] satisfies RouteConfig;
