import { Router } from "express";
import {
  login,
  getMe,
  updateProfile,
  changePassword,
  getMyBookings,
  getAllBookings,
  checkInBooking,
  createBooking,
  getTables,
  getAvailableTables,
  createTable,
  updateTable,
  deleteTable,
  getTableTypes,
  createTableType,
  updateTableType,
  deleteTableType,
  getReportAnalytics,
  getPaymentData,
  createPayment,
  cancelPayment,
  payosWebhook,
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/controller.js";
import { requireAuth, requireStaff } from "../middleware/middleware.js";

const router = Router();

// Auth
router.post("/auth/login", login);
router.get("/auth/me", requireAuth, getMe);
router.put("/auth/profile", requireAuth, updateProfile);
router.put("/auth/password", requireAuth, changePassword);

// Tables
router.get("/tables", getTables);
router.post("/tables/available", getAvailableTables);
router.post("/tables", requireStaff, createTable);
router.put("/tables/:id", requireStaff, updateTable);
router.delete("/tables/:id", requireStaff, deleteTable);

// Table Types
router.get("/table-types", getTableTypes);
router.post("/table-types", requireStaff, createTableType);
router.put("/table-types/:id", requireStaff, updateTableType);
router.delete("/table-types/:id", requireStaff, deleteTableType);

// Bookings — customer
router.get("/bookings/my", requireAuth, getMyBookings);
router.post("/bookings", requireAuth, createBooking);

// Bookings — staff / admin
router.get("/bookings/all", requireStaff, getAllBookings);
router.patch("/bookings/:id/checkin", requireStaff, checkInBooking);

// Reports — staff / admin
router.get("/reports/analytics", requireStaff, getReportAnalytics);

// Payments
router.get("/payments/:bookingId", requireAuth, getPaymentData);
router.post("/payments/create", requireAuth, createPayment);
router.post("/payments/cancel", requireAuth, cancelPayment);

// PayOS webhook (no auth — called by PayOS server)
router.post("/payos/webhook", payosWebhook);

// Menu Management — staff / admin
router.get("/menu/items", getMenuItems);
router.get("/menu/items/:id", getMenuItem);
router.post("/menu/items", requireStaff, createMenuItem);
router.put("/menu/items/:id", requireStaff, updateMenuItem);
router.delete("/menu/items/:id", requireStaff, deleteMenuItem);

router.get("/menu/categories", getCategories);
router.post("/menu/categories", requireStaff, createCategory);

// User Management — staff / admin
router.get("/users", requireStaff, getAllUsers);
router.get("/users/:id", requireStaff, getUserById);
router.post("/users", requireStaff, createUser);
router.put("/users/:id", requireStaff, updateUser);
router.delete("/users/:id", requireStaff, deleteUser);

export default router;
