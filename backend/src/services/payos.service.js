import { PayOS } from "@payos/node";
import QRCode from "qrcode";
import mongoose from "mongoose";
import Booking from "../models/booking.js";
import Order from "../models/order.js";
import Payment from "../models/payment.js";
import Invoice from "../models/invoice.js";
import { ORDER_STATUS, PAYMENT_METHOD } from "../constants/domain.js";

const PAYOS_PAYMENT_METHOD = PAYMENT_METHOD.QR_PAYOS;
const PAYOS_PENDING_STATUSES = new Set(["PENDING", "PROCESSING", "UNDERPAID"]);
const PAYOS_FAILED_STATUSES = new Set(["CANCELLED", "EXPIRED", "FAILED"]);

export function isPayOSConfigured() {
  return Boolean(
    process.env.PAYOS_CLIENT_ID &&
    process.env.PAYOS_API_KEY &&
    process.env.PAYOS_CHECKSUM_KEY,
  );
}

export function createPayOSClient() {
  return new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY,
  );
}

function createOrderCode() {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return Number(`${timestamp}${random}`);
}

function createShortDescription(bookingCode, orderCode) {
  const suffix = String(bookingCode || orderCode)
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-5)
    .toUpperCase();
  return `NX${suffix || String(orderCode).slice(-4)}`.slice(0, 9);
}

function mapPayOSStatus(status) {
  if (status === "PAID") return "Success";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "EXPIRED") return "Expired";
  if (status === "FAILED") return "Failed";
  return "Pending";
}

async function ensureInvoice(bookingId, depositAmount) {
  let invoice = await Invoice.findOne({ bookingId }).lean();
  if (invoice) return invoice;
  const totalAmount = Math.round(Number(depositAmount || 0));
  invoice = await Invoice.create({
    bookingId,
    orderIds: [],
    totalAmount,
    remainingAmount: totalAmount,
    status: totalAmount > 0 ? "Pending" : "Paid",
  });
  return invoice.toObject();
}

export async function getBookingPaymentSnapshot(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return null;

  const invoice = await ensureInvoice(booking._id, booking.depositAmount);
  const payments = await Payment.find({ invoiceId: invoice._id })
    .sort({ createdAt: -1 })
    .lean();

  const successPaid = payments
    .filter((p) => p.paymentStatus === "Success")
    .reduce((s, p) => s + Math.round(Number(p.amount || 0)), 0);

  const totalAmount = Math.round(Number(invoice.totalAmount || 0));
  const remainingAmount = Math.max(0, Math.round(totalAmount - successPaid));

  const pendingPayOSPayment = payments.find(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p.payos?.checkoutUrl,
  );
  const latestPayOSPayment = payments.find(
    (p) => p.paymentMethod === PAYOS_PAYMENT_METHOD && p.payos,
  );

  let stateLabel = "Chưa thanh toán";
  let stateVariant = "secondary";
  if (remainingAmount <= 0) {
    stateLabel = "Đã thanh toán";
    stateVariant = "success";
  } else if (pendingPayOSPayment) {
    stateLabel = "Đang chờ thanh toán";
    stateVariant = "warning";
  }

  return {
    booking,
    invoice,
    payments,
    pendingPayOSPayment,
    latestPayOSPayment,
    paymentUi: {
      remainingAmount,
      canPay: remainingAmount > 0,
      stateLabel,
      stateVariant,
    },
  };
}

