import Razorpay from "razorpay";
import config from "../config/razorpayConfig.js";
import crypto from "crypto";

const getRazorpayInstance = () => {
  const key_id = config.getKeyId();
  const key_secret = config.getKeySecret();

  if (!key_id || !key_secret) {
    console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment variables");
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

const createOrder = async (req, res) => {
  try {
    const { amount, currency, hostelId } = req.body || {};

    if (!amount || !hostelId) {
      return res.status(400).json({
        message: "Amount and hostelId are required to create a payment order.",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a valid positive number.",
      });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        message: "Payment gateway is not configured on the server. Please check Razorpay keys.",
      });
    }

    const shortHostelId = String(hostelId).slice(-8);
    const date = Date.now();
    // Razorpay receipt string max length is 40 characters
    const receipt = `ORD_${shortHostelId}_${date}`.toUpperCase().slice(0, 40);

    const options = {
      amount: Math.round(numericAmount * 100), // Razorpay expects amount in paise (subunits)
      currency: (currency || "INR").trim().toUpperCase(),
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      message: "Error while creating payment order",
      error: error.message || error,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)",
      });
    }

    const key_secret = config.getKeySecret();
    if (!key_secret) {
      console.error("Missing RAZORPAY_KEY_SECRET during payment verification");
      return res.status(500).json({
        success: false,
        message: "Payment verification configuration error on server",
      });
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign)
      .digest("hex");

    // Timing-safe comparison to protect against timing attacks
    const isAuthentic =
      expectedSign.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSign, "utf-8"),
        Buffer.from(razorpay_signature, "utf-8")
      );

    if (isAuthentic) {
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message || error,
    });
  }
};

export { createOrder, verifyPayment };
