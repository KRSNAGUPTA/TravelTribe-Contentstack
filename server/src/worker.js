// worker.js
import "dotenv/config";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import "./workers/emailWorker.js";

connectDB().then(() => {
  logger.info("Email worker started");
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing worker");
  const { emailWorker } = await import("./src/workers/emailWorker.js");
  await emailWorker.close();
  process.exit(0);
});