export async function createOrReusePayOSPayment({ booking, buyer, origin }) {
  const payOS = createPayOSClient();
  const invoice = await ensureInvoice(booking._id, booking.depositAmount);

  const paymentHistory = await Payment.find({ invoiceId: invoice._id })
    .sort({ createdAt: -1 })
    .lean();

  const successPaid = paymentHistory
    .filter((p) => p.paymentStatus === "Success")
    .reduce((s, p) => s + Math.round(Number(p.amount || 0)), 0);
  const remainingAmount = Math.max(
    0,
    Math.round(Number(invoice.totalAmount || 0) - successPaid),
  );

  console.log("createOrReusePayOSPayment:", {
    invoiceTotal: invoice.totalAmount,
    successPaid,
    remainingAmount,
    pendingPayments: paymentHistory.filter((p) => p.paymentStatus === "Pending")
      .length,
  });

  if (remainingAmount <= 0) return { alreadyPaid: true };

  // Check if there's an active pending payment with MATCHING amount
  // If remainingAmount changed (e.g., new order added), we need a NEW payment link
  const activePending = paymentHistory.find(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p.payos?.checkoutUrl &&
      Math.round(Number(p.amount || 0)) === remainingAmount, // Amount must match
  );

  if (activePending) {
    try {
      const link = await payOS.paymentRequests.get(
        activePending.payos.orderCode,
      );
      if (PAYOS_PENDING_STATUSES.has(link.status)) {
        console.log(
          "Reusing payment link with matching amount:",
          activePending.payos.orderCode,
        );
        return { reused: true, payment: activePending };
      }
      if (PAYOS_FAILED_STATUSES.has(link.status)) {
        await syncPayOSPaymentRecord({
          orderCode: activePending.payos.orderCode,
          paymentLink: link,
        });
      }
    } catch {
      /* ignore, create new */
    }
  }

  // Cancel any old pending payments that don't match the current amount
  const oldPendingPayments = paymentHistory.filter(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p._id.toString() !== activePending?._id?.toString(),
  );

  if (oldPendingPayments.length > 0) {
    console.log("Cancelling old pending payments:", oldPendingPayments.length);
  }

  for (const oldPayment of oldPendingPayments) {
    try {
      if (oldPayment.payos?.orderCode) {
        await payOS.paymentRequests.cancel(oldPayment.payos.orderCode);
      }
      await Payment.findByIdAndUpdate(oldPayment._id, {
        paymentStatus: "Cancelled",
        "payos.status": "CANCELLED",
      });
    } catch (err) {
      console.log("Could not cancel old payment:", err.message);
    }
  }

  console.log("Creating new payment link for amount:", remainingAmount);

  const orderCode = createOrderCode();
  const amount = Math.round(remainingAmount);
  const description = createShortDescription(booking.bookingCode, orderCode);

  const returnUrl =
    process.env.PAYOS_RETURN_URL || `${origin}/dashboard?payment=success`;
  const cancelUrl =
    process.env.PAYOS_CANCEL_URL || `${origin}/dashboard?payment=cancelled`;

  try {
    // Tạo link thanh toán PayOS với QR code cho khách đặt cọc
    const paymentLink = await payOS.paymentRequests.create({
      orderCode,      // Mã đơn hàng duy nhất
      amount,         // Số tiền đặt cọc
      description,    // Mô tả thanh toán
      returnUrl,      // URL sau khi thanh toán thành công
      cancelUrl,      // URL sau khi hủy thanh toán
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,  // Hết hạn sau 15 phút
      buyerName: buyer?.fullName || booking?.guestInfo?.name || "Khách hàng",
      buyerEmail: buyer?.email || booking?.guestInfo?.email,
      buyerPhone: buyer?.phone || booking?.guestInfo?.phone,
      // Danh sách mặt hàng hiển thị trên QR code và trang thanh toán
      items: [
        {
          name: `Dat coc ${booking.bookingCode || booking._id}`.slice(0, 25),  // Tên mặt hàng (tối đa 25 ký tự)
          quantity: 1,                                                           // Số lượng
          price: amount,                                                         // Giá tiền đặt cọc
        },
      ],
    });

    const now = new Date();
    // Lưu thông tin thanh toán vào database
    const payment = await Payment.create({
      invoiceId: invoice._id,           // ID hóa đơn
      bookingId: booking._id,           // ID booking
      paymentMethod: PAYOS_PAYMENT_METHOD,  // Phương thức: PayOS
      transactionId: paymentLink.paymentLinkId,
      amount,                           // Số tiền thanh toán
      paymentStatus: "Pending",         // Trạng thái: Đang chờ
      createdAt: now,
      payos: {
        orderCode,
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,   // Link trang thanh toán
        qrCode: paymentLink.qrCode,             // Link QR code (khách quét để thanh toán)
        bin: paymentLink.bin,
        accountNumber: paymentLink.accountNumber,
        accountName: paymentLink.accountName,
        status: paymentLink.status,             // Trạng thái từ PayOS
        expiredAt: paymentLink.expiredAt,
        amountPaid: 0,
        amountRemaining: amount,
        lastSyncedAt: now,
        description,
      },
    });

    // Mark booking as awaiting payment
    if (["Pending", "Confirmed"].includes(booking.status || "")) {
      await Booking.findByIdAndUpdate(booking._id, {
        status: "Awaiting_Payment",
      });
    }

    return { reused: false, payment: payment.toObject() };
  } catch (payosError) {
    console.error("PayOS API error:", payosError);
    throw new Error(
      `Lỗi kết nối với PayOS: ${payosError.message || "Không thể tạo link thanh toán. Vui lòng kiểm tra cấu hình PayOS."}`,
    );
  }
}

