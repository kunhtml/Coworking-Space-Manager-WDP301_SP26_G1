import mongoose from "mongoose";
import { MENU_AVAILABILITY, MENU_AVAILABILITY_VALUES } from "../constants/domain.js";
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
        availabilityStatus: {
            type: String,
            enum: MENU_AVAILABILITY_VALUES,
            default: MENU_AVAILABILITY.AVAILABLE,
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema, "menu_items");

export default MenuItem;