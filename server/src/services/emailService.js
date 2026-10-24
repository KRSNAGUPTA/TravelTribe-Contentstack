import nodemailer from "nodemailer";
import dns from "dns/promises";

let cachedHost = null;
let cachedTransporter = null;
let verifyPromise = null;

const resolveSmtpHost = async () => {
  if (cachedHost) return cachedHost;
  try {
    const addresses = await dns.resolve4("smtp.gmail.com");
    if (addresses && addresses.length > 0) {
      console.log("Resolved smtp.gmail.com to IPv4:", addresses[0]);
      cachedHost = addresses[0];
      return cachedHost;
    }
  } catch (err) {
    console.error("Failed to resolve IPv4 for smtp.gmail.com:", err.message);
  }
  cachedHost = "smtp.gmail.com";
  return cachedHost;
};

const createTransporter = async () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.APP_PASSWORD
    ? process.env.APP_PASSWORD.replace(/\s+/g, "")
    : "";

  if (!user || !pass) {
    console.error(
      "Email user or app password is not set in environment variables."
    );
    throw new Error(
      "Email user or app password is not set in environment variables."
    );
  }

  const host = await resolveSmtpHost();

  return nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
      servername: "smtp.gmail.com",
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = await createTransporter();
  return cachedTransporter;
};

const ensureVerifiedOnce = async () => {
  if (verifyPromise) return verifyPromise;
  verifyPromise = (async () => {
    try {
      const transporter = await getTransporter();
      await transporter.verify();
      console.log("Email transporter verified and ready");
    } catch (err) {
      console.error("Email transporter verification failed:", err.message);
      cachedTransporter = null;
      verifyPromise = null;
      throw err;
    }
  })();
  return verifyPromise;
};

const formatDateStr = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(date.getTime())
    ? String(d)
    : date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export const sendOtpEmail = async (toEmail, otp) => {
  try {
    await ensureVerifiedOnce();
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Travel Tribe" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your Password Reset OTP - Travel Tribe",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #6d28d9; text-align: center; margin-bottom: 20px;">Travel Tribe</h2>
        <p style="font-size: 15px; color: #333333;">Hello,</p>
        <p style="font-size: 15px; color: #333333;">You requested a password reset for your Travel Tribe account. Use the 6-digit OTP below to verify your request:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #6d28d9; background-color: #f3e8ff; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 13px; color: #666666;">This OTP is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999999; text-align: center;">&copy; ${new Date().getFullYear()} Travel Tribe. All rights reserved.</p>
      </div>
    `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

export const sendBookingConfirmationEmail = async (booking) => {
  try {
    await ensureVerifiedOnce();
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Travel Tribe" <${process.env.EMAIL_USER}>`,
      to: booking.guest.email,
      subject: `Booking Confirmed - ${booking.receiptId || "Travel Tribe"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6d28d9; margin: 0; font-size: 26px;">Travel Tribe</h2>
            <p style="color: #10b981; font-weight: bold; margin-top: 6px; font-size: 16px;">Booking Confirmed!</p>
          </div>

          <p style="font-size: 15px; color: #374151;">Dear <strong>${booking.guest.name}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            Thank you for booking with Travel Tribe! Your accommodation reservation has been confirmed. Below are your booking details:
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Receipt ID:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${booking.receiptId || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Room Type:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${booking.roomSelection || "Standard Room"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Check-in Date:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${formatDateStr(booking.checkInDate || booking.checkIn)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Check-out Date:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${formatDateStr(booking.checkOutDate || booking.checkOut)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Guest Phone:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${booking.guest.phone}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 10px 0 0 0; font-weight: bold; color: #111827; font-size: 15px;">Total Amount Paid:</td>
                <td style="padding: 10px 0 0 0; font-weight: bold; color: #6d28d9; text-align: right; font-size: 16px;">₹${booking.amount}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #6b7280; line-height: 1.4;">
            Please present your receipt ID or confirmation email upon arrival at check-in.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} Travel Tribe. Safe travels!
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Booking confirmation email sent successfully:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send booking confirmation email:", err.message);
    throw err;
  }
};


export const sendHoldExpiredEmail = async (booking) => {
  try {
    await ensureVerifiedOnce();
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Travel Tribe" <${process.env.EMAIL_USER}>`,
      to: booking.guest.email,
      subject: "Your booking hold has expired — Travel Tribe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6d28d9; margin: 0; font-size: 26px;">Travel Tribe</h2>
          </div>

          <p style="font-size: 15px; color: #374151;">Hi <strong>${booking.guest.name}</strong>,</p>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            Your booking hold has expired because payment was not completed within 15 minutes.
            The bed at <strong>${booking.hostelId}</strong> for room type
            <strong>${booking.roomSelection}</strong> has been released.
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Check-in:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${formatDateStr(booking.checkInDate)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Check-out:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${formatDateStr(booking.checkOutDate)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Nights:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${booking.nights}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            If you'd still like to book, simply start a new booking on our site.
          </p>

          <p style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || "#"}/hostels"
               style="background: #6d28d9; color: white; padding: 12px 24px;
                      border-radius: 6px; text-decoration: none; font-weight: bold;
                      display: inline-block;">
              Book Again
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} Travel Tribe. Safe travels!
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Hold-expired email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send hold-expired email:", err.message);
    throw err;
  }
};


export const sendRefundEmail = async (data) => {
  try {
    if (!data?.guest?.email) {
      console.warn(
        "sendRefundEmail: no guest email in payload, skipping",
        { paymentId: data?.paymentId }
      );
      return;
    }

    await ensureVerifiedOnce();
    const transporter = await getTransporter();

    const reasonMap = {
      hold_expired:
        "Your booking hold expired before payment was completed.",
      price_changed:
        "The room price changed while you were completing payment.",
      no_availability_at_confirm:
        "The room became unavailable during payment.",
      booking_confirm_race:
        "A booking conflict occurred during confirmation.",
      booking_race: "A booking conflict occurred.",
      held_booking_expired:
        "Your booking hold expired while you were completing payment.",
    };

    const reason =
      reasonMap[data.reason] ||
      "Your payment could not be applied to a booking.";

    const amountRupees = (data.amount / 100).toFixed(2);

    const mailOptions = {
      from: `"Travel Tribe" <${process.env.EMAIL_USER}>`,
      to: data.guest.email,
      subject: "Your Travel Tribe refund has been initiated",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6d28d9; margin: 0; font-size: 26px;">Travel Tribe</h2>
          </div>

          <p style="font-size: 15px; color: #374151;">Hi <strong>${data.guest.name}</strong>,</p>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            ${reason}
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Refund Amount:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #6d28d9; font-size: 16px;">
                  ₹${amountRupees}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Payment Reference:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right; font-size: 12px; color: #6b7280;">
                  ${data.paymentId}
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            The refund has been initiated to your original payment method. Most banks process
            refunds within <strong>5–7 business days</strong>.
          </p>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            If you'd like to try booking again, we'd be happy to have you:
          </p>

          <p style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || "#"}/hostels"
               style="background: #6d28d9; color: white; padding: 12px 24px;
                      border-radius: 6px; text-decoration: none; font-weight: bold;
                      display: inline-block;">
              Browse Hostels
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} Travel Tribe. We apologize for the inconvenience.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Refund email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send refund email:", err.message);
    throw err;
  }
};