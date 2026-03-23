import Booking from "../models/booking.js";
import Order from "../models/order.js";
import User from "../models/user.js";
import Table from "../models/table.js";
import OrderItem from "../models/order_item.js";
import MenuItem from "../models/menu_item.js";
import {
  buildPaymentPageData,
  buildOrderPaymentPageData,
  createOrReusePayOSPayment,
  createOrReuseOrderPayOSPayment,
  cancelPayOSPayment,
  isPayOSConfigured,
  syncPayOSPaymentRecord,
  createPayOSClient,
} from "../services/payos.service.js";

export const getPaymentData = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Validate bookingId format
    if (!bookingId || !/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      return res.status(400).json({ message: "ID booking không hợp lệ." });
    }

    const data = await buildPaymentPageData(bookingId, req.user.id);
    if (!data) {
      return res.status(404).json({
        message: "Không tìm thấy booking hoặc bạn không có quyền truy cập.",
      });
    }
    const { snapshot, activePayment, qrCodeDataUrl, qrCodeValue } = data;
    const booking = snapshot.booking;
    const table = booking.tableId
      ? await Table.findById(booking.tableId).lean()
      : null;

    const fmt = (n) => `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
    const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "--");
    const fmtTime = (v) =>
      v
        ? new Date(v).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--";

    res.json({
      payosEnabled: isPayOSConfigured(),
      booking: {
        id: booking.bookingCode || booking._id.toString(),
        mongoId: booking._id.toString(),
        date: fmtDate(booking.startTime),
        startTime: fmtTime(booking.startTime),
        endTime: fmtTime(booking.endTime),
        depositAmount: Number(booking.depositAmount || 0),
        depositFormatted: fmt(booking.depositAmount || 0),
        status: booking.status || "Pending",
      },
      table: table
        ? {
            name: table.name,
            type: table.tableType,
            location: table.location || "",
          }
        : null,
      invoice: {
        totalAmount: Number(snapshot.invoice?.totalAmount || 0),
        remainingAmount: snapshot.paymentUi.remainingAmount,
        remainingFormatted: fmt(snapshot.paymentUi.remainingAmount),
        status: snapshot.invoice?.status || "Pending",
      },
      payment: activePayment
        ? {
            id: activePayment._id.toString(),
            orderCode: activePayment.payos?.orderCode || null,
            amount: Number(activePayment.amount || 0),
            amountFormatted: fmt(activePayment.amount || 0),
            paymentStatus: activePayment.paymentStatus || "Pending",
            checkoutUrl: activePayment.payos?.checkoutUrl || "",
            accountName: activePayment.payos?.accountName || "",
            accountNumber: activePayment.payos?.accountNumber || "",
            bin: activePayment.payos?.bin || "",
            description: activePayment.payos?.description || "",
            expiredAt: activePayment.payos?.expiredAt || null,
            qrCodeValue,
            qrCodeDataUrl,
            lastSyncedAt: activePayment.payos?.lastSyncedAt
              ? new Date(activePayment.payos.lastSyncedAt).toLocaleString(
                  "vi-VN",
                )
              : "--",
          }
        : null,
      ui: snapshot.paymentUi,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/payments/order/:orderId  — get payment data for an order

export const getOrderPaymentData = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    const data = await buildOrderPaymentPageData(orderId, req.user.id);
    if (!data) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.",
      });
    }

    const { snapshot, activePayment, qrCodeDataUrl, qrCodeValue } = data;
    const order = snapshot.order;

    // Get order items
    const orderItems = await OrderItem.find({ orderId: order._id }).lean();
    const menuIds = orderItems.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuIds } }).lean();
    const menuMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    const items = orderItems.map((item) => {
      const menu = menuMap.get(item.menuItemId.toString());
      return {
        name: menu?.name || "Món không xác định",
        quantity: item.quantity,
        price: item.priceAtOrder,
        total: item.quantity * item.priceAtOrder,
      };
    });

    const fmt = (n) => `${new Intl.NumberFormat("vi-VN").format(n)}đ`;

    res.json({
      payosEnabled: isPayOSConfigured(),
      order: {
        id: order._id.toString(),
        bookingId: order.bookingId?.toString(),
        totalAmount: Number(order.totalAmount || 0),
        totalFormatted: fmt(order.totalAmount || 0),
        status: order.status || "Pending",
        createdAt: order.createdAt,
        items,
      },
      invoice: {
        totalAmount: Number(snapshot.invoice?.totalAmount || 0),
        remainingAmount: snapshot.paymentUi.remainingAmount,
        remainingFormatted: fmt(snapshot.paymentUi.remainingAmount),
        status: snapshot.invoice?.status || "Pending",
      },
      payment: activePayment
        ? {
            id: activePayment._id.toString(),
            orderCode: activePayment.payos?.orderCode || null,
            amount: Number(activePayment.amount || 0),
            amountFormatted: fmt(activePayment.amount || 0),
            paymentStatus: activePayment.paymentStatus || "Pending",
            checkoutUrl: activePayment.payos?.checkoutUrl || "",
            accountName: activePayment.payos?.accountName || "",
            accountNumber: activePayment.payos?.accountNumber || "",
            bin: activePayment.payos?.bin || "",
            description: activePayment.payos?.description || "",
            expiredAt: activePayment.payos?.expiredAt || null,
            qrCodeValue,
            qrCodeDataUrl,
            lastSyncedAt: activePayment.payos?.lastSyncedAt
              ? new Date(activePayment.payos.lastSyncedAt).toLocaleString(
                  "vi-VN",
                )
              : "--",
          }
        : null,
      ui: snapshot.paymentUi,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/payments/create  — create PayOS payment for a booking

export const createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Thiếu bookingId." });
    }

    // Validate bookingId format
    if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      return res.status(400).json({ message: "ID booking không hợp lệ." });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }
    if (booking.userId?.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Bạn không có quyền tạo thanh toán cho booking này.",
      });
    }
    const user = await User.findById(req.user.id).lean();
    const origin = `${req.protocol}://${req.get("host")}`;

    if (!isPayOSConfigured()) {
      return res.status(400).json({ message: "PayOS chưa được cấu hình." });
    }

    const result = await createOrReusePayOSPayment({
      booking,
      buyer: user,
      origin,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("createPayment error:", err);
    res.status(500).json({ message: err.message || "Lỗi tạo thanh toán." });
  }
};

