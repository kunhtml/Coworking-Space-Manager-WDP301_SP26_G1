import mongoose from "mongoose";
const { Schema } = mongoose;

const invoiceSchema = new Schema(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
        orderIds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
        subTotal: Number,
        discount: Number,
        totalAmount: Number,
        remainingAmount: Number,
        status: {
            type: String,
            enum: ["Pending", "Partially_Paid", "Paid", "Cancelled"],
            default: "Pending"
        },
    },
    { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema, "invoices");

export default Invoice;