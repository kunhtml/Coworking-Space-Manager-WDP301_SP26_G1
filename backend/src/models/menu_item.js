import mongoose from "mongoose";
const { Schema } = mongoose;

const menuItemSchema = new Schema(
    {
        name: String,
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category"
        },
        description: String,
        price: Number,
        stockQuantity: Number,
        availabilityStatus: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema, "menu_items");

export default MenuItem;