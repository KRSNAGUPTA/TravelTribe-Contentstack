import Payment, { PAYMENT_STATUS } from "../models/PaymentModel.js";
import logger from "../utils/logger.js";

export const expirePayments = async () => {
  const now = new Date();
  let processed = 0;

  while (true) {
    const payment = await Payment.findOneAndUpdate(
      {
        status: PAYMENT_STATUS.CREATED,
        expiresAt: { $lte: now },
      },
      {
        $set: {
          status: PAYMENT_STATUS.EXPIRED,
          failureReason: "razorpay_order_ttl_expired",
        },
      },
      { new: true, sort: { expiresAt: 1 } }
    );

    if (!payment) break;
    processed++;
  }

  logger.info({ processed }, "expirePayments complete");
  return { processed };
};