import { Router } from "express";
import {
  getTables,
  getAvailableTables,
  createTable,
  updateTable,
  deleteTable,
} from "../controllers/table.controller.js";
import {
  getTableTypes,
  createTableType,
  updateTableType,
  deleteTableType,
} from "../controllers/table-type.controller.js";
import { requireStaff } from "../middleware/middleware.js";

const router = Router();

router.get("/tables", getTables);
router.post("/tables/available", getAvailableTables);
router.post("/tables", requireStaff, createTable);
router.put("/tables/:id", requireStaff, updateTable);
router.delete("/tables/:id", requireStaff, deleteTable);

router.get("/table-types", getTableTypes);
router.post("/table-types", requireStaff, createTableType);
router.put("/table-types/:id", requireStaff, updateTableType);
router.delete("/table-types/:id", requireStaff, deleteTableType);

export default router;
