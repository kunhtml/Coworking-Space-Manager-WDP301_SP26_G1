import { Router } from "express";
import {
  getHourlyOccupancyAnalytics,
  getReportAnalytics,
  getDailyTableUsage,
} from "../controllers/report.controller.js";
import { requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/reports/analytics", requireStaff, getReportAnalytics);
router.get(
  "/reports/analytics/hourly",
  requireStaff,
  getHourlyOccupancyAnalytics,
);

// TEMP: Remove middleware to test
router.get(
  "/reports/analytics/daily-table-usage",
  (req, res, next) => {
    console.log("[ROUTE] daily-table-usage hit!");
    next();
  },
  requireStaff,
  getDailyTableUsage,
);

export default router;
