import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to Payment Route" });
});

router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);

export default router;