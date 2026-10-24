import Redis from "ioredis";
import logger from "../utils/logger.js";

/**
 * Single shared Redis connection factory for BullMQ.
 *
 * Resilience policy:
 *   - Never throws on missing config — logs error and returns null.
 *   - Callers must handle null (see queues/emailQueue.js).
 *   - Connection errors are logged, not thrown.
 *
 * BullMQ requires `maxRetriesPerRequest: null` on the connection it uses
 * for queue operations. ioredis reconnects automatically on error.
 */
const createRedisClient = (name = "redis") => {
  const url = process.env.REDIS_URL;

  if (!url) {
    logger.error(
      { name },
      "REDIS_URL is not set — email queue will be disabled (emails will not be sent)"
    );
    return null;
  }

  let client;
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      // Don't hang forever if Redis is down at boot
      connectTimeout: 5000,
    });
  } catch (err) {
    logger.error({ err, name }, "failed to create redis client");
    return null;
  }

  client.on("connect", () => logger.info({ name }, "redis connected"));
  client.on("ready", () => logger.info({ name }, "redis ready"));
  client.on("error", (err) =>
    logger.error({ err: err.message, name }, "redis error")
  );
  client.on("end", () => logger.warn({ name }, "redis connection closed"));
  client.on("reconnecting", () =>
    logger.warn({ name }, "redis reconnecting")
  );

  return client;
};

export default createRedisClient;