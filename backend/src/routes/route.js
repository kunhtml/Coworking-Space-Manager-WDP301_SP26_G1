import { Router } from "express";
import {
  login,
  getMe,
  updateProfile,
  changePassword,
  getMyBookings,
  getAllBookings,
  checkInBooking,
  createBooking,
  getTables,
  getAvailableTables,
  getPaymentData,
  createPayment,
  cancelPayment,
  payosWebhook,
} from "../controllers/controller.js";
import { requireAuth, requireStaff } from "../middleware/middleware.js";

const router = Router();

// Auth
router.post("/auth/login", login);
router.get("/auth/me", requireAuth, getMe);
router.put("/auth/profile", requireAuth, updateProfile);
router.put("/auth/password", requireAuth, changePassword);

// Tables
router.get("/tables", getTables);
router.post("/tables/available", getAvailableTables);

// Bookings — customer
router.get("/bookings/my", requireAuth, getMyBookings);
router.post("/bookings", requireAuth, createBooking);

// Bookings — staff / admin
router.get("/bookings/all", requireStaff, getAllBookings);
router.patch("/bookings/:id/checkin", requireStaff, checkInBooking);

// Payments
router.get("/payments/:bookingId", requireAuth, getPaymentData);
router.post("/payments/create", requireAuth, createPayment);
router.post("/payments/cancel", requireAuth, cancelPayment);

// PayOS webhook (no auth — called by PayOS server)
router.post("/payos/webhook", payosWebhook);

export default router;
