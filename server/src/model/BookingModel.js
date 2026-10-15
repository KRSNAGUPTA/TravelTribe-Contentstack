import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostelId: {
      type: String,
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    roomSelection: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    receiptId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  { timestamps: true }
);

bookingSchema.index({
  hostelId: 1,
  roomSelection: 1,
  checkInDate: 1,
  checkOutDate: 1,
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;