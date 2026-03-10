import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema(
    {
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: "Invoice"
        },
        paymentMethod: String,
        transactionId: String,
        amount: Number,
        type: String,
        paymentStatus: String,
        paidAt: Date
    }
);

const Payment = mongoose.model("Payment", paymentSchema, "payments");

export default Payment;