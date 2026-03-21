import { Router } from "express";
import { getMyOrders, createOrder, updateMyOrder } from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/middleware.js";

const router = Router();

router.get("/orders/my", requireAuth, getMyOrders);
router.post("/orders", requireAuth, createOrder);
router.put("/orders/:id", requireAuth, updateMyOrder);

export default router;
