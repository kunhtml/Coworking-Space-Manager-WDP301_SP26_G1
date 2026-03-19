import { prefix } from "@react-router/dev/routes";
import { adminRoutes } from "./routes/admin.routes";
import { customerRoutes } from "./routes/customer.routes";
import { sharedRoutes } from "./routes/shared.routes";
import { staffRoutes } from "./routes/staff.routes";

export default [
  ...sharedRoutes,
  ...prefix("customer", customerRoutes),
  ...prefix("staff", staffRoutes),
  ...prefix("admin", adminRoutes),
];
