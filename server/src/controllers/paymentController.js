import Razorpay from "razorpay";
import config from "../config/razorpayConfig.js";
import crypto from "crypto";

const getRazorpayInstance = () => {
  const key_id = (process.env.RAZORPAY_KEY_ID || "").replace(/['"]/g, "").trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").replace(/['"]/g, "").trim();

  if (!key_id || !key_secret) {
    console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment variables");
  } else {
    console.log(`Razorpay instance initialized with Key ID prefix: ${key_id.slice(0, 10)}...`);
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

const createOrder = async (req, res) => {
  console.log("Create order request body:", req.body);
  if (!req.body.amount || !req.body.currency || !req.body.hostelId) {
    return res.status(400).json({
      message: "Some details are missing.",
    });
  }
  const generateReceipt = () => {
    const date = Date.now();
    const shortHostelId = String(req.body.hostelId || "").slice(-8);
    return `ORD_${shortHostelId}_${date}`.toUpperCase();
  };
  let receipt = generateReceipt();
  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(Number(req.body.amount) * 100),
      currency: req.body.currency,
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    return res.json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res
      .status(500)
      .json({ message: "Error while creating order", error: error.message || error });
  }
};
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", config.razorpay.key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
export { createOrder, verifyPayment };
