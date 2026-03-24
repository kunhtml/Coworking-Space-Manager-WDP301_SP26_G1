import Booking from "../models/booking.js";
import Order from "../models/order.js";
import User from "../models/user.js";
import Table from "../models/table.js";
import OrderItem from "../models/order_item.js";
import MenuItem from "../models/menu_item.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
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
import {
  ORDER_STATUS,
  normalizeOrderStatus,
  normalizePaymentMethod,
  PAYMENT_METHOD,
  PAYMENT_METHOD_VALUES,
} from "../constants/domain.js";

const resolveFrontendOrigin = (req) =>
  req.get("origin") || process.env.FRONTEND_URL || "http://localhost:5173";

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
    const origin = resolveFrontendOrigin(req);

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
    if (String(err.message || "").includes("Lỗi kết nối với PayOS")) {
      return res.status(400).json({ message: err.message });
    }
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
    const origin = resolveFrontendOrigin(req);

    if (!isPayOSConfigured()) {
      return res.status(400).json({ message: "PayOS chưa được cấu hình." });
    }

    const result = await createOrReuseOrderPayOSPayment({
      order,
      buyer: user,
      origin,
      returnPath: `/payment/order/${order._id}`,
      cancelPath: "/customer-dashboard/orders",
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("createOrderPayment error:", err);
    if (String(err.message || "").includes("Lỗi kết nối với PayOS")) {
      return res.status(400).json({ message: err.message });
    }
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

// POST /api/staff/payment/counter  — process counter payment for order/booking

export const processCounterPayment = async (req, res) => {
  try {
    const { orderId, bookingId, method } = req.body;
    const paymentMethod = normalizePaymentMethod(method || PAYMENT_METHOD.CASH);

    if (!PAYMENT_METHOD_VALUES.includes(paymentMethod)) {
      return res.status(400).json({ message: "Phương thức thanh toán chỉ hỗ trợ CASH hoặc QR_PAYOS." });
    }

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (bookingId) {
      order = await Order.findOne({ bookingId }).sort({ createdAt: -1 });
    } else {
      return res.status(400).json({ message: "Vui lòng cung cấp orderId hoặc bookingId." });
    }

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const booking =
      order.bookingId || bookingId
        ? await Booking.findById(order.bookingId || bookingId).lean()
        : null;

    const invoice =
      (await Invoice.findOne({ orderIds: order._id })) ||
      (order.bookingId ? await Invoice.findOne({ bookingId: order.bookingId }) : null);

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn của đơn hàng." });
    }

    const amountToPay = Math.max(
      0,
      Math.round(
        Number(invoice.remainingAmount ?? invoice.totalAmount ?? order.totalAmount ?? 0),
      ),
    );

    if (paymentMethod === PAYMENT_METHOD.QR_PAYOS) {
      if (!isPayOSConfigured()) {
        return res.status(400).json({ message: "PayOS chưa được cấu hình." });
      }

      const buyer =
        booking?.guestInfo?.name || booking?.guestInfo?.phone
          ? {
              fullName: booking?.guestInfo?.name || "Khách lẻ",
              phone: booking?.guestInfo?.phone || "",
              email: booking?.guestInfo?.email || undefined,
            }
          : order.userId
            ? await User.findById(order.userId).lean()
            : null;
      const origin = resolveFrontendOrigin(req);
      const qrPayment = await createOrReuseOrderPayOSPayment({
        order,
        buyer,
        origin,
        returnPath: "/staff-dashboard/orders?payment=success",
        cancelPath: "/staff-dashboard/orders?payment=cancelled",
      });

      return res.json({
        message: "Đã tạo QR PayOS cho đơn tại quầy.",
        orderId: order._id,
        invoiceId: invoice._id,
        method: paymentMethod,
        payment: qrPayment.payment || null,
        checkoutUrl: qrPayment.payment?.payos?.checkoutUrl || null,
        qrCode: qrPayment.payment?.payos?.qrCode || null,
      });
    }

    const payment = await Payment.create({
      invoiceId: invoice._id,
      bookingId: order.bookingId || bookingId || null,
      paymentMethod,
      transactionId: `COUNTER_${paymentMethod}_${Date.now()}`,
      amount: amountToPay,
      type: "Payment",
      paymentStatus: "Success",
      paidAt: new Date(),
    });

    const currentStatus = normalizeOrderStatus(order.status);
    if (currentStatus === ORDER_STATUS.PENDING) {
      order.status = ORDER_STATUS.CONFIRMED;
    }
    await order.save();

    invoice.remainingAmount = 0;
    invoice.status = "Paid";
    await invoice.save();

    if (
      booking &&
      ["Pending", "Awaiting_Payment"].includes(String(booking.status || ""))
    ) {
      await Booking.findByIdAndUpdate(booking._id, { status: "Confirmed" });
    }

    return res.json({
      message: "Thanh toán tại quầy thành công.",
      orderId: order._id,
      invoiceId: invoice._id,
      paymentId: payment._id,
      method: paymentMethod,
      amount: amountToPay,
      orderStatus: normalizeOrderStatus(order.status),
    });
  } catch (err) {
    console.error("processCounterPayment error:", err);
    if (String(err.message || "").includes("Lỗi kết nối với PayOS")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Lỗi xử lý thanh toán tại quầy." });
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
