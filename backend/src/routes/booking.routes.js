import { Router } from "express";
import {
  getMyBookings,
  createBooking,
  updateMyBooking,
  getAllBookings,
  checkInBooking,
} from "../controllers/booking.controller.js";
import { requireAuth, requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/bookings/my", requireAuth, getMyBookings);
router.post("/bookings", requireAuth, createBooking);
router.patch("/bookings/:id", requireAuth, updateMyBooking);

router.get("/bookings/all", requireStaff, getAllBookings);
router.patch("/bookings/:id/checkin", requireStaff, checkInBooking);

export default router;
