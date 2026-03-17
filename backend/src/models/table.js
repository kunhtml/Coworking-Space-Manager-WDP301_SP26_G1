import mongoose from "mongoose";
const { Schema } = mongoose;

const tableSchema = new Schema(
    {
        name: String,
        tableType: String,
        capacity: Number,
        status: String,
        pricePerHour: Number,
        pricePerDay: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

const Table = mongoose.model("Table", tableSchema, "tables");

export default Table;