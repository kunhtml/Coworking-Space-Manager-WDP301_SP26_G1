import { Router } from "express";
import {
  getTables,
  getAvailableTables,
  createTable,
  updateTable,
  deleteTable,
} from "../controllers/table.controller.js";
import { requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/tables", getTables);
router.post("/tables/available", getAvailableTables);
router.post("/tables", requireStaff, createTable);
router.put("/tables/:id", requireStaff, updateTable);
router.delete("/tables/:id", requireStaff, deleteTable);

export default router;
