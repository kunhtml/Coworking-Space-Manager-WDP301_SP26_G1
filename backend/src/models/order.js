import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: "Booking"
        },
        status: String,
        totalAmount: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

const Order = mongoose.model("Order", orderSchema, "orders");

export default Order;