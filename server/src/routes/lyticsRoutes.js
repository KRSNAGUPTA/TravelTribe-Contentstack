import express from "express";
import { fetchLyticsProfile } from "../controllers/lyticsController.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Lytics route is working");
});

router.get("/profile/email/:email", fetchLyticsProfile);


export default router;
