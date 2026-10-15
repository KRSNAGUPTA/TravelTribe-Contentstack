import React, { useState } from "react";
import api from "@/api";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const RazorPayPayment = ({
  hostelId,
  formData,
  hostelName,
  roomType,
  validateForm,
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Pull the live primary color from the CSS token so Razorpay's modal
  // matches the app theme without hardcoding a hex value.
  const getPrimaryHex = () => {
    if (typeof window === "undefined") return "#ff6b3d";
    const triplet = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();
    if (!triplet) return "#ff6b3d";

    const [h, s, l] = triplet
      .split(/\s+/)
      .map((v) => parseFloat(v.replace("%", "")));

    // HSL → hex (Razorpay requires hex, not hsl()).
    const sN = s / 100;
    const lN = l / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = sN * Math.min(lN, 1 - lN);
    const f = (n) =>
      lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (n) =>
      Math.round(255 * f(n))
        .toString(16)
        .padStart(2, "0");

    return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
  };

  const handleBooking = async ({ receiptId, paymentId }) => {
    const bookingData = { ...formData, hostelId, receiptId, paymentId };
    const res = await api.post("/api/booking/", bookingData);

    toast({
      title: "Booking successful",
      description: "Check your profile for booking information",
    });

    navigate("/profile");
    return res.data;
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      const orderResponse = await api.post("/api/payment/create-order", {
        amount: parseFloat(formData.amount),
        currency: "INR",
        hostelId: `${hostelId}`,
      });

      const cleanPhone = formData.phone?.replace(/\D/g, "").slice(-10) || "";

      const description = roomType
        ? `Booking — ${hostelName || "Hostel"} (${roomType})`
        : `Booking — ${hostelName || "Hostel"}`;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: "INR",
        name: "Travel Tribe",
        description,
        order_id: orderResponse.data.id,
        prefill: {
          name: formData.name || "",
          email: formData.email || "",
          contact: cleanPhone,
        },
        theme: {
          color: getPrimaryHex(),
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
        handler: async (response) => {
          setIsProcessing(true);
          try {
            const verifyResponse = await api.post(
              "/api/payment/verify-payment",
              response
            );

            if (!verifyResponse.data?.success) {
              throw new Error(
                verifyResponse.data?.message || "Payment verification failed"
              );
            }

            const { paymentId } = verifyResponse.data;
            if (!paymentId) {
              throw new Error(
                "Server did not return a paymentId after verification"
              );
            }

            toast({
              title: "Payment successful",
              description: `₹${orderResponse.data.amount / 100} received`,
            });

            await handleBooking({
              receiptId: orderResponse.data.receipt,
              paymentId,
            });
          } catch (error) {
            console.error("Post-payment error:", error);

            const message =
              error?.response?.data?.message ||
              error?.message ||
              "Booking could not be completed";

            if (error?.response?.status === 409) {
              toast({
                variant: "destructive",
                title: "Booking conflict",
                description: message,
              });
            } else {
              toast({
                variant: "destructive",
                title: "Booking failed after payment",
                description:
                  "Your payment was successful but booking failed. Our team will contact you shortly.",
              });
            }
          } finally {
            setIsProcessing(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "Payment failed",
          description:
            response.error?.description || "Payment failed or cancelled.",
        });
      });

      razorpayInstance.open();
    } catch (error) {
      console.error("Payment init error:", error);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "Please try again or contact support",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing}
      className="group h-11 gap-2 rounded-full bg-primary px-6 text-on-primary shadow-sm transition-colors hover:bg-primary-hover active:bg-primary-active"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <RazorpayMark className="h-4 w-4" />
          <span>Pay Now</span>
        </>
      )}
    </Button>
  );
};

// Inline Razorpay mark — stroke-based so it inherits currentColor from the button.
function RazorpayMark({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 16 20 4l-3 10-6 3-3 5-4-6z" />
    </svg>
  );
}

export default RazorPayPayment;