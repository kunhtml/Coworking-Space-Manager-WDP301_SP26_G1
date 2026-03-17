import mongoose from "mongoose";
const { Schema } = mongoose;

const tableTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TableType = mongoose.model("TableType", tableTypeSchema, "table_types");

export default TableType;
