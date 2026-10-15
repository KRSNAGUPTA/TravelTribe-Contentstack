import mongoose from "mongoose";

const hostelSchema = new mongoose.Schema(
  {
    hostelId: {
      type: String,
      required: true,
      unique: true,
    },

    reviews: [    
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        comment: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        img: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Backend-managed inventory
    room_types: [
      {
        room_key: {
          type: String,
          required: true, // SINGLE / DOUBLE / DORM
        },
        room_name: {
          type: String,
          required: true, 
        },
        total_beds: { // for only one time
          type: Number,
          required: true,
        },
        available_beds: { // updated via booking logic 
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate room types per hostel
hostelSchema.index(
  { hostelId: 1, "room_types.room_key": 1 },
  { unique: true }
);

export default mongoose.model("Hostel", hostelSchema);