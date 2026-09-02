import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.APP_PASSWORD
    ? process.env.APP_PASSWORD.replace(/\s+/g, "")
    : "";

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
};

export const sendOtpEmail = async (toEmail, otp) => {
  const transporter = getTransporter();

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
};

export const sendBookingConfirmationEmail = async (booking) => {
  try {
    const transporter = getTransporter();

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

    const mailOptions = {
      from: `"Travel Tribe" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `Booking Confirmed - ${booking.receiptId || "Travel Tribe"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6d28d9; margin: 0; font-size: 26px;">Travel Tribe</h2>
            <p style="color: #10b981; font-weight: bold; margin-top: 6px; font-size: 16px;">Booking Confirmed!</p>
          </div>

          <p style="font-size: 15px; color: #374151;">Dear <strong>${booking.name}</strong>,</p>
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
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${booking.phone}</td>
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
    console.error("Failed to send booking confirmation email:", err);
  }
};
