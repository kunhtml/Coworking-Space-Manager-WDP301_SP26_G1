import { Router } from "express";
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/menu.controller.js";
import { requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/menu/items", getMenuItems);
router.get("/menu/items/:id", getMenuItem);
router.post("/menu/items", requireStaff, createMenuItem);
router.put("/menu/items/:id", requireStaff, updateMenuItem);
router.delete("/menu/items/:id", requireStaff, deleteMenuItem);

router.get("/menu/categories", getCategories);
router.post("/menu/categories", requireStaff, createCategory);
router.put("/menu/categories/:id", requireStaff, updateCategory);
router.delete("/menu/categories/:id", requireStaff, deleteCategory);

export default router;
