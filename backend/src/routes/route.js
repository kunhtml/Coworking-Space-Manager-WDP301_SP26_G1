import { Router } from "express";
import authRoutes from "./auth.routes.js";
import tableRoutes from "./table.routes.js";
import bookingRoutes from "./booking.routes.js";
import orderRoutes from "./order.routes.js";
import reportRoutes from "./report.routes.js";
import staffDashboardRoutes from "./staff-dashboard.routes.js";
import paymentRoutes from "./payment.routes.js";
import menuRoutes from "./menu.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use(authRoutes);
router.use(tableRoutes);
router.use(bookingRoutes);
router.use(orderRoutes);
router.use(reportRoutes);
router.use(staffDashboardRoutes);
router.use(paymentRoutes);
router.use(menuRoutes);
router.use(userRoutes);

export default router;
