import mongoose from "mongoose";

export const PAYMENT_STATUS = Object.freeze({
  CREATED:  "created",   // Razorpay order placed, awaiting user action
  VERIFIED: "verified",  // signature verified; awaiting booking confirmation
  CONSUMED: "consumed",  // attached to a booking; no longer usable
  FAILED:   "failed",    // signature mismatch, amount mismatch, or booking failure
  EXPIRED:  "expired",   // order TTL passed without verification
  REFUNDED: "refunded",  // refund issued (e.g. availability race)
});

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // What the payment is for — must match the booking exactly
    hostelId:      { type: String, required: true, trim: true },
    roomSelection: { type: String, required: true, trim: true },

    // The booking that was held when the order was created. Stored so
    // that if the hold expires between order creation and verification,
    // we can detect the mismatch. NOT a FK guarantee — the booking may
    // have expired by verification time.
    heldBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },

    // Client-supplied; same key + same user → same order returned.
    idempotencyKey: { type: String, required: true, trim: true },

    // ── Razorpay identifiers ───────────────────────────────────────────
    razorpay_order_id:   { type: String, required: true, unique: true },
    razorpay_payment_id: { type: String, required: true, unique: true },
    razorpay_signature:  { type: String, default: null },

    amount:   { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: "INR", uppercase: true, enum: ["INR"] },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.CREATED,
      index: true,
    },

    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },

    // Razorpay orders expire in 15 min.
    expiresAt: { type: Date, required: true, index: true },

    verifiedAt:  { type: Date, default: null },
    consumedAt:  { type: Date, default: null },
    refundedAt:  { type: Date, default: null },

    failureReason: { type: String, default: null, maxlength: 500 },
    refundId:      { type: String, default: null }, // Razorpay refund id
    refundAmount:  { type: Number, default: 0, min: 0 }, // paise
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────

// Idempotency: same client retry → same Razorpay order
paymentSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true }
);

// One payment → one booking, enforced by Mongo
paymentSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { booking: { $type: "objectId" } } }
);

// Cron: find created-but-unpaid orders past TTL
paymentSchema.index(
  { status: 1, expiresAt: 1 },
  { partialFilterExpression: { status: PAYMENT_STATUS.CREATED } }
);

// Admin listing
paymentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);