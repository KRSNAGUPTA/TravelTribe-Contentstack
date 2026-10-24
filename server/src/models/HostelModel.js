import mongoose from "mongoose";

const roomTypeSchema = new mongoose.Schema(
  {
    room_key: { type: String, required: true, trim: true },
    room_name: { type: String, required: true, trim: true },
    total_beds: { type: Number, required: true, min: 1, immutable: true },
    price_per_night: { type: Number, required: true, min: 0 },            // paise
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    name:    { type: String, required: true },
    img:     { type: String, default: null },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 5, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const hostelSchema = new mongoose.Schema(
  {
    hostelId: { type: String, required: true, unique: true, trim: true },
    reviews:    { type: [reviewSchema], default: [] },
    room_types: { type: [roomTypeSchema], default: [] },
  },
  { timestamps: true }
);

// One row per (hostel, room_key) — prevents duplicate room types
hostelSchema.index(
  { hostelId: 1, "room_types.room_key": 1 },
  { unique: true, partialFilterExpression: { "room_types.room_key": { $exists: true } } }
);

// One review per (hostel, user) — DB-enforced, race-safe
hostelSchema.index(
  { hostelId: 1, "reviews.user": 1 },
  { unique: true, partialFilterExpression: { "reviews.user": { $exists: true } } }
);

export default mongoose.model("Hostel", hostelSchema);