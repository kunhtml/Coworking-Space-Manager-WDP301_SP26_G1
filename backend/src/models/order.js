import mongoose from "mongoose";
import { ORDER_STATUS } from "../constants/domain.js";
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
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.PENDING,
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