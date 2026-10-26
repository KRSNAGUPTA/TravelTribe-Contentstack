import Booking, { BOOKING_STATUS } from "../models/BookingModel.js";
import { enqueueHoldExpired } from "../queues/emailQueue.js";
import logger from "../utils/logger.js";

export const expireHolds = async () => {
  const now = new Date();
  let processed = 0;

  while (true) {
    const booking = await Booking.findOneAndUpdate(
      {
        status: BOOKING_STATUS.PENDING,
        holdExpiresAt: { $lte: now },
      },
      {
        $set: {
          status: BOOKING_STATUS.EXPIRED,
          expiredAt: now,
        },
        $push: {
          statusHistory: {
            from: BOOKING_STATUS.PENDING,
            to: BOOKING_STATUS.EXPIRED,
            at: now,
            reason: "hold_ttl_expired",
          },
        },
      },
      { returnDocument: "after", sort: { holdExpiresAt: 1 } }
    );

    if (!booking) break;
    processed++;

    await enqueueHoldExpired(booking);
  }

  if (processed > 0) {
    logger.info({ processed }, "expireHolds complete");
  }
  return { processed };
};