export async function syncPayOSPaymentRecord({
  orderCode,
  paymentLink,
  webhookData,
}) {
  const payment = await Payment.findOne({
    "payos.orderCode": Number(orderCode),
  });
  if (!payment) return { payment: null, invoice: null, booking: null };

  const derivedStatus =
    paymentLink?.status || (webhookData?.code === "00" ? "PAID" : "FAILED");
  const paymentStatus = mapPayOSStatus(derivedStatus);
  const now = new Date();
  const paidAt =
    paymentStatus === "Success"
      ? new Date(webhookData?.transactionDateTime || now)
      : payment.paidAt || null;

  payment.paymentStatus = paymentStatus;
  payment.paidAt = paidAt;
  payment.updatedAt = now;
  if (payment.payos) {
    payment.payos.status = derivedStatus;
    payment.payos.amountPaid = Math.round(
      paymentLink?.amountPaid ??
        (paymentStatus === "Success" ? Number(payment.amount || 0) : 0),
    );
    payment.payos.amountRemaining = Math.round(
      paymentLink?.amountRemaining ??
        (paymentStatus === "Success" ? 0 : payment.payos?.amountRemaining || 0),
    );
    payment.payos.lastSyncedAt = now;
  }
  await payment.save();

  const invoice = await Invoice.findById(payment.invoiceId);
  if (invoice) {
    const successPayments = await Payment.find({
      invoiceId: invoice._id,
      paymentStatus: "Success",
    }).lean();
    const totalPaid = successPayments.reduce(
      (s, p) => s + Math.round(Number(p.amount || 0)),
      0,
    );
    const remaining = Math.max(
      0,
      Math.round(Number(invoice.totalAmount || 0) - totalPaid),
    );
    invoice.remainingAmount = remaining;
    invoice.status =
      remaining <= 0 ? "Paid" : totalPaid > 0 ? "Partially_Paid" : "Pending";
    await invoice.save();

    // Cập nhật trạng thái booking nếu thanh toán đủ
    const booking = await Booking.findById(invoice.bookingId);
    if (
      booking &&
      remaining <= 0 &&
      ["Pending", "Awaiting_Payment"].includes(booking.status || "")
    ) {
      booking.status = "Confirmed";
      await booking.save();
    }

    // Cập nhật trạng thái các order liên quan khi invoice đã thanh toán đủ
    if (remaining <= 0 && invoice.orderIds && invoice.orderIds.length > 0) {
      await Order.updateMany(
        {
          _id: { $in: invoice.orderIds },
          status: ORDER_STATUS.PENDING,
        },
        {
          $set: { status: ORDER_STATUS.CONFIRMED, updatedAt: now },
        },
      );
    }
  }

  return {
    payment: await Payment.findById(payment._id).lean(),
    invoice: invoice ? await Invoice.findById(invoice._id).lean() : null,
    booking: invoice ? await Booking.findById(invoice.bookingId).lean() : null,
  };
}

