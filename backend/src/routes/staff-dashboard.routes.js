import { Router } from "express";
import {
  getStaffTableStatusList,
  updateStaffTableStatus,
  getStaffOrders,
  createCounterOrder,
  updateStaffOrder,
  getStaffOrderInvoice,
  exportStaffOrderInvoice,
  getStaffDashboardStats,
} from "../controllers/staff-dashboard.controller.js";
import { checkInBooking } from "../controllers/booking.controller.js";
import { requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/staff/dashboard/stats", requireStaff, getStaffDashboardStats);
router.get("/staff/dashboard/tables", requireStaff, getStaffTableStatusList);
router.patch("/staff/dashboard/tables/:id/status", requireStaff, updateStaffTableStatus);
router.patch("/staff/dashboard/bookings/:id/checkin", requireStaff, checkInBooking);
router.get("/staff/dashboard/orders", requireStaff, getStaffOrders);
router.post("/staff/dashboard/orders/counter", requireStaff, createCounterOrder);
router.put("/staff/dashboard/orders/:id", requireStaff, updateStaffOrder);
router.get("/staff/dashboard/orders/:id/invoice", requireStaff, getStaffOrderInvoice);
router.get("/staff/dashboard/orders/:id/invoice/export", requireStaff, exportStaffOrderInvoice);

export default router;
