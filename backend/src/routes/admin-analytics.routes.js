import { Router } from "express";
import { getAdminAnalytics } from "../controllers/admin-analytics.controller.js";
// import { authMiddleware, isAdminOrStaff } from "../middleware/middleware.js";

const router = Router();

// Keep both legacy + new paths to avoid frontend breakage
// GET /api/admin/analytics?period=today|week|month
router.get("/admin/analytics", getAdminAnalytics);

// GET /api/analytics/admin?period=today|week|month
router.get("/analytics/admin", getAdminAnalytics);

export default router;