export async function cancelPayOSPayment(bookingId, userId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return { notFound: true };
  if (booking.userId?.toString() !== userId.toString())
    return { forbidden: true };

  const invoice = await Invoice.findOne({ bookingId: booking._id }).lean();
  if (!invoice) return { success: true }; // nothing to cancel

  const pendingPayment = await Payment.findOne({
    invoiceId: invoice._id,
    paymentMethod: PAYOS_PAYMENT_METHOD,
    paymentStatus: "Pending",
  });

  if (pendingPayment?.payos?.orderCode && isPayOSConfigured()) {
    try {
      const payOS = createPayOSClient();
      await payOS.paymentRequests.cancel(pendingPayment.payos.orderCode);
    } catch {
      /* ignore PayOS errors — still mark local records */
    }
  }

  if (pendingPayment) {
    pendingPayment.paymentStatus = "Cancelled";
    if (pendingPayment.payos) pendingPayment.payos.status = "CANCELLED";
    await pendingPayment.save();
  }

  // Cancel the booking if it was only awaiting payment
  if (["Pending", "Awaiting_Payment"].includes(booking.status || "")) {
    await Booking.findByIdAndUpdate(booking._id, { status: "Cancelled" });
  }

  // Update invoice
  if (invoice) {
    await Invoice.findByIdAndUpdate(invoice._id, { status: "Cancelled" });
  }

  return { success: true };
}

export async function buildPaymentPageData(bookingId, userId) {
  const snapshot = await getBookingPaymentSnapshot(bookingId);
  if (!snapshot) return null;

  if (snapshot.booking.userId?.toString() !== userId.toString()) return null;

  // Sync pending payment status
  const pendingPayment = snapshot.pendingPayOSPayment;
  let freshSnapshot = snapshot;
  if (isPayOSConfigured() && pendingPayment?.payos?.orderCode) {
    try {
      const payOS = createPayOSClient();
      const link = await payOS.paymentRequests.get(
        pendingPayment.payos.orderCode,
      );
      await syncPayOSPaymentRecord({
        orderCode: pendingPayment.payos.orderCode,
        paymentLink: link,
      });
      freshSnapshot = await getBookingPaymentSnapshot(bookingId);
    } catch {
      /* keep as is */
    }
  }

  const activePayment =
    freshSnapshot.pendingPayOSPayment ||
    freshSnapshot.latestPayOSPayment ||
    null;
  const qrCodeValue = activePayment?.payos?.qrCode || "";
  let qrCodeDataUrl = null;
  if (qrCodeValue) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrCodeValue, {
        margin: 1,
        width: 320,
        color: { dark: "#111827", light: "#ffffff" },
      });
    } catch {
      /* skip */
    }
  }

  return { snapshot: freshSnapshot, activePayment, qrCodeDataUrl, qrCodeValue };
}

// ─── Order Payment Functions ───────────────────────────────────────

export async function getOrderPaymentSnapshot(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) return null;

  // Find invoice for this order (orderIds contains this orderId)
  const invoice = await Invoice.findOne({ orderIds: orderId }).lean();
  if (!invoice) return null;

  const payments = await Payment.find({ invoiceId: invoice._id })
    .sort({ createdAt: -1 })
    .lean();

  const successPaid = payments
    .filter((p) => p.paymentStatus === "Success")
    .reduce((s, p) => s + Math.round(Number(p.amount || 0)), 0);

  const totalAmount = Math.round(Number(invoice.totalAmount || 0));
  const remainingAmount = Math.max(0, Math.round(totalAmount - successPaid));

  const pendingPayOSPayment = payments.find(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p.payos?.checkoutUrl,
  );
  const latestPayOSPayment = payments.find(
    (p) => p.paymentMethod === PAYOS_PAYMENT_METHOD && p.payos,
  );

  let stateLabel = "Chưa thanh toán";
  let stateVariant = "secondary";
  if (remainingAmount <= 0) {
    stateLabel = "Đã thanh toán";
    stateVariant = "success";
  } else if (pendingPayOSPayment) {
    stateLabel = "Đang chờ thanh toán";
    stateVariant = "warning";
  }

  return {
    order,
    invoice,
    payments,
    pendingPayOSPayment,
    latestPayOSPayment,
    paymentUi: {
      remainingAmount,
      canPay: remainingAmount > 0,
      stateLabel,
      stateVariant,
    },
  };
}

