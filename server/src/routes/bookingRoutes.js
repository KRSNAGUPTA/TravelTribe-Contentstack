import express from "express";
import {
  holdBooking,
  getAvailability,
  cancelBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
  generateReceipt,
} from "../controllers/bookingController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/availability", getAvailability);

// User (auth required)
router.post("/hold", protect, holdBooking);
router.get("/my-bookings", protect, getUserBookings);
router.put("/:id/cancel", protect, cancelBooking);
router.get("/:id/receipt", protect, generateReceipt);
router.get("/:id", protect, getBookingById);

// Admin
router.get("/", protect, adminOnly, getAllBookings);

export default router;