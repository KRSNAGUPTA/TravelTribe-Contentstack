import { Queue } from "bullmq";
import createRedisClient from "../config/redis.js";

/**
 * The `emails` queue. Producers (API controllers) push jobs here; the
 * worker in `workers/emailWorker.js` consumes them.
 *
 * Each job has `{ type, payload }`:
 *   type: "hold_expired" | "booking_confirmed" | "otp" | "refund"
 *   payload: the data the email template needs
 *
 * Retry policy: 5 attempts with exponential backoff (2s, 4s, 8s, 16s, 32s).
 * After 5 failures the job moves to the "failed" set (visible in Bull Board).
 */
const connection = createRedisClient("emailQueue-producer");

export const emailQueue = new Queue("emails", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
});


export const enqueueHoldExpired = (booking) =>

    // type, payload, key
  emailQueue.add(
    "hold_expired",
    {
      type: "hold_expired",
      bookingId: booking._id.toString(),
      guest: booking.guest,
      hostelId: booking.hostelId,
      roomSelection: booking.roomSelection,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights,
    },
    { jobId: `hold_expired-${booking._id}` } // jobId prevents duplicates
  );

export const enqueueBookingConfirmed = (booking) =>
  emailQueue.add(
    "booking_confirmed",
    {
      type: "booking_confirmed",
      bookingId: booking._id.toString(),
      receiptId: booking._id.toString().slice(-8).toUpperCase(),
      guest: booking.guest,
      hostelId: booking.hostelId,
      roomSelection: booking.roomSelection,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights,
      amount: booking.amount,
      currency: booking.currency,
    },
    { jobId: `booking_confirmed-${booking._id}` }
  );

export const enqueueOtp = (email, otp) =>
  emailQueue.add(
    "otp",
    { type: "otp", email, otp },
    { jobId: `otp-${email}-${otp}` }
  );

export const enqueueRefund = (payment, booking) =>
  emailQueue.add(
    "refund",
    {
      type: "refund",
      paymentId: payment._id.toString(),
      reason: payment.failureReason,
      amount: payment.refundAmount,
      currency: payment.currency,
      guest: booking?.guest || null,
      hostelId: payment.hostelId,
    },
    { jobId: `refund-${payment._id}` }
  );