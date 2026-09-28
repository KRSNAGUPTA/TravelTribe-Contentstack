const getRazorpayKeyId = () =>
  (process.env.RAZORPAY_KEY_ID || "").replace(/['"]/g, "").trim();

const getRazorpayKeySecret = () =>
  (process.env.RAZORPAY_KEY_SECRET || "").replace(/['"]/g, "").trim();

const config = {
  razorpay: {
    get key_id() {
      return getRazorpayKeyId();
    },
    get key_secret() {
      return getRazorpayKeySecret();
    },
  },
  getKeyId: getRazorpayKeyId,
  getKeySecret: getRazorpayKeySecret,
};

export default config;