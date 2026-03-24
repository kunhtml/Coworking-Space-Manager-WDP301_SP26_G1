import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { requireAdmin } from "../middleware/middleware.js";

const router = Router();

router.get("/users", requireAdmin, getAllUsers);
router.get("/users/:id", requireAdmin, getUserById);
router.post("/users", requireAdmin, createUser);
router.put("/users/:id", requireAdmin, updateUser);
router.delete("/users/:id", requireAdmin, deleteUser);

export default router;
