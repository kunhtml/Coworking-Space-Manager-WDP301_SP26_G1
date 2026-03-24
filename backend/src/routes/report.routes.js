import { Router } from "express";
import {
  getHourlyOccupancyAnalytics,
  getReportAnalytics,
  getDailyTableUsage,
} from "../controllers/report.controller.js";
import { requireAdmin } from "../middleware/middleware.js";

const router = Router();

router.get("/reports/analytics", requireAdmin, getReportAnalytics);
router.get(
  "/reports/analytics/hourly",
  requireAdmin,
  getHourlyOccupancyAnalytics,
);

// TEMP: Remove middleware to test
router.get(
  "/reports/analytics/daily-table-usage",
  (req, res, next) => {
    console.log("[ROUTE] daily-table-usage hit!");
    next();
  },
  requireAdmin,
  getDailyTableUsage,
);

export default router;
