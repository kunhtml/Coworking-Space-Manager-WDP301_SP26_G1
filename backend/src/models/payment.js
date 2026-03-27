import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema(
    {
        invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
        bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
        paymentMethod: {
            type: String,
            enum: ["CASH", "QR_PAYOS"],
        },
        transactionId: String,
        amount: Number,
        type: String,
        paymentStatus: {
            type: String,
            enum: ["Pending", "Success", "Failed", "Expired", "Cancelled"],
            default: "Pending"
        },
        paidAt: Date,
        payos: {
            orderCode: Number,
            paymentLinkId: String,
            checkoutUrl: String,
            qrCode: String,
            bin: String,
            accountNumber: String,
            accountName: String,
            status: String,
            expiredAt: Number,
            amountPaid: Number,
            amountRemaining: Number,
            lastSyncedAt: Date,
            description: String,
        },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema, "payments");

export default Payment;