export async function createOrReuseOrderPayOSPayment({
  order,
  buyer,
  origin,
  returnPath,
  cancelPath,
}) {
  const payOS = createPayOSClient();

  // Find invoice for this order
  const invoice = await Invoice.findOne({ orderIds: order._id }).lean();
  if (!invoice) {
    throw new Error("Invoice not found for this order");
  }

  const paymentHistory = await Payment.find({ invoiceId: invoice._id })
    .sort({ createdAt: -1 })
    .lean();

  const successPaid = paymentHistory
    .filter((p) => p.paymentStatus === "Success")
    .reduce((s, p) => s + Math.round(Number(p.amount || 0)), 0);
  const remainingAmount = Math.max(
    0,
    Math.round(Number(invoice.totalAmount || 0) - successPaid),
  );

  console.log("createOrReuseOrderPayOSPayment:", {
    orderId: order._id,
    invoiceTotal: invoice.totalAmount,
    successPaid,
    remainingAmount,
    pendingPayments: paymentHistory.filter((p) => p.paymentStatus === "Pending")
      .length,
  });

  if (remainingAmount <= 0) return { alreadyPaid: true };

  // Check for active pending payment with matching amount
  const activePending = paymentHistory.find(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p.payos?.checkoutUrl &&
      Math.round(Number(p.amount || 0)) === remainingAmount,
  );

  if (activePending) {
    try {
      const link = await payOS.paymentRequests.get(
        activePending.payos.orderCode,
      );
      if (PAYOS_PENDING_STATUSES.has(link.status)) {
        console.log(
          "Reusing order payment link:",
          activePending.payos.orderCode,
        );
        return { reused: true, payment: activePending };
      }
      if (PAYOS_FAILED_STATUSES.has(link.status)) {
        await syncPayOSPaymentRecord({
          orderCode: activePending.payos.orderCode,
          paymentLink: link,
        });
      }
    } catch {
      /* ignore, create new */
    }
  }

  // Cancel old pending payments with wrong amounts
  const oldPendingPayments = paymentHistory.filter(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p._id.toString() !== activePending?._id?.toString(),
  );

  if (oldPendingPayments.length > 0) {
    console.log(
      "Cancelling old order pending payments:",
      oldPendingPayments.length,
    );
  }

  for (const oldPayment of oldPendingPayments) {
    try {
      if (oldPayment.payos?.orderCode) {
        await payOS.paymentRequests.cancel(oldPayment.payos.orderCode);
      }
      await Payment.findByIdAndUpdate(oldPayment._id, {
        paymentStatus: "Cancelled",
        "payos.status": "CANCELLED",
      });
    } catch (err) {
      console.log("Could not cancel old order payment:", err.message);
    }
  }

  console.log("Creating new order payment link for amount:", remainingAmount);

  // Create new PayOS payment
  try {
    const amount = remainingAmount;
    const orderCode = createOrderCode();
    const description = createShortDescription(order._id.toString(), orderCode);
    const frontendOrigin = origin || process.env.FRONTEND_URL || "http://localhost:5173";
    const normalizedReturnPath = returnPath || `/payment/order/${order._id}`;
    const normalizedCancelPath = cancelPath || "/customer-dashboard/orders";
    const returnUrl = `${frontendOrigin}${normalizedReturnPath}`;
    const cancelUrl = `${frontendOrigin}${normalizedCancelPath}`;

    // Tạo link thanh toán PayOS với QR code cho đơn hàng
    const paymentLink = await payOS.paymentRequests.create({
      orderCode,      // Mã đơn hàng duy nhất
      amount,         // Tổng tiền đơn hàng
      description,    // Mô tả thanh toán
      cancelUrl,      // URL sau khi hủy thanh toán
      returnUrl,      // URL sau khi thanh toán thành công
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,  // Hết hạn sau 15 phút
      buyerName: buyer?.fullName || "Khách hàng",
      buyerEmail: buyer?.email,
      buyerPhone: buyer?.phone,
      // Danh sách mặt hàng hiển thị trên QR code và trang thanh toán
      items: [
        {
          name: `Don hang ${order._id.toString().slice(-8)}`.slice(0, 25),  // Tên mặt hàng (tối đa 25 ký tự)
          quantity: 1,                                                       // Số lượng
          price: amount,                                                     // Tổng giá đơn hàng
        },
      ],
    });

    const now = new Date();
    // Lưu thông tin thanh toán vào database
    const payment = await Payment.create({
      invoiceId: invoice._id,           // ID hóa đơn
      // No bookingId - this is order payment (thanh toán đơn hàng, không có bookingId)
      paymentMethod: PAYOS_PAYMENT_METHOD,  // Phương thức: PayOS
      transactionId: paymentLink.paymentLinkId,
      amount,                           // Số tiền thanh toán
      paymentStatus: "Pending",         // Trạng thái: Đang chờ
      createdAt: now,
      payos: {
        orderCode,
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,   // Link trang thanh toán
        qrCode: paymentLink.qrCode,             // Link QR code (khách quét để thanh toán)
        bin: paymentLink.bin,
        accountNumber: paymentLink.accountNumber,
        accountName: paymentLink.accountName,
        status: paymentLink.status,             // Trạng thái từ PayOS
        expiredAt: paymentLink.expiredAt,
        amountPaid: 0,
        amountRemaining: amount,
        lastSyncedAt: now,
        description,
      },
    });

    return { reused: false, payment: payment.toObject() };
  } catch (payosError) {
    console.error("PayOS API error for order:", payosError);
    throw new Error(
      `Lỗi kết nối với PayOS: ${payosError.message || "Không thể tạo link thanh toán."}`,
    );
  }
}

