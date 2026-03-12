import { PayOS } from "@payos/node";
import QRCode from "qrcode";
import mongoose from "mongoose";
import Booking from "../models/booking.js";
import Payment from "../models/payment.js";
import Invoice from "../models/invoice.js";

const PAYOS_PAYMENT_METHOD = "PayOS";
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
  return new PayOS();
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
  const totalAmount = Number(depositAmount || 0);
  invoice = await Invoice.create({
    bookingId,
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
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const totalAmount = Number(invoice.totalAmount || 0);
  const remainingAmount = Math.max(0, totalAmount - successPaid);

  const pendingPayOSPayment = payments.find(
    (p) => p.paymentMethod === PAYOS_PAYMENT_METHOD && p.paymentStatus === "Pending" && p.payos?.checkoutUrl,
  );
  const latestPayOSPayment = payments.find(
    (p) => p.paymentMethod === PAYOS_PAYMENT_METHOD && p.payos,
  );

  let stateLabel = "Chưa thanh toán";
  let stateVariant = "secondary";
  if (remainingAmount <= 0) { stateLabel = "Đã thanh toán"; stateVariant = "success"; }
  else if (pendingPayOSPayment) { stateLabel = "Đang chờ thanh toán"; stateVariant = "warning"; }

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
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const remainingAmount = Math.max(0, Number(invoice.totalAmount || 0) - successPaid);

  if (remainingAmount <= 0) return { alreadyPaid: true };

  // Reuse existing pending link if still active
  const activePending = paymentHistory.find(
    (p) => p.paymentMethod === PAYOS_PAYMENT_METHOD && p.paymentStatus === "Pending" && p.payos?.checkoutUrl,
  );
  if (activePending) {
    try {
      const link = await payOS.paymentRequests.get(activePending.payos.orderCode);
      if (PAYOS_PENDING_STATUSES.has(link.status)) {
        return { reused: true, payment: activePending };
      }
      if (PAYOS_FAILED_STATUSES.has(link.status)) {
        await syncPayOSPaymentRecord({ orderCode: activePending.payos.orderCode, paymentLink: link });
      }
    } catch { /* ignore, create new */ }
  }

  const orderCode = createOrderCode();
  const amount = remainingAmount;
  const description = createShortDescription(booking.bookingCode, orderCode);

  const returnUrl = `${origin}/dashboard?payment=success`;
  const cancelUrl = `${origin}/dashboard?payment=cancelled`;

  const paymentLink = await payOS.paymentRequests.create({
    orderCode,
    amount,
    description,
    returnUrl,
    cancelUrl,
    expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
    buyerName: buyer?.fullName || booking?.guestInfo?.name || "Khách hàng",
    buyerEmail: buyer?.email || booking?.guestInfo?.email,
    buyerPhone: buyer?.phone || booking?.guestInfo?.phone,
    items: [
      {
        name: `Dat coc ${booking.bookingCode || booking._id}`.slice(0, 25),
        quantity: 1,
        price: amount,
      },
    ],
  });

  const now = new Date();
  const payment = await Payment.create({
    invoiceId: invoice._id,
    bookingId: booking._id,
    paymentMethod: PAYOS_PAYMENT_METHOD,
    transactionId: paymentLink.paymentLinkId,
    amount,
    paymentStatus: "Pending",
    createdAt: now,
    payos: {
      orderCode,
      paymentLinkId: paymentLink.paymentLinkId,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      bin: paymentLink.bin,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      status: paymentLink.status,
      expiredAt: paymentLink.expiredAt,
      amountPaid: 0,
      amountRemaining: amount,
      lastSyncedAt: now,
      description,
    },
  });

  // Mark booking as awaiting payment
  if (["Pending", "Confirmed"].includes(booking.status || "")) {
    await Booking.findByIdAndUpdate(booking._id, { status: "Awaiting_Payment" });
  }

  return { reused: false, payment: payment.toObject() };
}

export async function syncPayOSPaymentRecord({ orderCode, paymentLink, webhookData }) {
  const payment = await Payment.findOne({ "payos.orderCode": Number(orderCode) });
  if (!payment) return { payment: null, invoice: null, booking: null };

  const derivedStatus = paymentLink?.status || (webhookData?.code === "00" ? "PAID" : "FAILED");
  const paymentStatus = mapPayOSStatus(derivedStatus);
  const now = new Date();
  const paidAt = paymentStatus === "Success"
    ? new Date(webhookData?.transactionDateTime || now)
    : payment.paidAt || null;

  payment.paymentStatus = paymentStatus;
  payment.paidAt = paidAt;
  payment.updatedAt = now;
  if (payment.payos) {
    payment.payos.status = derivedStatus;
    payment.payos.amountPaid = paymentLink?.amountPaid ?? (paymentStatus === "Success" ? Number(payment.amount || 0) : 0);
    payment.payos.amountRemaining = paymentLink?.amountRemaining ?? (paymentStatus === "Success" ? 0 : payment.payos?.amountRemaining);
    payment.payos.lastSyncedAt = now;
  }
  await payment.save();

  const invoice = await Invoice.findById(payment.invoiceId);
  if (invoice) {
    const successPayments = await Payment.find({ invoiceId: invoice._id, paymentStatus: "Success" }).lean();
    const totalPaid = successPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const remaining = Math.max(0, Number(invoice.totalAmount || 0) - totalPaid);
    invoice.remainingAmount = remaining;
    invoice.status = remaining <= 0 ? "Paid" : totalPaid > 0 ? "Partially_Paid" : "Pending";
    await invoice.save();

    const booking = await Booking.findById(invoice.bookingId);
    if (booking && remaining <= 0 && ["Pending", "Awaiting_Payment"].includes(booking.status || "")) {
      booking.status = "Confirmed";
      await booking.save();
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
  if (booking.userId?.toString() !== userId.toString()) return { forbidden: true };

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
    } catch { /* ignore PayOS errors — still mark local records */ }
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
      const link = await payOS.paymentRequests.get(pendingPayment.payos.orderCode);
      await syncPayOSPaymentRecord({ orderCode: pendingPayment.payos.orderCode, paymentLink: link });
      freshSnapshot = await getBookingPaymentSnapshot(bookingId);
    } catch { /* keep as is */ }
  }

  const activePayment = freshSnapshot.pendingPayOSPayment || freshSnapshot.latestPayOSPayment || null;
  const qrCodeValue = activePayment?.payos?.qrCode || "";
  let qrCodeDataUrl = null;
  if (qrCodeValue) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrCodeValue, {
        margin: 1, width: 320,
        color: { dark: "#111827", light: "#ffffff" },
      });
    } catch { /* skip */ }
  }

  return { snapshot: freshSnapshot, activePayment, qrCodeDataUrl, qrCodeValue };
}
