import mongoose from "mongoose";
const { Schema } = mongoose;

const orderItemSchema = new Schema(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order"
        },
        menuItemId: {
            type: Schema.Types.ObjectId,
            ref: "MenuItem"
        },
        quantity: Number,
        priceAtOrder: Number,
        note: String
    }
);

const OrderItem = mongoose.model("OrderItem", orderItemSchema, "order_items");

export default OrderItem;