import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/users", requireStaff, getAllUsers);
router.get("/users/:id", requireStaff, getUserById);
router.post("/users", requireStaff, createUser);
router.put("/users/:id", requireStaff, updateUser);
router.delete("/users/:id", requireStaff, deleteUser);

export default router;
