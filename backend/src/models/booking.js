import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema({
  bookingCode: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  guestInfo: {
    name: String,
    email: String,
    phone: String,
  },
  tableId: {
    type: Schema.Types.ObjectId,
    ref: "Table",
  },
  startTime: Date,
  endTime: Date,
  status: String,
  depositAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model("Booking", bookingSchema, "bookings");

export default Booking;
