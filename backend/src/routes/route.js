import { Router } from "express";
import {
  login,
  register,
  getMe,
  updateProfile,
  changePassword,
  getMyBookings,
  updateMyBooking,
  getAllBookings,
  checkInBooking,
  getStaffTableStatusList,
  updateStaffTableStatus,
  getStaffOrders,
  createCounterOrder,
  updateStaffOrder,
  getStaffOrderInvoice,
  exportStaffOrderInvoice,
  createBooking,
  getMyOrders,
  createOrder,
  updateMyOrder,
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
  updateCategory,
  deleteCategory,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/controller.js";
import { requireAuth, requireStaff } from "../middleware/middleware.js";

const router = Router();

// Auth
router.post("/auth/register", register);
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
router.patch("/bookings/:id", requireAuth, updateMyBooking);

// Orders — customer
router.get("/orders/my", requireAuth, getMyOrders);
router.post("/orders", requireAuth, createOrder);
router.put("/orders/:id", requireAuth, updateMyOrder);

// Bookings — staff / admin
router.get("/bookings/all", requireStaff, getAllBookings);
router.patch("/bookings/:id/checkin", requireStaff, checkInBooking);

// Reports — staff / admin
router.get("/reports/analytics", requireStaff, getReportAnalytics);

// Staff Dashboard APIs
router.get("/staff/dashboard/tables", requireStaff, getStaffTableStatusList);
router.patch(
  "/staff/dashboard/tables/:id/status",
  requireStaff,
  updateStaffTableStatus,
);
router.patch("/staff/dashboard/bookings/:id/checkin", requireStaff, checkInBooking);
router.get("/staff/dashboard/orders", requireStaff, getStaffOrders);
router.post("/staff/dashboard/orders/counter", requireStaff, createCounterOrder);
router.put("/staff/dashboard/orders/:id", requireStaff, updateStaffOrder);
router.get(
  "/staff/dashboard/orders/:id/invoice",
  requireStaff,
  getStaffOrderInvoice,
);
router.get(
  "/staff/dashboard/orders/:id/invoice/export",
  requireStaff,
  exportStaffOrderInvoice,
);

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
router.put("/menu/categories/:id", requireStaff, updateCategory);
router.delete("/menu/categories/:id", requireStaff, deleteCategory);

// User Management — staff / admin
router.get("/users", requireStaff, getAllUsers);
router.get("/users/:id", requireStaff, getUserById);
router.post("/users", requireStaff, createUser);
router.put("/users/:id", requireStaff, updateUser);
router.delete("/users/:id", requireStaff, deleteUser);

export default router;
