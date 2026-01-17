import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webHookRoutes from "./routes/webHookRoutes.js";

import cors from "cors";
import { sendNotification } from "./discordBot/NotificationBot.js";
import axios from "axios";
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

connectDB();
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Welcome to TravelTribe",
  });
});
app.use("/api/user", userRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/hook", webHookRoutes)

//for discord bot notification
app.post("/api/support", async (req, res) => {
  const { name, email, topic, message } = req.body;
  await sendNotification("support", {
    name,
    email,
    topic,
    message,
  });

  res.status(200).json({
    message: "Support request received",
  });
  console.log("Support message send.")
});

app.post("/api/subscribe", async (req, res) => {
  await axios.post(
  "https://app.contentstack.com/automations-api/run/966238c2bd59420aba1b173e59a38ece",
  req.body,
  {
    headers: {
      "ah-http-key": process.env.EMAIL_AUTOMATE_KEY,
    },
  }
);

  res.status(200).json({
    message: "Subscription request received",
  });
  console.log("User Subscribed");
});


const PORT = process.env.PORT || 5001;
const HOST = "0.0.0.0";

app.listen(PORT,HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});