export async function buildOrderPaymentPageData(orderId, userId) {
  const snapshot = await getOrderPaymentSnapshot(orderId);
  if (!snapshot) return null;

  // Check ownership
  if (snapshot.order.userId?.toString() !== userId.toString()) return null;

  // Sync pending payment status
  const pendingPayment = snapshot.pendingPayOSPayment;
  let freshSnapshot = snapshot;
  if (isPayOSConfigured() && pendingPayment?.payos?.orderCode) {
    try {
      const payOS = createPayOSClient();
      const link = await payOS.paymentRequests.get(
        pendingPayment.payos.orderCode,
      );
      await syncPayOSPaymentRecord({
        orderCode: pendingPayment.payos.orderCode,
        paymentLink: link,
      });
      freshSnapshot = await getOrderPaymentSnapshot(orderId);
    } catch {
      /* keep as is */
    }
  }

  const activePayment =
    freshSnapshot.pendingPayOSPayment ||
    freshSnapshot.latestPayOSPayment ||
    null;
  const qrCodeValue = activePayment?.payos?.qrCode || "";
  let qrCodeDataUrl = null;
  if (qrCodeValue) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrCodeValue, {
        margin: 1,
        width: 320,
        color: { dark: "#111827", light: "#ffffff" },
      });
    } catch {
      /* skip */
    }
  }

  return { snapshot: freshSnapshot, activePayment, qrCodeDataUrl, qrCodeValue };
}

// ────────────────────────────────────────────────────────────────────────────────
// Counter Order Payment (Booking + Order Combined)
// ────────────────────────────────────────────────────────────────────────────────

