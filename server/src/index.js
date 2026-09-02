import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webHookRoutes from "./routes/webHookRoutes.js";
import lyticsRoutes from "./routes/lyticsRoutes.js";
import cors from "cors";
import axios from "axios";


const app = express();

// app.use(
//   cors({
//     origin: [
//       process.env.CORS_ORIGIN,
//       "http://localhost:5173",
//     ],
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//   })
// );
app.use(
  cors(
  {origin:process.env.CORS_ORIGIN}
  )
)
// app.options("*", cors());



app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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
app.use("/api/lytics", lyticsRoutes)

//for email notification
app.post("/api/support", async (req, res) => {
  const { name, email, topic, message, url } = req.body;
  const discordWebhookUrl = process.env.DISCORD_BOT_WEBHOOK;
  if(!discordWebhookUrl) {
    console.error("Missing DISCORD_BOT_WEBHOOK. Logging support details instead of sending to Discord.");
    return res.status(200).json({
      message: "Server configuration error",
    });
  }
  try{
    const discordMessage = {
      content: `New support request:\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\nMessage: ${message}\nURL: ${url}`,
    };
    await axios.post(discordWebhookUrl, discordMessage, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.status(200).json({
      message: "Support request sent successfully",
    });

  }catch(error){
    console.error("Error while sending message to Discord", error);
    return res.status(500).json({
      message: "Failed to send support request",
    });
  }
});

app.post("/api/subscribe", async (req, res) => {
  try {
    const { email, url } = req.body;

    if (!email || !url) {
      return res.status(400).json({
        message: "Email and URL are required",
      });
    }

   const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
   if(!discordWebhookUrl){
    console.error("Missing DISCORD_WEBHOOK_URL. Logging subscription details instead of sending to Discord.");
    return res.status(200).json({
      message: "Server configuration error",
    });
   }
   const discordMessage = {
      content: `New subscription:\nEmail: ${email}\nURL: ${url}`,
    };
    await axios.post(discordWebhookUrl, discordMessage, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // console.log("User subscribed:", email);

    return res.status(200).json({
      message: "Subscription successful",
    });
  } catch (error) {
    console.error(
      "Subscription failed:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Subscription failed",
    });
  }
});



const PORT = process.env.PORT || 5001;
// const HOST = "0.0.0.0";

app.listen(PORT, () => {
  // console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Server running on port ${PORT}  `);
});