// POST /api/payments/create-order  — create PayOS payment for an order

export const createOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Thiếu orderId." });
    }

    // Validate orderId format
    if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }
    if (order.userId?.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Bạn không có quyền tạo thanh toán cho đơn hàng này.",
      });
    }

    const user = await User.findById(req.user.id).lean();
    const origin = `${req.protocol}://${req.get("host")}`;

    if (!isPayOSConfigured()) {
      return res.status(400).json({ message: "PayOS chưa được cấu hình." });
    }

    const result = await createOrReuseOrderPayOSPayment({
      order,
      buyer: user,
      origin,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("createOrderPayment error:", err);
    res.status(500).json({ message: err.message || "Lỗi tạo thanh toán." });
  }
};

// POST /api/payments/cancel  — cancel pending payment and booking

export const cancelPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Thiếu bookingId." });
    }

    // Validate bookingId format
    if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      return res.status(400).json({ message: "ID booking không hợp lệ." });
    }

    const result = await cancelPayOSPayment(bookingId, req.user.id);
    if (result.notFound) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }
    if (result.forbidden) {
      return res.status(403).json({ message: "Không có quyền." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("cancelPayment error:", err);
    res.status(500).json({ message: err.message || "Lỗi hủy thanh toán." });
  }
};

// POST /api/payos/webhook  — PayOS webhook

export const payosWebhook = async (req, res) => {
  try {
    const payOS = createPayOSClient();
    const verifiedData = payOS.webhooks.verify(req.body);
    await syncPayOSPaymentRecord({
      orderCode: verifiedData.orderCode,
      webhookData: verifiedData,
    });
    res.json({ error: 0, message: "OK" });
  } catch (err) {
    console.error("webhook error:", err.message);
    res
      .status(400)
      .json({ error: -1, message: err.message || "Webhook không hợp lệ." });
  }
};

// ========== MENU MANAGEMENT (Admin/Staff) ==========

// GET /api/menu/items
