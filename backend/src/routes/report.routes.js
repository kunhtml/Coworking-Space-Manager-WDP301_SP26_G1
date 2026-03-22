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
router.get(
  "/reports/analytics/daily-table-usage",
  requireStaff,
  getDailyTableUsage,
);

export default router;