export async function createCounterOrderPayment({ booking, order, invoice, buyer, origin }) {
  if (!isPayOSConfigured()) {
    return { 
      alreadyPaid: true,
      message: "PayOS not configured. Payment link not created."
    };
  }

  const payOS = createPayOSClient();
  
  // Check if already paid
  const payments = await Payment.find({ invoiceId: invoice._id })
    .sort({ createdAt: -1 })
    .lean();

  const successPaid = payments
    .filter((p) => p.paymentStatus === "Success")
    .reduce((s, p) => s + Math.round(Number(p.amount || 0)), 0);
  
  const totalAmount = Math.round(Number(invoice.totalAmount || 0));
  const remainingAmount = Math.max(0, totalAmount - successPaid);

  console.log("createCounterOrderPayment:", {
    bookingId: booking._id,
    orderId: order._id,
    invoiceTotal: totalAmount,
    successPaid,
    remainingAmount,
  });

  if (remainingAmount <= 0) {
    return { alreadyPaid: true };
  }

  // Check for existing pending payment with matching amount
  const activePending = payments.find(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p.payos?.checkoutUrl &&
      Math.round(Number(p.amount || 0)) === remainingAmount,
  );

  if (activePending) {
    try {
      const link = await payOS.paymentRequests.get(activePending.payos.orderCode);
      if (PAYOS_PENDING_STATUSES.has(link.status)) {
        console.log("Reusing counter order payment:", activePending.payos.orderCode);
        return { 
          reused: true, 
          payment: activePending,
          checkoutUrl: activePending.payos.checkoutUrl,
          qrCode: activePending.payos.qrCode,
        };
      }
      if (PAYOS_FAILED_STATUSES.has(link.status)) {
        await syncPayOSPaymentRecord({
          orderCode: activePending.payos.orderCode,
          paymentLink: link,
        });
      }
    } catch {
      /* create new */
    }
  }

  // Cancel old pending payments
  const oldPending = payments.filter(
    (p) =>
      p.paymentMethod === PAYOS_PAYMENT_METHOD &&
      p.paymentStatus === "Pending" &&
      p._id.toString() !== activePending?._id?.toString(),
  );

  for (const old of oldPending) {
    try {
      if (old.payos?.orderCode) {
        await payOS.paymentRequests.cancel(old.payos.orderCode);
      }
      await Payment.findByIdAndUpdate(old._id, {
        paymentStatus: "Cancelled",
        "payos.status": "CANCELLED",
      });
    } catch {
      /* ignore */
    }
  }

  // Create new payment link
  console.log("Creating counter order payment for amount:", remainingAmount);

  // Chuẩn bị thông tin thanh toán
  const orderCode = createOrderCode();  // Tạo mã đơn hàng ngẫu nhiên duy nhất
  const amount = Math.round(remainingAmount);  // Làm tròn số tiền
  const description = createShortDescription(  // Tạo mô tả ngắn gọn cho thanh toán
    booking.bookingCode,
    `ORD${String(order._id).slice(-6)}`,
  );

  // URL chuyển hướng sau khi thanh toán thành công hoặc hủy
  const returnUrl = `${origin}/staff-dashboard/orders?payment=success`;
  const cancelUrl = `${origin}/staff-dashboard/orders?payment=cancelled`;

  try {
    // Tạo link thanh toán PayOS với QR code cho khách hàng
    const paymentLink = await payOS.paymentRequests.create({
      orderCode,      // Mã đơn hàng duy nhất
      amount,         // Số tiền cần thanh toán
      description,    // Mô tả thanh toán
      returnUrl,      // URL sau khi thanh toán thành công
      cancelUrl,      // URL sau khi hủy thanh toán
      // Danh sách mặt hàng hiển thị trên QR code và trang thanh toán
      items: [
        {
          name: `Thanh toán đơn ${booking.bookingCode} + Order`,  // Tên mặt hàng hiển thị cho khách
          quantity: 1,                                            // Số lượng
          price: amount,                                          // Giá (bằng tổng tiền)
        },
      ],
      // Thông tin người mua (hiển thị trên trang thanh toán)
      buyerName: buyer?.name || "Guest",
      buyerPhone: buyer?.phone || "",
    });

    // Lưu thông tin thanh toán vào database
    const newPayment = await Payment.create({
      invoiceId: invoice._id,           // ID hóa đơn
      userId: booking.userId,           // ID người dùng
      amount,                           // Số tiền thanh toán
      paymentMethod: PAYOS_PAYMENT_METHOD,  // Phương thức: PayOS
      paymentStatus: "Pending",         // Trạng thái: Đang chờ
      payos: {
        orderCode: paymentLink.orderCode,       // Mã đơn từ PayOS
        checkoutUrl: paymentLink.checkoutUrl,   // Link trang thanh toán
        qrCode: paymentLink.qrCode,             // Link QR code (khách quét để thanh toán)
        status: paymentLink.status,             // Trạng thái từ PayOS
      },
    });

    console.log("Counter order payment created:", {
      orderCode: paymentLink.orderCode,
      amount,
    });

    return {
      created: true,
      payment: newPayment,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
    };
  } catch (err) {
    console.error("Failed to create counter order payment:", err);
    throw new Error(`Không thể tạo payment link: ${err.message}`);
  }
}
