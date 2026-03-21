import { Router } from "express";
import { getReportAnalytics } from "../controllers/report.controller.js";
// import { requireStaff } from "../middleware/middleware.js";

const router = Router();

// Test route
router.get("/test-reports", (req, res) => {
  console.log("🧪 Test route called");
  res.json({ message: "Test route working", timestamp: new Date() });
});

// GET /api/reports/analytics (Temporarily public for development)
router.get("/reports/analytics", getReportAnalytics);

export default router;
