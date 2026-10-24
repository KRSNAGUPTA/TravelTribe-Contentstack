/**
 * Date utilities — the ONLY place in the codebase that parses dates.
 *
 * The invariant: every checkInDate / checkOutDate is stored as UTC midnight
 * of the LOCAL calendar day. "March 10 in IST" is stored as
 * 2025-03-10T00:00:00.000Z (midnight UTC), NOT 2025-03-09T18:30:00.000Z.
 *
 */

/**
 * Parse a "YYYY-MM-DD" string into a UTC-midnight Date.
 * Throws on any other format — including full ISO datetimes.
 */
export const toUTCDate = (input) => {
  if (input instanceof Date) {
    // Accept a Date only if it's already UTC midnight
    const isUtcMidnight =
      input.getUTCHours() === 0 &&
      input.getUTCMinutes() === 0 &&
      input.getUTCSeconds() === 0 &&
      input.getUTCMilliseconds() === 0;
    if (!isUtcMidnight) {
      throw new Error(`Date ${input.toISOString()} is not UTC midnight`);
    }
    return new Date(input.getTime());
  }

  if (typeof input !== "string") {
    throw new Error(`Date must be a "YYYY-MM-DD" string, got ${typeof input}`);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) {
    throw new Error(`Date must be in "YYYY-MM-DD" format, got "${input}"`);
  }

  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    throw new Error(`Invalid calendar date: "${input}"`);
  }

  return date;
};

/**
 * Generate every night in [checkIn, checkOut) as UTC-midnight Dates.
 * checkOut is EXCLUSIVE — the check-out day is not an occupied night.
 */
export const eachNight = (checkIn, checkOut) => {
  const start = toUTCDate(checkIn);
  const end = toUTCDate(checkOut);
  if (start >= end) return [];

  const nights = [];
  const cur = new Date(start.getTime());
  while (cur < end) {
    nights.push(new Date(cur.getTime()));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return nights;
};

/**
 * YYYY-MM-DD string for a UTC-midnight Date. Safe as a map key.
 */
export const formatDateKey = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("formatDateKey requires a valid Date");
  }
  return date.toISOString().slice(0, 10);
};

/**
 * Difference in whole days between two UTC-midnight Dates.
 */
export const diffInDays = (start, end) => {
  const s = toUTCDate(start);
  const e = toUTCDate(end);
  return Math.round((e.getTime() - s.getTime()) / 86_400_000);
};