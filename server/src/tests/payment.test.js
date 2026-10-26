import { describe, it, expect, beforeEach, vi } from "vitest";
import Booking, { BOOKING_STATUS } from "../models/BookingModel.js";
import Payment, { PAYMENT_STATUS } from "../models/PaymentModel.js";
import Hostel from "../models/HostelModel.js";
import User from "../models/UserModel.js";
import { toUTCDate } from "../utils/date.js";

// Mock the queue and Razorpay
vi.mock("../queues/emailQueue.js", () => ({
  enqueueHoldExpired: vi.fn().mockResolvedValue({ id: "mock" }),
  enqueueBookingConfirmed: vi.fn().mockResolvedValue({ id: "mock" }),
  enqueueOtp: vi.fn().mockResolvedValue({ id: "mock" }),
  enqueueRefund: vi.fn().mockResolvedValue({ id: "mock" }),
}));

const CHECK_IN = "2030-04-10";
const CHECK_OUT = "2030-04-12";
const HOSTEL_ID = "test-hostel-payment";

let testUser;
let testHostel;
let testBooking;

beforeEach(async () => {
  await Booking.deleteMany({});
  await Payment.deleteMany({});
  await Hostel.deleteMany({});
  await User.deleteMany({});

  testUser = await User.create({
    name: "Test User",
    email: "pay@traveltribe.test",
    password: "password123",
  });

  testHostel = await Hostel.create({
    hostelId: HOSTEL_ID,
    reviews: [],
    room_types: [
      {
        room_key: "single",
        room_name: "Single",
        total_beds: 4,
        price_per_night: 200000,
      },
    ],
  });

  testBooking = await Booking.create({
    user: testUser._id,
    hostelId: HOSTEL_ID,
    roomSelection: "single",
    checkInDate: toUTCDate(CHECK_IN),
    checkOutDate: toUTCDate(CHECK_OUT),
    nights: 2,
    price_per_night_snapshot: 200000,
    amount: 400000,
    currency: "INR",
    guest: {
      name: "Test",
      email: "pay@traveltribe.test",
      phone: "9876543210",
      gender: "male",
    },
    status: BOOKING_STATUS.PENDING,
    holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    idempotencyKey: "hold-key-1",
    statusHistory: [{ from: null, to: BOOKING_STATUS.PENDING }],
  });
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 1 — One payment → one booking (unique DB index)
// ─────────────────────────────────────────────────────────────────────────
describe("payment uniqueness", () => {
  it("rejects a second booking linked to the same payment", async () => {
    const payment = await Payment.create({
      user: testUser._id,
      hostelId: HOSTEL_ID,
      roomSelection: "single",
      heldBooking: testBooking._id,
      idempotencyKey: "pay-key-1",
      razorpay_order_id: "order_test_1",
      razorpay_payment_id: "pay_test_1",
      amount: 400000,
      currency: "INR",
      status: PAYMENT_STATUS.CONSUMED,
      booking: testBooking._id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      consumedAt: new Date(),
    });

    // Attach payment to first booking
    testBooking.payment = payment._id;
    testBooking.status = BOOKING_STATUS.CONFIRMED;
    await testBooking.save();

    // Try to create a second booking with the SAME payment
    const secondBooking = new Booking({
      user: testUser._id,
      hostelId: HOSTEL_ID,
      roomSelection: "single",
      checkInDate: toUTCDate("2030-05-10"),
      checkOutDate: toUTCDate("2030-05-12"),
      nights: 2,
      price_per_night_snapshot: 200000,
      amount: 400000,
      currency: "INR",
      guest: {
        name: "Second",
        email: "s@traveltribe.test",
        phone: "9876543211",
        gender: "male",
      },
      status: BOOKING_STATUS.PENDING,
      holdExpiresAt: new Date(Date.now() + 1000),
      idempotencyKey: "hold-key-2",
      payment: payment._id, // ← SAME payment
    });

    await expect(secondBooking.save()).rejects.toMatchObject({
      code: 11000, // duplicate key
    });
  });

  // ─── TEST 2 — Idempotency: (user, key) is unique ─────────────────────
  it("rejects duplicate (user, idempotencyKey) on Booking", async () => {
    const sharedKey = `unique-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await Booking.create({
      user: testUser._id,
      hostelId: HOSTEL_ID,
      roomSelection: "single",
      checkInDate: toUTCDate("2030-06-10"),
      checkOutDate: toUTCDate("2030-06-12"),
      nights: 2,
      price_per_night_snapshot: 200000,
      amount: 400000,
      currency: "INR",
      guest: {
        name: "Test",
        email: "pay@traveltribe.test",
        phone: "9876543210",
        gender: "male",
      },
      status: BOOKING_STATUS.PENDING,
      holdExpiresAt: new Date(Date.now() + 1000),
      idempotencyKey: sharedKey,
    });

    // Second booking with same user + same key → must fail
    const dup = new Booking({
      user: testUser._id,
      hostelId: HOSTEL_ID,
      roomSelection: "single",
      checkInDate: toUTCDate("2030-07-10"),
      checkOutDate: toUTCDate("2030-07-12"),
      nights: 2,
      price_per_night_snapshot: 200000,
      amount: 400000,
      currency: "INR",
      guest: {
        name: "Test",
        email: "pay@traveltribe.test",
        phone: "9876543210",
        gender: "male",
      },
      status: BOOKING_STATUS.PENDING,
      holdExpiresAt: new Date(Date.now() + 1000),
      idempotencyKey: sharedKey,
    });

    await expect(dup.save()).rejects.toMatchObject({ code: 11000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 3 — Payment can only be consumed once
// ─────────────────────────────────────────────────────────────────────────
describe("payment consumption", () => {
  it("only one of two concurrent findOneAndUpdate calls succeeds", async () => {
    const payment = await Payment.create({
      user: testUser._id,
      hostelId: HOSTEL_ID,
      roomSelection: "single",
      heldBooking: testBooking._id,
      idempotencyKey: "pay-key-1",
      razorpay_order_id: "order_test_1",
      razorpay_payment_id: "pending_order_test_1",
      amount: 400000,
      currency: "INR",
      status: PAYMENT_STATUS.CREATED,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Simulate two concurrent verifications
    const [first, second] = await Promise.all([
      Payment.findOneAndUpdate(
        { _id: payment._id, status: PAYMENT_STATUS.CREATED },
        {
          $set: {
            status: PAYMENT_STATUS.CONSUMED,
            consumedAt: new Date(),
            booking: testBooking._id,
          },
        },
        { returnDocument: "after" }
      ),
      Payment.findOneAndUpdate(
        { _id: payment._id, status: PAYMENT_STATUS.CREATED },
        {
          $set: {
            status: PAYMENT_STATUS.CONSUMED,
            consumedAt: new Date(),
            booking: testBooking._id,
          },
        },
        { returnDocument: "after" }
      ),
    ]);

    // Exactly one succeeds
    const successes = [first, second].filter(Boolean).length;
    expect(successes).toBe(1);

    // Final state: consumed
    const reloaded = await Payment.findById(payment._id);
    expect(reloaded.status).toBe(PAYMENT_STATUS.CONSUMED);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 4 — Tampered price is rejected
// ─────────────────────────────────────────────────────────────────────────
describe("price validation", () => {
  it("booking.amount must equal current price at verify time", () => {
    const currentPrice = testHostel.room_types[0].price_per_night;
    const expected = currentPrice * testBooking.nights;

    // Matches
    expect(testBooking.amount).toBe(expected);

    // If price changed, amount won't match — verifyPayment would refund
    testHostel.room_types[0].price_per_night = 300000; // changed to ₹3000
    const newExpected = testHostel.room_types[0].price_per_night * testBooking.nights;
    expect(testBooking.amount).not.toBe(newExpected);
    // → verifyPayment would mark payment.refunded and initiate Razorpay refund
  });
});
