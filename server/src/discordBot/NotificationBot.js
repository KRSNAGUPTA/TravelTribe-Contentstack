import axios from "axios";

export const sendNotification = async (type, data) => {
  try {
    const webhookUrl = process.env.DISCORD_BOT_WEBHOOK;
    if (!webhookUrl) return;

    if (!type || !data) {
      console.warn("No type or data provided for notification");
      return;
    }

    let message = "";
    if (type === "login") {
      message = `User ${
        data.name
      } logged in at ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}`;
    } else if (type === "register") {
      message = `User ${
        data.name
      } registered at ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}`;
    } else if (type === "support") {
      message = `${data.name} with email ${data.email} on topic ${data.topic} \nsent a message: ${data.message}`;
    } else if (type === "booking") {
      message = `User ${data.name} (Email: ${data.email}, Phone: ${data.phone || "N/A"}) booked a room at hostel ID ${data.hostelId}.\nDetails are as follows:\n- Receipt ID: ${data.receiptId}\n- Check In: ${data.checkInDate}\n- Check Out: ${data.checkOutDate}\n- Room Type: ${data.roomSelection}\n- Amount Paid: ₹ ${data.amount} /-`;
    } else if (type === "subscribe") {
      message = `User with email ${data.email} subscribed to the newsletter`;
    }

    if (!message) {
      console.warn(`Type ${type} not supported for notification.`);
      return;
    }

    await axios.post(
      webhookUrl,
      { content: message },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      }
    );
  } catch (error) {
    console.error("Failed to send Discord notification:", error.message);
  }
};
