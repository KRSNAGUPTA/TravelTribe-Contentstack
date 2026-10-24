import "dotenv/config";
import dns from "dns";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // Ignore fallback
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cron from "node-cron";

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import subscribeRoutes from "./routes/subscribeRoutes.js";

import logger from "./utils/logger.js";
import { register, httpRequestsTotal, httpRequestDuration } from "./utils/metrics.js";
import { expireHolds } from "./jobs/expireHolds.js";
import { expirePayments } from "./jobs/expirePayments.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

// HTTP metrics middleware (place BEFORE routes)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    try {
      const duration = (Date.now() - start) / 1000;

      const route = req.route?.path || (req.path.startsWith("/api") ? "unmatched" : req.path);
      const labels = {
        method: req.method,
        route,
        status_code: res.statusCode,
      };
      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);
    } catch (err) {
      logger.error({ err }, "metrics middleware error");
    }
  });
  next();
});

// Rate limiting 
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});
app.use("/api", generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many attempts from this IP, please try again after 15 minutes",
  },
});
app.use("/api/user/forgot-password", authLimiter);
app.use("/api/user/verify-otp", authLimiter);
app.use("/api/user/reset-password", authLimiter);
app.use("/api/user/login", authLimiter);
app.use("/api/user/signup", authLimiter);

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

connectDB();

app.get("/api", (req, res) => {
  res.status(200).json({ message: "Welcome to TravelTribe" });
});

//  Health endpoints 
app.get("/health/live", (req, res) => {
  res.status(200).json({"message":"ok"});
});

app.get("/health/ready", async (req, res) => {
  try {
    const mongoose = (await import("mongoose")).default;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send("db not ready");
    }
    res.status(200).json({"message":"ok"});
  } catch {
    res.status(503).json({"message":"not ready"});
  }
});

//  Metrics endpoint 
app.get("/metrics", async (req, res) => {
  const token = process.env.METRICS_TOKEN;
  if (!token) {
    return res.status(404).end();
  }
  const provided = req.headers["x-metrics-token"] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (provided !== token) {
    return res.status(401).end();
  }
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error({ err }, "metrics scrape failed");
    res.status(500).end();
  }
});

// Routes 
app.use("/api/user", userRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/subscribe", subscribeRoutes);

//  Cron jobs 
cron.schedule("* * * * *", async () => {
  try {
    await expireHolds();
  } catch (err) {
    logger.error({ err }, "expireHolds cron failed");
  }
});

cron.schedule("*/5 * * * *", async () => {
  try {
    await expirePayments();
  } catch (err) {
    logger.error({ err }, "expirePayments cron failed");
  }
});

logger.info("Cron jobs scheduled: expireHolds (*/1), expirePayments (*/5)");

//  Global error handler (add if you don't have one) 
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method }, "unhandled error");
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || "development" }, `Server started on ${PORT}`);
});