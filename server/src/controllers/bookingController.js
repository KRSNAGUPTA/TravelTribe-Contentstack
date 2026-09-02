import axios from "axios";
import { sendNotification } from "../discordBot/NotificationBot.js";
import Booking from "../model/BookingModel.js";
import Hostel from "../model/HostelModel.js";
import cmsClient from "../contentstackClient.js";
import { sendBookingConfirmationEmail } from "../services/emailService.js";

const formatDate = (input) => {
  if (!input) return "";
  const date = new Date(input);
  if (isNaN(date.getTime())) return "";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

export const createBooking = async (req, res) => {
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
      receiptId
    } = req.body;

    if (
      !checkIn || !checkOut || !hostelId || !roomSelection || !amount ||
      !name || !email || !phone || !gender || !receiptId
    ) {
      console.error("Incomplete details while Creating Booking.");
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find or initialize Hostel document in MongoDB from Contentstack CMS
    let hostel = await Hostel.findOne({ hostelId: hostelId });
    if (!hostel) {
      try {
        const env = process.env.CS_DEV_ENV || "dev";
        const cmsRes = await cmsClient.get(
          `/content_types/hostel/entries/${hostelId}?environment=${env}`
        );
        const cmsEntry = cmsRes.data.entry;
        if (cmsEntry) {
          const roomTypes = (cmsEntry.room_types || []).map((room) => ({
            room_key: room.room_key,
            room_name: room.room_name,
            total_beds: room.total_beds || 10,
            available_beds: room.total_beds || 10,
          }));
          hostel = await Hostel.create({
            hostelId,
            reviews: [],
            room_types: roomTypes,
          });
        }
      } catch (err) {
        console.error("Could not auto-create Hostel in DB from CMS:", err.message);
      }
    }

    let roomType = hostel?.room_types?.find(room => room.room_key === roomSelection);

    if (roomType && roomType.available_beds <= 0) {
      return res.status(400).json({ message: "No available rooms for this type" });
    }

    const newBooking = new Booking({
      user: req.user._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      roomSelection,
      hostelId,
      amount,
      name,
      email,
      phone,
      gender,
      receiptId,
      status: "confirmed",
    });

    await newBooking.save();

    // Decrement room inventory in MongoDB if hostel document exists
    if (roomType && hostel) {
      roomType.available_beds = Math.max(0, roomType.available_beds - 1);
      await hostel.save();
    }

    // Send confirmation email via Nodemailer SMTP
    sendBookingConfirmationEmail(newBooking);

    // Discord notification
    try {
      await sendNotification("booking", newBooking);
    } catch (discErr) {
      // Silently ignore discord errors
    }

    return res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const bookings = await Booking.find({ user: req.user._id });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    const hostel = await Hostel.findOne({ hostelId: booking.hostelId });
    if (hostel) {
      const roomType = hostel.room_types?.find(room => room.room_key === booking.roomSelection);
      if (roomType) {
        roomType.available_beds += 1;
        await hostel.save();
      }
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
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "confirmed";
    await booking.save();
    res.status(200).json({ message: "Booking confirmed", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateReceipt = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking is not confirmed yet" });
    }

    res.status(200).json({
      message: "Receipt Generated Successfully",
      receipt: {
        bookingId: booking._id,
        user: booking.name,
        email: booking.email,
        phone: booking.phone,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        roomSelection: booking.roomSelection,
        totalAmount: booking.amount,
        transactionId: booking.transactionId,
        status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
