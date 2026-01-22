import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webHookRoutes from "./routes/webHookRoutes.js";

import cors from "cors";
import axios from "axios";
dotenv.config();


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

//for email notification
app.post("/api/support", async (req, res) => {
  const { name, email, topic, message, url } = req.body;
  try {
    console.log(req.body)
    await axios.post(
      "https://app.contentstack.com/automations-api/run/12b6c0df1e9a444d882eaf6687709ff1",
       {
        name, email, topic, message, url
       },
       {
          headers: {
            "ah-http-key": process.env.EMAIL_AUTOMATE_KEY,
            "Content-Type": "application/json",
          },
        }
      )
      
    console.log("Support message send.")
    return res.status(200).json({
      message: "Support request received",
    });
    
  } catch (error) {
    console.error("Error while sending mail", error)
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

    if (!process.env.EMAIL_AUTOMATE_KEY) {
      console.error("Missing EMAIL_AUTOMATE_KEY");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    await axios.post(
      "https://app.contentstack.com/automations-api/run/966238c2bd59420aba1b173e59a38ece",
      { email, url },
      {
        headers: {
          "ah-http-key": process.env.EMAIL_AUTOMATE_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("User subscribed:", email);

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
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});