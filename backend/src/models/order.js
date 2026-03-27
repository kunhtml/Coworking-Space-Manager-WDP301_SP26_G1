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
        guestInfo: {
            name: String,
            phone: String,
            email: String,
        },
        status: {
            type: String,
            enum: ["PENDING", "CONFIRMED", "PREPARING", "SERVED", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },
        totalAmount: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

const Order = mongoose.model("Order", orderSchema, "orders");

export default Order;