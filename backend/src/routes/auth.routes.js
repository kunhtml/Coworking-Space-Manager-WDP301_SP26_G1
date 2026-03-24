import { Router } from "express";
import {
  login,
  register,
  getMe,
  updateProfile,
  changePassword,
  sendOtp,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/middleware.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", requireAuth, getMe);
router.put("/auth/profile", requireAuth, updateProfile);
router.put("/auth/password", requireAuth, changePassword);
router.post("/auth/send-otp", requireAuth, sendOtp);
router.post("/auth/verify-otp", requireAuth, verifyOtp);

export default router;
