import Booking from "./models/booking.js";
import Payment from "./models/payment.js";
import Invoice from "./models/invoice.js";
import {
  isPayOSConfigured,
  createPayOSClient,
} from "./services/payos.service.js";
import {
  BOOKING_PAYMENT_HOLD_MINUTES,
  PAYMENT_METHOD,
} from "./constants/domain.js";

const EXPIRE_MINUTES = BOOKING_PAYMENT_HOLD_MINUTES;
const INTERVAL_MS = 5 * 60 * 1000; // run every 5 minutes

async function expireUnpaidBookings() {
  const cutoff = new Date(Date.now() - EXPIRE_MINUTES * 60 * 1000);

  const expired = await Booking.find({
    status: { $in: ["Pending", "Awaiting_Payment"] },
    createdAt: { $lt: cutoff },
  }).lean();

  if (expired.length === 0) return;

  console.log(
    `[Scheduler] Auto-cancelling ${expired.length} expired booking(s)...`,
  );

  for (const booking of expired) {
    try {
      const invoice = await Invoice.findOne({ bookingId: booking._id });
      if (invoice) {
        // Cancel pending PayOS payment link
        const pendingPayment = await Payment.findOne({
          invoiceId: invoice._id,
          paymentMethod: PAYMENT_METHOD.QR_PAYOS,
          paymentStatus: "Pending",
        });

        if (pendingPayment?.payos?.orderCode && isPayOSConfigured()) {
          try {
            const payOS = createPayOSClient();
            await payOS.paymentRequests.cancel(pendingPayment.payos.orderCode);
          } catch {
            /* ignore PayOS errors */
          }
        }

        if (pendingPayment) {
          pendingPayment.paymentStatus = "Cancelled";
          if (pendingPayment.payos) pendingPayment.payos.status = "CANCELLED";
          await pendingPayment.save();
        }

        await Invoice.findByIdAndUpdate(invoice._id, { status: "Cancelled" });
      }

      await Booking.findByIdAndUpdate(booking._id, { status: "Cancelled" });
      console.log(
        `[Scheduler] Cancelled booking ${booking.bookingCode || booking._id}`,
      );
    } catch (err) {
      console.error(
        `[Scheduler] Error cancelling booking ${booking._id}:`,
        err.message,
      );
    }
  }
}

export function startScheduler() {
  // Run immediately on start, then every 5 minutes
  expireUnpaidBookings().catch(console.error);
  setInterval(() => expireUnpaidBookings().catch(console.error), INTERVAL_MS);
  console.log(
    `[Scheduler] Auto-expire started (${EXPIRE_MINUTES} min timeout, checks every 5 min)`,
  );
}
