import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/", async (req, res) => {
  const { name, email, topic, message, url } = req.body;

  const discordWebhookUrl = process.env.DISCORD_BOT_WEBHOOK;
  if (!discordWebhookUrl) {
    console.error(
      "Missing DISCORD_BOT_WEBHOOK. Logging support details instead of sending to Discord."
    );
    return res.status(200).json({ message: "Server configuration error" });
  }

  try {
    const discordMessage = {
      content: `New support request:\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\nMessage: ${message}\nURL: ${url}`,
    };

    await axios.post(discordWebhookUrl, discordMessage, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    return res.status(200).json({ message: "Support request sent successfully" });
  } catch (error) {
    console.error("Error while sending message to Discord", error);
    return res.status(500).json({ message: "Failed to send support request" });
  }
});

export default router;