import { Router } from "express";
import { getReportAnalytics } from "../controllers/report.controller.js";
import { requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/reports/analytics", requireStaff, getReportAnalytics);

export default router;
