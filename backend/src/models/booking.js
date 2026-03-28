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
  status: {
    type: String,
    enum: [
      "Pending",
      "Awaiting_Payment",
      "Confirmed",
      "CheckedIn",
      "Completed",
      "Cancelled",
      "Canceled",
    ],
    default: "Pending",
  },
  checkedInBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  checkedInAt: Date,
  depositAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model("Booking", bookingSchema, "bookings");

export default Booking;
