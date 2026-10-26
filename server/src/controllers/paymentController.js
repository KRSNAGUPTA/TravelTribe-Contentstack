/**
 * Payment controller — Razorpay integration with server-authoritative pricing.
 *
 * Responsibilities:
 *   - createOrder   : create Razorpay order for a held booking
 *   - verifyPayment : verify signature, confirm booking atomically,
 *                     refund if availability/price changed
 *
 * NEVER trusts:
 *   - amount from client (uses booking.amount)
 *   - bookingId from client (uses payment.heldBooking)
 *   - price from client (uses Hostel.room_types[].price_per_night)
 */

import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import config from "../config/razorpayConfig.js";
import Booking, { BOOKING_STATUS } from "../models/BookingModel.js";
import Payment, { PAYMENT_STATUS } from "../models/PaymentModel.js";
import Hostel from "../models/HostelModel.js";
import {
  buildCalendar,
  minAvailableForStay,
} from "../services/availability.js";
import {
  enqueueBookingConfirmed,
  enqueueRefund,
} from "../queues/emailQueue.js";
import { sendNotification } from "../discordBot/NotificationBot.js";
import logger from "../utils/logger.js";
import {paymentVerifiedTotal} from "../utils/metrics.js"

const PAYMENT_TTL_MS = 15 * 60 * 1000;

const getRazorpay = () => {
  const key_id = config.getKeyId();
  const key_secret = config.getKeySecret();
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
};

// POST /api/payment/create-order
/**
 * Body: { bookingId, idempotencyKey }
 * The client NEVER sends amount — server reads it from the held booking.
 */
export const createOrder = async (req, res) => {
  try {
    const { bookingId, idempotencyKey } = req.body || {};

    if (!bookingId || !idempotencyKey) {
      return res
        .status(400)
        .json({ message: "bookingId and idempotencyKey are required" });
    }
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId format" });
    }

    // Idempotency: return existing order
    const existingPayment = await Payment.findOne({
      user: req.user._id,
      idempotencyKey: String(idempotencyKey).trim(),
    });
    if (existingPayment) {
      if (existingPayment.status === PAYMENT_STATUS.CREATED) {
        return res.status(200).json({
          orderId: existingPayment.razorpay_order_id,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          keyId: config.getKeyId(),
        });
      }
      return res.status(409).json({
        message: `Payment with this idempotency key already exists in status "${existingPayment.status}"`,
      });
    }

    // Load booking, validate
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "This booking does not belong to you" });
    }
    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        message: `Booking is not pending (status: ${booking.status})`,
      });
    }
    if (booking.holdExpiresAt <= new Date()) {
      return res.status(400).json({
        message: "Booking hold has expired, please start a new booking",
      });
    }

    // Create Razorpay order with SERVER amount
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res
        .status(500)
        .json({ message: "Payment gateway not configured" });
    }

    const receipt = `B${booking._id.toString().slice(-12)}`.toUpperCase();

    let order;
    try {
      order = await razorpay.orders.create({
        amount: booking.amount, // paise, from booking (server-set)
        currency: booking.currency,
        receipt,
        notes: {
          bookingId: booking._id.toString(),
          userId: req.user._id.toString(),
        },
      });
    } catch (err) {
      logger.error({ err }, "Razorpay order creation failed");
      return res
        .status(502)
        .json({ message: "Payment gateway error, please retry" });
    }

    // Persist Payment
    // Note: razorpay_payment_id isn't known yet. Use a deterministic
    // placeholder; the unique index on it means no two payments collide.
    const placeholderPaymentId = `pending_${order.id}`;

    const payment = await Payment.create({
      user: req.user._id,
      hostelId: booking.hostelId,
      roomSelection: booking.roomSelection,
      heldBooking: booking._id,
      idempotencyKey: String(idempotencyKey).trim(),
      razorpay_order_id: order.id,
      razorpay_payment_id: placeholderPaymentId,
      amount: booking.amount,
      currency: booking.currency,
      status: PAYMENT_STATUS.CREATED,
      expiresAt: new Date(Date.now() + PAYMENT_TTL_MS),
    });

    return res.status(200).json({
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      keyId: config.getKeyId(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Duplicate order, please retry" });
    }
    logger.error({ err: error }, "createOrder failed");
    return res.status(500).json({ message: "Internal error" });
  }
};

// POST /api/payment/verify-payment
/**
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Steps:
 *   1. Verify HMAC signature
 *   2. Load payment + held booking
 *   3. If booking expired → refund, 409
 *   4. Re-check availability + price
 *   5. Atomic txn: payment → consumed, booking → confirmed
 *   6. Enqueue confirmation email
 */
