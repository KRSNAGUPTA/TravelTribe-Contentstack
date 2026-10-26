/**
 * Booking controller — hold-first flow.
 *
 * Responsibilities:
 *   - holdBooking    : create a `pending` booking that reserves inventory
 *   - getAvailability: read-only calendar for the frontend
 *   - cancelBooking  : user-initiated cancellation
 *   - getUserBookings, getAllBookings, getBookingById, generateReceipt
 *
 * NOT responsible for:
 *   - Confirming bookings (that's paymentController.verifyPayment)
 *   - Expiring holds (that's jobs/expireHolds.js)
 *   - Computing availability (that's services/availability.js)
 */

import mongoose from "mongoose";
import Booking, { BOOKING_STATUS } from "../models/BookingModel.js";
import Hostel from "../models/HostelModel.js";
import {
  buildCalendar,
  minAvailableForStay,
  computePrice,
} from "../services/availability.js";
import { toUTCDate, eachNight } from "../utils/date.js";
import cmsClient from "../contentstackClient.js";
import logger from "../utils/logger.js";
import { bookingHoldsTotal } from "../utils/metrics.js";

const HOLD_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_NIGHTS = 90;

// for syncing with cms
const ensureHostelInDb = async (hostelId) => {
  let hostel = await Hostel.findOne({ hostelId });
  if (hostel) return hostel;

  const env = process.env.CS_DEV_ENV || process.env.CS_ENVIRONMENT || "dev";
  const cmsRes = await cmsClient.get(
    `/content_types/hostel/entries/${hostelId}?environment=${env}`,
  );
  const entry = cmsRes.data?.entry;
  if (!entry) {
    throw Object.assign(new Error("Hostel not found in CMS"), { status: 404 });
  }

  const roomTypes = (entry.room_types || []).map((room) => {
    const rupees = Number(room.base_price);

    if (!Number.isFinite(rupees) || rupees <= 0) {
      throw Object.assign(
        new Error(
          `Room "${room.room_key}" is missing a valid base_price (in rupees) in CMS`,
        ),
        { status: 400 },
      );
    }

    const paise = Math.round(rupees * 100);

    return {
      room_key: String(room.room_key).trim(),
      room_name: String(room.room_name || room.room_key).trim(),
      total_beds: Number(room.total_beds) > 0 ? Number(room.total_beds) : 1,
      price_per_night: paise,
    };
  });

  if (roomTypes.length === 0) {
    throw Object.assign(new Error("Hostel has no room types in CMS"), {
      status: 400,
    });
  }

  try {
    hostel = await Hostel.create({
      hostelId: String(hostelId).trim(),
      reviews: [],
      room_types: roomTypes,
    });
  } catch (e) {
    if (e?.code === 11000) {
      hostel = await Hostel.findOne({ hostelId });
      if (hostel) return hostel;
    }
    throw e;
  }
  return hostel;
};

