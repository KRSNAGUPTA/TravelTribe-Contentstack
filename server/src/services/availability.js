/**
 * Availability computation — the single source of truth for "how many beds
 * are free on date D for room R at hostel H".
 *
 * Availability is DERIVED from Bookings, never stored. This file is the
 * only place that computes it. If you find yourself computing availability
 * in a controller, import from here instead.
 *
 * The overlap rule: a Booking with [checkInDate, checkOutDate) occupies
 * nights checkInDate .. checkOutDate-1. checkOutDate itself is FREE
 * (same-day turnover is allowed).
 */

import Booking, { ACTIVE_STATUSES } from "../models/BookingModel.js";
import { eachNight, formatDateKey } from "../utils/date.js";

/**
 * Build a per-night availability grid.
 *
 * @param {object} hostel       Hostel document (with room_types)
 * @param {string} roomKey      e.g. "DOUBLE" (optional — null means all rooms)
 * @param {Date}   checkIn      UTC midnight
 * @param {Date}   checkOut     UTC midnight
 * @param {ClientSession} session  Mongo session (may be null)
 * @returns {{
 *   hostelId: string,
 *   checkIn: string, checkOut: string, nights: number,
 *   rooms: Array<{ room_key, room_name, totalBeds }>,
 *   calendar: Array<{ date: string, rooms: Record<string, { totalBeds, booked, available }> }>
 * }}
 */
export const buildCalendar = async (
  hostel,
  roomKey,
  checkIn,
  checkOut,
  session = null
) => {
  const nights = eachNight(checkIn, checkOut);
  if (nights.length === 0) {
    throw Object.assign(new Error("checkOut must be after checkIn"), {
      status: 400,
    });
  }

  // Select which room types to include
  let roomTypes = hostel.room_types;
  if (roomKey) {
    roomTypes = roomTypes.filter((r) => r.room_key === roomKey);
    if (roomTypes.length === 0) {
      throw Object.assign(new Error(`Room type "${roomKey}" not found`), {
        status: 404,
      });
    }
  }

  const roomKeys = roomTypes.map((r) => r.room_key);
  const totals = Object.fromEntries(roomTypes.map((r) => [r.room_key, r.total_beds]));

  // Initialize booked counts per (date, roomKey)
  const booked = {};
  for (const night of nights) {
    const key = formatDateKey(night);
    booked[key] = Object.fromEntries(roomKeys.map((rk) => [rk, 0]));
  }

  // Fetch all active bookings overlapping [checkIn, checkOut)
  let query = Booking.find({
    hostelId: hostel.hostelId,
    roomSelection: { $in: roomKeys },
    status: { $in: ACTIVE_STATUSES },
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
  }).select("checkInDate checkOutDate roomSelection");

  if (session) query = query.session(session);
  const overlapping = await query;

  // Expand each booking across its nights and count
  for (const b of overlapping) {
    const rk = b.roomSelection;
    if (!roomKeys.includes(rk)) continue;
    for (const night of eachNight(b.checkInDate, b.checkOutDate)) {
      const key = formatDateKey(night);
      if (booked[key] && rk in booked[key]) {
        booked[key][rk] += 1;
      }
    }
  }

  // Build the calendar
  const calendar = nights.map((night) => {
    const date = formatDateKey(night);
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

  return {
    hostelId: hostel.hostelId,
    checkIn: formatDateKey(checkIn),
    checkOut: formatDateKey(checkOut),
    nights: nights.length,
    rooms: roomTypes.map((r) => ({
      room_key: r.room_key,
      room_name: r.room_name,
      totalBeds: r.total_beds,
    })),
    calendar,
  };
};

/**
 * Minimum beds available for `roomKey` across every night in the calendar.
 * A booking is allowed only if this is >= 1.
 */
export const minAvailableForStay = (calendar, roomKey) => {
  if (!calendar?.length) return 0;
  return Math.min(
    ...calendar.map((day) => day.rooms[roomKey]?.available ?? 0)
  );
};

/**
 * Server-authoritative price for a stay.
 * @returns {number} price in paise
 */
export const computePrice = (hostel, roomKey, checkIn, checkOut) => {
  const room = hostel.room_types.find((r) => r.room_key === roomKey);
  if (!room) {
    throw Object.assign(new Error(`Room type "${roomKey}" not found`), {
      status: 404,
    });
  }
  const nights = eachNight(checkIn, checkOut).length;
  if (nights < 1) {
    throw Object.assign(new Error("Booking must be at least 1 night"), {
      status: 400,
    });
  }
  return {
    nights,
    price_per_night: room.price_per_night,
    amount: room.price_per_night * nights,
  };
};