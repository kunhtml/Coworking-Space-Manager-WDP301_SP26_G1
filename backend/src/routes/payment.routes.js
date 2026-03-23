import { Router } from "express";
import {
  getPaymentData,
  getOrderPaymentData,
  createPayment,
  createOrderPayment,
  cancelPayment,
  payosWebhook,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/middleware.js";

const router = Router();

router.get("/payments/:bookingId", requireAuth, getPaymentData);
router.get("/payments/order/:orderId", requireAuth, getOrderPaymentData);
router.post("/payments/create", requireAuth, createPayment);
router.post("/payments/create-order", requireAuth, createOrderPayment);
router.post("/payments/cancel", requireAuth, cancelPayment);
router.post("/payos/webhook", payosWebhook);

export default router;
