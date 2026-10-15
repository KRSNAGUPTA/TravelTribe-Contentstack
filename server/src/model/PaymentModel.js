import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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
    razorpay_order_id: {
      type: String,
      required: true,
      unique: true,
    },
    razorpay_payment_id: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "verified", "failed"],
      default: "created",
    },
    used: {
      type: Boolean,
      default: false,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, status: 1, used: 1 });

export default mongoose.model("Payment", paymentSchema);