import { Worker } from "bullmq";
import createRedisClient from "../config/redis.js";
import logger from "../utils/logger.js";
import {
  sendOtpEmail,
  sendBookingConfirmationEmail,
  sendHoldExpiredEmail,
  sendRefundEmail,
} from "../services/emailService.js";

/**
 * The consumer. Runs as a long-lived process. Each job is processed
 * sequentially by this worker; scale horizontally by starting more
 * worker processes (BullMQ handles locking automatically).
 */
const connection = createRedisClient("emailWorker");

export const emailWorker = new Worker(
  "emails",
  async (job) => {
    logger.info(
      { jobId: job.id, type: job.data.type, attempt: job.attemptsMade + 1 },
      "processing email job"
    );

    switch (job.data.type) {
      case "hold_expired":
        return sendHoldExpiredEmail(job.data);

      case "booking_confirmed":
        return sendBookingConfirmationEmail(job.data);

      case "otp":
        return sendOtpEmail(job.data.email, job.data.otp);

      case "refund":
        return sendRefundEmail(job.data);

      default:
        throw new Error(`Unknown email job type: ${job.data.type}`);
    }
  },
  {
    connection,
    concurrency: 5,           // process up to 5 emails in parallel
    limiter: { max: 20, duration: 60_000 }, // hard cap: 20 emails/min (Gmail safe)
  }
);

emailWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, type: job.data.type }, "email job completed");
});

emailWorker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      type: job?.data?.type,
      attempt: job?.attemptsMade,
      err: err.message,
    },
    "email job failed"
  );
});

emailWorker.on("error", (err) => {
  logger.error({ err }, "email worker error");
});