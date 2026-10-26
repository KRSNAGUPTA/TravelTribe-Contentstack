import api from "@/api";

const uuid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
        .toString(36)
        .slice(2)}`;

export const newIdempotencyKey = uuid;

export const getAvailability = (hostelId, checkIn, checkOut, roomSelection) =>
  api.get("/api/booking/availability", {
    params: {
      hostelId,
      checkIn,
      checkOut,
      ...(roomSelection ? { roomSelection } : {}),
    },
  });

export const holdBooking = ({
  hostelId,
  roomSelection,
  checkIn,
  checkOut,
  guest,
  idempotencyKey,
}) =>
  api.post("/api/booking/hold", {
    hostelId,
    roomSelection,
    checkIn,
    checkOut,
    guest,
    idempotencyKey: idempotencyKey || uuid(),
  });

export const createOrder = ({ bookingId, idempotencyKey }) =>
  api.post("/api/payment/create-order", {
    bookingId,
    idempotencyKey: idempotencyKey || uuid(),
  });

export const verifyPayment = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) =>
  api.post("/api/payment/verify-payment", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

export const cancelBooking = (bookingId, reason) =>
  api.put(`/api/booking/${bookingId}/cancel`, reason ? { reason } : {});

export const getBookingReceipt = (bookingId) =>
  api.get(`/api/booking/${bookingId}/receipt`);

export const getMyBookings = () => api.get("/api/booking/my-bookings");

export const getBookingById = (bookingId) => api.get(`/api/booking/${bookingId}`);