export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await session.endSession();
      return res.status(400).json({
        message:
          "razorpay_order_id, razorpay_payment_id, razorpay_signature are required",
      });
    }
    if (!req.user) {
      await session.endSession();
      return res.status(401).json({ message: "Unauthorized" });
    }

    const key_secret = config.getKeySecret();
    if (!key_secret) {
      await session.endSession();
      return res
        .status(500)
        .json({ message: "Payment gateway not configured" });
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign)
      .digest("hex");

    const isAuthentic =
      expectedSign.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSign, "utf-8"),
        Buffer.from(razorpay_signature, "utf-8")
      );

    if (!isAuthentic) {
      await session.endSession();
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payment = await Payment.findOne({ razorpay_order_id });
    if (!payment) {
      await session.endSession();
      return res.status(404).json({ message: "Payment record not found" });
    }
    if (payment.user.toString() !== req.user._id.toString()) {
      await session.endSession();
      return res
        .status(403)
        .json({ message: "This payment does not belong to you" });
    }

    // Idempotent: already consumed → return booking
    if (payment.status === PAYMENT_STATUS.CONSUMED) {
      const booking = await Booking.findById(payment.booking);
      await session.endSession();
      return res.status(200).json({
        message: "Payment already verified",
        booking,
      });
    }

    if (
      ![PAYMENT_STATUS.CREATED, PAYMENT_STATUS.VERIFIED].includes(
        payment.status
      )
    ) {
      await session.endSession();
      return res.status(409).json({
        message: `Payment is in status "${payment.status}" and cannot be verified`,
      });
    }

    if (payment.expiresAt <= new Date()) {
      payment.status = PAYMENT_STATUS.EXPIRED;
      payment.failureReason = "razorpay_order_ttl_expired";
      await payment.save();
      await session.endSession();
      return res.status(400).json({ message: "Payment order has expired" });
    }

    const booking = await Booking.findById(payment.heldBooking);
    if (!booking) {
      await session.endSession();
      return res.status(404).json({ message: "Held booking not found" });
    }

    // Payment must match held booking's room type
    if (payment.roomSelection !== booking.roomSelection) {
      await session.endSession();
      logger.error(
        {
          paymentId: payment._id,
          bookingId: booking._id,
          paymentRoom: payment.roomSelection,
          bookingRoom: booking.roomSelection,
        },
        "Payment roomSelection mismatch"
      );
      return res
        .status(400)
        .json({ message: "Payment was not created for this room type" });
    }

    // Booking must be pending, else refund
    if (booking.status !== BOOKING_STATUS.PENDING) {
      payment.status = PAYMENT_STATUS.REFUNDED;
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      payment.verifiedAt = new Date();
      payment.refundedAt = new Date();
      payment.refundAmount = payment.amount;
      payment.failureReason = `held_booking_${booking.status}`;
      await payment.save();
      await session.endSession();

      logger.warn(
        { bookingId: booking._id, paymentId: payment._id },
        "Booking expired during payment — refund initiated"
      );

      initiateRazorpayRefund(payment).catch((err) =>
        logger.error({ err, paymentId: payment._id }, "Refund API failed")
      );

      paymentRefundsTotal.inc({ reason: "hold_expired" });
      await enqueueRefund(payment, booking);

      return res.status(409).json({
        message:
          "Your booking hold expired while you were paying. A refund has been initiated.",
        refundInitiated: true,
      });
    }

    const hostel = await Hostel.findOne({ hostelId: booking.hostelId });
    if (!hostel) {
      await session.endSession();
      return res.status(500).json({ message: "Hostel record missing" });
    }

    const room = hostel.room_types.find(
      (r) => r.room_key === booking.roomSelection
    );
    if (!room) {
      await session.endSession();
      return res.status(400).json({ message: "Room type no longer exists" });
    }

    const currentExpected = room.price_per_night * booking.nights;
    if (booking.amount !== currentExpected) {
      payment.status = PAYMENT_STATUS.REFUNDED;
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      payment.verifiedAt = new Date();
      payment.refundedAt = new Date();
      payment.refundAmount = payment.amount;
      payment.failureReason = "price_changed_after_hold";
      await payment.save();
      await session.endSession();

      initiateRazorpayRefund(payment).catch((err) =>
        logger.error({ err, paymentId: payment._id }, "Refund API failed")
      );

      paymentPriceMismatchTotal.inc();
      paymentRefundsTotal.inc({ reason: "price_changed" });
      await enqueueRefund(payment, booking);

      return res.status(409).json({
        message:
          "The room price changed while you were paying. A refund has been initiated.",
        refundInitiated: true,
      });
    }

    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });

    const calendar = await buildCalendar(
      hostel,
      booking.roomSelection,
      booking.checkInDate,
      booking.checkOutDate,
      session
    );
    const minAvailable = minAvailableForStay(
      calendar.calendar,
      booking.roomSelection
    );

    if (minAvailable < 1) {
      await session.abortTransaction();
      await session.endSession();

      payment.status = PAYMENT_STATUS.REFUNDED;
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      payment.verifiedAt = new Date();
      payment.refundedAt = new Date();
      payment.refundAmount = payment.amount;
      payment.failureReason = "no_availability_at_confirm";
      await payment.save();

      initiateRazorpayRefund(payment).catch((err) =>
        logger.error({ err, paymentId: payment._id }, "Refund API failed")
      );

      paymentRefundsTotal.inc({ reason: "no_availability" });
      await enqueueRefund(payment, booking);

      return res.status(409).json({
        message:
          "The room became unavailable while you were paying. A refund has been initiated.",
        refundInitiated: true,
      });
    }

    const consumedPayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: { $in: [PAYMENT_STATUS.CREATED, PAYMENT_STATUS.VERIFIED] },
      },
      {
        $set: {
          status: PAYMENT_STATUS.CONSUMED,
          razorpay_payment_id,
          razorpay_signature,
          booking: booking._id,
          verifiedAt: new Date(),
          consumedAt: new Date(),
        },
      },
      { returnDocument: "after", session }
    );

    if (!consumedPayment) {
      await session.abortTransaction();
      await session.endSession();
      return res
        .status(409)
        .json({ message: "Payment was already consumed by another request" });
    }

    const confirmedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: BOOKING_STATUS.PENDING },
      {
        $set: {
          status: BOOKING_STATUS.CONFIRMED,
          payment: consumedPayment._id,
          confirmedAt: new Date(),
        },
        $push: {
          statusHistory: {
            from: BOOKING_STATUS.PENDING,
            to: BOOKING_STATUS.CONFIRMED,
            at: new Date(),
            by: req.user._id,
            reason: "payment_verified",
          },
        },
      },
      { returnDocument: "after", session }
    );

    if (!confirmedBooking) {
      await session.abortTransaction();
      await session.endSession();
      logger.error(
        { paymentId: payment._id, bookingId: booking._id },
        "Payment consumed but booking confirm failed — refunding"
      );
      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: PAYMENT_STATUS.REFUNDED,
            refundedAt: new Date(),
            refundAmount: payment.amount,
            failureReason: "booking_confirm_race",
          },
        }
      );
      initiateRazorpayRefund(payment).catch(() => {});

      const refundedPayment = await Payment.findById(payment._id);
      if (refundedPayment) {
        paymentRefundsTotal.inc({ reason: "booking_race" });
        await enqueueRefund(refundedPayment, booking);
      }

      return res.status(409).json({
        message: "Booking could not be confirmed. A refund has been initiated.",
        refundInitiated: true,
      });
    }

    await session.commitTransaction();
    await session.endSession();

    paymentVerifiedTotal.inc();

    try {
      await enqueueBookingConfirmed(confirmedBooking);
    } catch (err) {
      logger.error(
        { err: err.message, bookingId: confirmedBooking._id },
        "booking confirmed but email enqueue failed"
      );
    }

    setImmediate(() =>
      sendNotification("booking", confirmedBooking).catch(() => {})
    );

    return res.status(200).json({
      message: "Payment verified and booking confirmed",
      booking: confirmedBooking,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    await session.endSession();

    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: "Payment already attached to a booking" });
    }
    if (error?.codeName === "WriteConflict" || error?.code === 112) {
      return res
        .status(409)
        .json({ message: "Conflict during confirmation, please retry" });
    }

    logger.error({ err: error }, "verifyPayment failed");
    return res.status(500).json({ message: "Internal error" });
  }
};

/**
 * Best-effort Razorpay refund. Errors are logged, not thrown.
 * For production: enqueue this and retry on failure.
 */
async function initiateRazorpayRefund(payment) {
  const razorpay = getRazorpay();
  if (!razorpay) {
    logger.error("Cannot refund: Razorpay not configured");
    return;
  }
  try {
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: payment.amount,
      speed: "normal",
    });
    await Payment.updateOne(
      { _id: payment._id },
      { $set: { refundId: refund.id } },
    );
    logger.info(
      { paymentId: payment._id, refundId: refund.id },
      "Razorpay refund initiated",
    );
  } catch (err) {
    logger.error(
      {
        err,
        paymentId: payment._id,
        razorpayPaymentId: payment.razorpay_payment_id,
      },
      "Razorpay refund failed — manual intervention required",
    );
  }
}