// GET /api/booking/availability
export const getAvailability = async (req, res) => {
  try {
    const hostelId = req.query.hostelId;
    const roomKey = req.query.roomSelection || req.query.room_key || null;
    const checkIn = req.query.checkIn;
    const checkOut = req.query.checkOut;

    if (!hostelId || !checkIn || !checkOut) {
      return res
        .status(400)
        .json({ message: "hostelId, checkIn and checkOut are required" });
    }

    let start, end;
    try {
      start = toUTCDate(checkIn);
      end = toUTCDate(checkOut);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    const nights = eachNight(start, end).length;
    if (nights < 1) {
      return res
        .status(400)
        .json({ message: "checkOut must be after checkIn" });
    }
    if (nights > MAX_NIGHTS) {
      return res
        .status(400)
        .json({ message: `Date range too large. Max ${MAX_NIGHTS} nights.` });
    }

    const hostel = await ensureHostelInDb(String(hostelId).trim());
    const payload = await buildCalendar(hostel, roomKey, start, end);

    return res.status(200).json(payload);
  } catch (error) {
    logger.error({ err: error }, "getAvailability failed");
    return res
      .status(error.status || 500)
      .json({ message: error.status ? error.message : "Internal error" });
  }
};

//  POST /api/booking/hold
/**
 * Create a `pending` booking that reserves inventory for 15 minutes.
 * Body: { hostelId, roomSelection, checkIn, checkOut,
 *         guest: { name, email, phone, gender }, idempotencyKey }
 * Response: { booking, holdExpiresAt, amount }
 */
export const holdBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      hostelId,
      roomSelection,
      checkIn,
      checkOut,
      guest,
      idempotencyKey,
    } = req.body || {};

    if (!hostelId || !roomSelection || !checkIn || !checkOut || !idempotencyKey) {
      await session.endSession();
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (
      !guest ||
      !guest.name ||
      !guest.email ||
      !guest.phone ||
      !guest.gender
    ) {
      await session.endSession();
      return res.status(400).json({ message: "Guest details are required" });
    }

    const normalizedGender = String(guest.gender).toLowerCase().trim();
    if (!["male", "female", "other"].includes(normalizedGender)) {
      await session.endSession();
      return res.status(400).json({ message: "Invalid gender value" });
    }

    if (!req.user) {
      await session.endSession();
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Idempotency: return existing hold if same key
    const existing = await Booking.findOne({
      user: req.user._id,
      idempotencyKey: String(idempotencyKey).trim(),
    });
    if (existing) {
      await session.endSession();
      return res.status(200).json({
        booking: existing,
        holdExpiresAt: existing.holdExpiresAt,
        amount: existing.amount,
      });
    }

    let start, end;
    try {
      start = toUTCDate(checkIn);
      end = toUTCDate(checkOut);
    } catch (e) {
      await session.endSession();
      return res.status(400).json({ message: e.message });
    }

    const today = toUTCDate(new Date().toISOString().slice(0, 10));
    if (start < today) {
      await session.endSession();
      return res.status(400).json({ message: "checkIn cannot be in the past" });
    }

    const nights = eachNight(start, end).length;
    if (nights < 1 || nights > MAX_NIGHTS) {
      await session.endSession();
      return res
        .status(400)
        .json({ message: `Stay must be between 1 and ${MAX_NIGHTS} nights` });
    }

    const hostel = await ensureHostelInDb(String(hostelId).trim());
    const roomKey = String(roomSelection).trim();
    const { amount, price_per_night } = computePrice(
      hostel,
      roomKey,
      start,
      end
    );

    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });

    const payload = await buildCalendar(hostel, roomKey, start, end, session);
    const minAvailable = minAvailableForStay(payload.calendar, roomKey);

    if (minAvailable < 1) {
      await session.abortTransaction();
      await session.endSession();
      bookingHoldsTotal.inc({ result: "no_availability" });
      return res.status(409).json({
        message: "No availability for the selected room and dates",
        calendar: payload.calendar,
      });
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_TTL_MS);

    const [newBooking] = await Booking.create(
      [
        {
          user: req.user._id,
          hostelId: String(hostelId).trim(),
          roomSelection: roomKey,
          checkInDate: start,
          checkOutDate: end,
          nights,
          price_per_night_snapshot: price_per_night,
          amount,
          currency: "INR",
          guest: {
            name: String(guest.name).trim(),
            email: String(guest.email).toLowerCase().trim(),
            phone: String(guest.phone).trim(),
            gender: normalizedGender,
          },
          status: BOOKING_STATUS.PENDING,
          holdExpiresAt,
          statusHistory: [
            {
              from: null,
              to: BOOKING_STATUS.PENDING,
              at: new Date(),
              by: req.user._id,
              reason: "hold_created",
            },
          ],
          idempotencyKey: String(idempotencyKey).trim(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    bookingHoldsTotal.inc({ result: "success" });

    return res.status(201).json({
      booking: newBooking,
      holdExpiresAt: newBooking.holdExpiresAt,
      amount: newBooking.amount,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    await session.endSession();

    if (error?.code === 11000) {
      // Race: two concurrent requests with same idempotencyKey.
      // One won, the other hit the unique index. Return the existing one.
      try {
        const existing = await Booking.findOne({
          user: req.user._id,
          idempotencyKey: String(req.body?.idempotencyKey || "").trim(),
        });
        if (existing) {
          return res.status(200).json({
            booking: existing,
            holdExpiresAt: existing.holdExpiresAt,
            amount: existing.amount,
          });
        }
      } catch {
        // fall through to 409
      }
      bookingHoldsTotal.inc({ result: "conflict" });
      return res.status(409).json({ message: "Duplicate idempotency key" });
    }
    if (error?.codeName === "WriteConflict" || error?.code === 112) {
      bookingHoldsTotal.inc({ result: "conflict" });
      return res
        .status(409)
        .json({ message: "Booking conflict, please retry" });
    }
    logger.error({ err: error }, "holdBooking failed");
    bookingHoldsTotal.inc({ result: "error" });
    return res
      .status(error.status || 500)
      .json({ message: error.status ? error.message : "Internal error" });
  }
};

//PUT /api/booking/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }
    if (booking.status === BOOKING_STATUS.EXPIRED) {
      return res.status(400).json({ message: "Booking has already expired" });
    }

    booking.transitionTo(BOOKING_STATUS.CANCELLED, {
      by: req.user._id,
      reason: req.body?.reason || "user_cancelled",
    });
    await booking.save();

    return res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    logger.error({ err: error }, "cancelBooking failed");
    return res
      .status(error.status || 500)
      .json({ message: error.status ? error.message : "Internal error" });
  }
};

// Read endpoints
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(bookings);
  } catch (error) {
    logger.error({ err: error }, "getUserBookings failed");
    return res.status(500).json({ message: "Internal error" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const [bookings, total] = await Promise.all([
      Booking.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(),
    ]);
    return res.status(200).json({
      bookings,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error({ err: error }, "getAllBookings failed");
    return res.status(500).json({ message: "Internal error" });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    return res.status(200).json(booking);
  } catch (error) {
    logger.error({ err: error }, "getBookingById failed");
    return res.status(500).json({ message: "Internal error" });
  }
};

export const generateReceipt = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return res.status(400).json({ message: "Booking is not confirmed yet" });
    }

    return res.status(200).json({
      receipt: {
        bookingId: booking._id,
        receiptId: booking._id.toString().slice(-8).toUpperCase(),
        user: booking.guest.name,
        email: booking.guest.email,
        phone: booking.guest.phone,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        nights: booking.nights,
        roomSelection: booking.roomSelection,
        price_per_night: booking.price_per_night_snapshot,
        totalAmount: booking.amount,
        currency: booking.currency,
        status: booking.status,
        confirmedAt: booking.confirmedAt,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "generateReceipt failed");
    return res.status(500).json({ message: "Internal error" });
  }
};
