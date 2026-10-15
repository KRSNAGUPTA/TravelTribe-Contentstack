import Booking from "../model/BookingModel.js";
import Hostel from "../model/HostelModel.js";
import Payment from "../model/PaymentModel.js";
import mongoose from "mongoose";
import cmsClient from "../contentstackClient.js";
import { sendNotification } from "../discordBot/NotificationBot.js";
import { sendBookingConfirmationEmail } from "../services/emailService.js";

const ACTIVE_STATUSES = ["pending", "confirmed"];

const toUTCDate = (input) => {
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const eachNight = (checkIn, checkOut) => {
  const nights = [];
  const cur = toUTCDate(checkIn);
  const end = toUTCDate(checkOut);
  if (!cur || !end || cur >= end) return nights;
  while (cur < end) {
    nights.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return nights;
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const ensureHostelInDb = async (hostelId) => {
  let hostel = await Hostel.findOne({ hostelId });
  if (hostel) return hostel;

  const env = process.env.CS_DEV_ENV || process.env.CS_ENVIRONMENT || "dev";
  const cmsRes = await cmsClient.get(
    `/content_types/hostel/entries/${hostelId}?environment=${env}`
  );
  const entry = cmsRes.data?.entry;
  if (!entry) {
    const err = new Error("Hostel not found in CMS");
    err.status = 404;
    throw err;
  }

  const roomTypes = (entry.room_types || []).map((room) => {
    const total = Number(room.total_beds) > 0 ? Number(room.total_beds) : 10;
    return {
      room_key: String(room.room_key).trim(),
      room_name: String(room.room_name || room.room_key).trim(),
      total_beds: total,
    };
  });

  if (roomTypes.length === 0) {
    const err = new Error("Hostel has no room types in CMS");
    err.status = 400;
    throw err;
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

const buildCalendar = async (
  hostel,
  checkIn,
  checkOut,
  roomFilter = null,
  session = null
) => {
  const nights = eachNight(checkIn, checkOut);
  const rangeStart = nights[0];
  const rangeEnd = toUTCDate(checkOut);

  let roomTypes = hostel.room_types;
  if (roomFilter) {
    roomTypes = roomTypes.filter((r) => r.room_key === roomFilter);
    if (roomTypes.length === 0) {
      const err = new Error(`Room type "${roomFilter}" not found`);
      err.status = 400;
      throw err;
    }
  }

  const roomKeys = roomTypes.map((r) => r.room_key);
  const totals = {};
  roomTypes.forEach((r) => {
    totals[r.room_key] = r.total_beds;
  });

  const booked = {};
  nights.forEach((n) => {
    const key = formatDateKey(n);
    booked[key] = {};
    roomKeys.forEach((rk) => {
      booked[key][rk] = 0;
    });
  });

  if (nights.length > 0) {
    let query = Booking.find({
      hostelId: hostel.hostelId,
      roomSelection: { $in: roomKeys },
      status: { $in: ACTIVE_STATUSES },
      checkInDate: { $lt: rangeEnd },
      checkOutDate: { $gt: rangeStart },
    }).select("checkInDate checkOutDate roomSelection");

    if (session) {
      query = query.session(session);
    }

    const overlapping = await query;

    for (const b of overlapping) {
      const rk = b.roomSelection;
      if (!roomKeys.includes(rk)) continue;
      for (const n of eachNight(b.checkInDate, b.checkOutDate)) {
        const key = formatDateKey(n);
        if (booked[key] && rk in booked[key]) {
          booked[key][rk] += 1;
        }
      }
    }
  }

  const calendar = nights.map((n) => {
    const date = formatDateKey(n);
    const rooms = {};
    for (const rk of roomKeys) {
      const totalBeds = totals[rk];
      const count = booked[date][rk] || 0;
      rooms[rk] = {
        totalBeds,
        booked: count,
        available: Math.max(0, totalBeds - count),
      };
    }
    return { date, rooms };
  });

  const roomsMeta = roomTypes.map((r) => ({
    room_key: r.room_key,
    room_name: r.room_name,
    totalBeds: r.total_beds,
  }));

  return {
    hostelId: hostel.hostelId,
    checkIn: formatDateKey(toUTCDate(checkIn)),
    checkOut: formatDateKey(toUTCDate(checkOut)),
    nights: nights.length,
    rooms: roomsMeta,
    calendar,
  };
};

const minAvailableForStay = (calendar, roomKey) => {
  if (!calendar.length) return 0;
  return Math.min(
    ...calendar.map((day) => day.rooms[roomKey]?.available ?? 0)
  );
};

export const getAvailability = async (req, res) => {
  try {
    const hostelId = req.query.hostelId || req.params.hostelId;
    const roomSelection = req.query.roomSelection || req.query.room_key || null;
    const checkIn = req.query.checkIn || req.query.from;
    const checkOut = req.query.checkOut || req.query.to;

    if (!hostelId || !checkIn || !checkOut) {
      return res.status(400).json({
        message: "hostelId, checkIn and checkOut are required",
      });
    }

    const start = toUTCDate(checkIn);
    const end = toUTCDate(checkOut);
    if (!start || !end || start >= end) {
      return res.status(400).json({
        message: "checkOut must be after checkIn (valid dates required)",
      });
    }

    const maxNights = 90;
    const nights = eachNight(start, end);
    if (nights.length > maxNights) {
      return res.status(400).json({
        message: `Date range too large. Max ${maxNights} nights.`,
      });
    }

    const hostel = await ensureHostelInDb(String(hostelId).trim());
    const payload = await buildCalendar(
      hostel,
      start,
      end,
      roomSelection ? String(roomSelection).trim() : null
    );

    return res.status(200).json(payload);
  } catch (error) {
    console.error("getAvailability error:", error.message);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      checkIn,
      checkOut,
      hostelId,
      roomSelection,
      name,
      email,
      phone,
      gender,
      amount,
      receiptId,
      paymentId,
    } = req.body || {};

    if (
      !checkIn ||
      !checkOut ||
      !hostelId ||
      !roomSelection ||
      amount === undefined ||
      amount === null ||
      !name ||
      !email ||
      !phone ||
      !gender ||
      !receiptId ||
      !paymentId
    ) {
      await session.endSession();
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.user) {
      await session.endSession();
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      await session.endSession();
      return res.status(400).json({ message: "Invalid paymentId format" });
    }

    const normalizedGender = String(gender).toLowerCase().trim();
    if (!["male", "female", "other"].includes(normalizedGender)) {
      await session.endSession();
      return res.status(400).json({
        message: "Invalid gender value. Allowed values are male, female, or other.",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      await session.endSession();
      return res.status(400).json({ message: "Invalid booking amount." });
    }

    const start = toUTCDate(checkIn);
    const end = toUTCDate(checkOut);
    if (!start || !end || start >= end) {
      await session.endSession();
      return res.status(400).json({
        message: "checkOut must be after checkIn (valid dates required)",
      });
    }

    const today = toUTCDate(new Date());
    if (start < today) {
      await session.endSession();
      return res.status(400).json({ message: "checkIn cannot be in the past" });
    }

    await ensureHostelInDb(String(hostelId).trim());

    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });

    const payment = await Payment.findById(paymentId).session(session);

    if (!payment) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(403).json({
        message: "This payment does not belong to you",
      });
    }

    if (payment.status !== "verified") {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        message: "Payment has not been verified",
      });
    }

    if (payment.used) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(409).json({
        message: "This payment has already been used for another booking",
      });
    }

    if (payment.hostelId !== String(hostelId).trim()) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        message: "Payment was not created for this hostel",
      });
    }

    const paymentAmountRupees = payment.amount / 100;
    if (Math.round(paymentAmountRupees) !== Math.round(numericAmount)) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        message: `Payment amount (₹${paymentAmountRupees}) does not match booking amount (₹${numericAmount})`,
      });
    }

    const freshHostel = await Hostel.findOne({
      hostelId: String(hostelId).trim(),
    }).session(session);

    if (!freshHostel) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ message: "Hostel not found" });
    }

    const roomKey = String(roomSelection).trim();

    const payload = await buildCalendar(freshHostel, start, end, roomKey, session);
    const minAvailable = minAvailableForStay(payload.calendar, roomKey);

    if (minAvailable < 1) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        message: "No availability for the selected room and dates",
        calendar: payload.calendar,
      });
    }

    const existingReceipt = await Booking.findOne({
      receiptId: String(receiptId).trim(),
    }).session(session);

    if (existingReceipt) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(409).json({
        message: "Booking with this receiptId already exists",
        booking: existingReceipt,
      });
    }

    const newBooking = new Booking({
      user: req.user._id,
      checkInDate: start,
      checkOutDate: end,
      roomSelection: roomKey,
      hostelId: String(hostelId).trim(),
      amount: numericAmount,
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: String(phone).trim(),
      gender: normalizedGender,
      receiptId: String(receiptId).trim(),
      payment: payment._id,
      status: "confirmed",
    });

    await newBooking.save({ session });

    payment.used = true;
    payment.booking = newBooking._id;
    await payment.save({ session });

    await session.commitTransaction();
    await session.endSession();

    sendBookingConfirmationEmail(newBooking).catch((err) =>
      console.error("Booking email failed:", err.message)
    );

    setImmediate(() => {
      sendNotification("booking", newBooking).catch((err) =>
        console.error("Discord notify failed:", err.message)
      );
    });

    const after = await buildCalendar(freshHostel, start, end, roomKey);

    return res.status(201).json({
      booking: newBooking,
      calendar: after.calendar,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();

    if (error?.code === 11000) {
      return res.status(409).json({ message: "Duplicate receiptId" });
    }

    if (error?.codeName === "WriteConflict" || error?.code === 112) {
      return res.status(409).json({
        message: "Booking conflict detected. Please try again.",
      });
    }

    console.error("Error creating booking:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const bookings = await Booking.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    return res.status(200).json(booking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }
    booking.status = "cancelled";
    await booking.save();
    return res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot confirm a cancelled booking",
      });
    }
    booking.status = "confirmed";
    await booking.save();
    return res.status(200).json({ message: "Booking confirmed", booking });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const generateReceipt = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking is not confirmed yet" });
    }
    return res.status(200).json({
      message: "Receipt Generated Successfully",
      receipt: {
        bookingId: booking._id,
        receiptId: booking.receiptId,
        user: booking.name,
        email: booking.email,
        phone: booking.phone,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        roomSelection: booking.roomSelection,
        totalAmount: booking.amount,
        transactionId: booking.receiptId,
        status: booking.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};