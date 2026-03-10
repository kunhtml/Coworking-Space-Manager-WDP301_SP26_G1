import mongoose from "mongoose";
const { Schema } = mongoose;

const categorySchema = new Schema(
    {
        name: String,
        description: String,
        isActive: Boolean,
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
);

const Category = mongoose.model("Category", categorySchema, "categories");

export default Category;