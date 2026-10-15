import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, url } = req.body;

    if (!email || !url) {
      return res.status(400).json({ message: "Email and URL are required" });
    }

    const discordWebhookUrl = process.env.DISCORD_BOT_WEBHOOK;
    if (!discordWebhookUrl) {
      console.error(
        "Missing DISCORD_BOT_WEBHOOK. Logging subscription details instead of sending to Discord."
      );
      return res.status(200).json({ message: "Server configuration error" });
    }

    const discordMessage = {
      content: `New subscription:\nEmail: ${email}\nURL: ${url}`,
    };

    await axios.post(discordWebhookUrl, discordMessage, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    return res.status(200).json({ message: "Subscription successful" });
  } catch (error) {
    console.error(
      "Subscription failed:",
      error.response?.data || error.message
    );
    return res.status(500).json({ message: "Subscription failed" });
  }
});

export default router;