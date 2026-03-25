import mongoose from "mongoose";
const { Schema } = mongoose;

const tableSchema = new Schema({
  name: String,
  tableTypeId: {
    type: Schema.Types.ObjectId,
    ref: "TableType",
    default: null,
  },
  status: String,
  description: String,
  pricePerHour: Number,
  pricePerDay: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Table = mongoose.model("Table", tableSchema, "tables");

export default Table;
