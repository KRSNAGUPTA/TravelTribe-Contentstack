import "dotenv/config";
import dns from "dns";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // Ignore fallback
}

import express from "express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import lyticsRoutes from "./routes/lyticsRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import subscribeRoutes from "./routes/subscribeRoutes.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "ah-http-key",
    ],
  })
);

app.use(cookieParser());

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
app.use("/api/user/login", authLimiter);
app.use("/api/user/signup", authLimiter);

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

connectDB();

app.get("/api", (req, res) => {
  res.status(200).json({ message: "Welcome to TravelTribe" });
});

app.use("/api/user", userRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/lytics", lyticsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/subscribe", subscribeRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});