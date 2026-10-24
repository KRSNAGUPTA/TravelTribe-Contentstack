import mongoose from "mongoose";

export const BOOKING_STATUS = Object.freeze({
  PENDING:   "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  EXPIRED:   "expired",
});

// Only these transitions are legal. Anything else throws.
const ALLOWED_TRANSITIONS = {
  pending:   ["confirmed", "cancelled", "expired"],
  confirmed: ["cancelled"],
  cancelled: [],
  expired:   [],
};

export const ACTIVE_STATUSES = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    hostelId:      { type: String, required: true, trim: true, index: true },
    roomSelection: { type: String, required: true, trim: true },

    // is: checkInDate/checkOutDate are pure "calendar days," never time-of-day.
    checkInDate:  { type: Date, required: true },
    checkOutDate: { type: Date, required: true },

    // Cached. Validated in pre('validate') so it can't drift from dates.
    nights: { type: Number, required: true, min: 1, max: 90 },

    price_per_night_snapshot: { type: Number, required: true, min: 0 },
    amount:   { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR", uppercase: true, enum: ["INR"] },

    guest: {
      name:   { type: String, required: true, trim: true, maxlength: 100 },
      email:  { type: String, required: true, lowercase: true, trim: true },
      phone:  { type: String, required: true, trim: true, maxlength: 20 },
      gender: { type: String, required: true, enum: ["male", "female", "other"] },
    },

    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },

    holdExpiresAt: { type: Date, required: true },

    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    expiredAt:   { type: Date, default: null },

    cancellationReason: { type: String, default: null, maxlength: 500 },

    statusHistory: [
      {
        from:   { type: String, default: null },
        to:     { type: String, required: true },
        at:     { type: Date, default: Date.now },
        by:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        reason: { type: String, default: null },
      },
    ],

    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },

    // Client-supplied, unique. Retries of the same POST return the same booking.
    idempotencyKey: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Availability query: find all ACTIVE bookings for (hostel, room) overlapping [in, out)
bookingSchema.index({
  hostelId: 1,
  roomSelection: 1,
  status: 1,
  checkInDate: 1,
  checkOutDate: 1,
});

// Cron: find pending bookings past their hold deadline
bookingSchema.index(
  { status: 1, holdExpiresAt: 1 },
  { partialFilterExpression: { status: BOOKING_STATUS.PENDING } }
);

// One payment → one booking, enforced by Mongo
bookingSchema.index(
  { payment: 1 },
  { unique: true, partialFilterExpression: { payment: { $type: "objectId" } } }
);

// Idempotency: same client retry → same booking
bookingSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true }
);

// User listing
bookingSchema.index({ user: 1, createdAt: -1 });

// Admin listing
bookingSchema.index({ status: 1, createdAt: -1 });

// ── Validators ─────────────────────────────────────────────────────────────

bookingSchema.pre("validate", function (next) {
  if (!this.checkInDate || !this.checkOutDate) return next();

  // Enforce UTC-midnight invariant — catches accidental local-time writes
  const isUtcMidnight = (d) =>
    d.getUTCHours() === 0 && d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;

  if (!isUtcMidnight(this.checkInDate) || !isUtcMidnight(this.checkOutDate)) {
    return next(new Error("Dates must be UTC midnight (calendar days only)"));
  }

  if (this.checkOutDate <= this.checkInDate) {
    return next(new Error("checkOutDate must be after checkInDate"));
  }

  const ms = this.checkOutDate.getTime() - this.checkInDate.getTime();
  const nights = Math.round(ms / 86_400_000);

  if (nights < 1)  return next(new Error("Booking must be at least 1 night"));
  if (nights > 90) return next(new Error("Booking cannot exceed 90 nights"));

  this.nights = nights;
  next();
});

bookingSchema.methods.transitionTo = function (to, { by = null, reason = null } = {}) {
  const from = this.status;
  if (!(ALLOWED_TRANSITIONS[from] || []).includes(to)) {
    const err = new Error(`Illegal booking transition: ${from} → ${to}`);
    err.status = 400;
    throw err;
  }
  this.status = to;
  this.statusHistory.push({ from, to, at: new Date(), by, reason });

  if (to === BOOKING_STATUS.CONFIRMED) this.confirmedAt = new Date();
  if (to === BOOKING_STATUS.CANCELLED) {
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  }
  if (to === BOOKING_STATUS.EXPIRED) this.expiredAt = new Date();
};

// Convenience — the only bookings that occupy a bed on a given night.
bookingSchema.statics.findOverlapping = function (hostelId, roomKey, checkIn, checkOut, session = null) {
  const query = this.find({
    hostelId,
    roomSelection: roomKey,
    status: { $in: ACTIVE_STATUSES },
    checkInDate:  { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
  }).select("checkInDate checkOutDate");
  if (session) query.session(session);
  return query;
};

export default mongoose.model("Booking", bookingSchema);