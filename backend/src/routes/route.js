import { Router } from "express";
import {
  login,
  getMe,
  updateProfile,
  changePassword,
  getMyBookings,
} from "../controllers/controller.js";
import { requireAuth } from "../middleware/middleware.js";

const router = Router();

// Auth
router.post("/auth/login", login);
router.get("/auth/me", requireAuth, getMe);
router.put("/auth/profile", requireAuth, updateProfile);
router.put("/auth/password", requireAuth, changePassword);

// Bookings
router.get("/bookings/my", requireAuth, getMyBookings);

export default router;
