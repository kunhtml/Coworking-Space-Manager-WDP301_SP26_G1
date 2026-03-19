import { Router } from "express";
import {
  getPaymentData,
  createPayment,
  cancelPayment,
  payosWebhook,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/middleware.js";

const router = Router();

router.get("/payments/:bookingId", requireAuth, getPaymentData);
router.post("/payments/create", requireAuth, createPayment);
router.post("/payments/cancel", requireAuth, cancelPayment);
router.post("/payos/webhook", payosWebhook);

export default router;
