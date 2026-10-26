import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  holdBooking,
  createOrder,
  verifyPayment,
  getAvailability,
  newIdempotencyKey,
} from "@/services/bookingApi";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function RazorPayPayment({
  hostelId,
  formData,
  hostelName,
  roomType,
  nights,
  validateForm,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  // Holds the idempotency key for the current attempt so retries reuse it.
  const holdKeyRef = useRef(null);
  // The held booking id once a hold is created.
  const bookingIdRef = useRef(null);

  // Reset idempotency key when the user changes any identifying input.
  useEffect(() => {
    holdKeyRef.current = null;
    bookingIdRef.current = null;
  }, [
    hostelId,
    formData?.checkIn,
    formData?.checkOut,
    formData?.roomSelection,
    formData?.guest?.email,
    formData?.guest?.name,
    formData?.guest?.phone,
    formData?.guest?.gender,
  ]);

  const resetAttempt = () => {
    holdKeyRef.current = null;
    bookingIdRef.current = null;
  };

  const handlePay = async () => {
    if (processing) return;
    if (!validateForm()) return;

    setProcessing(true);

    try {
      // 0. Fresh availability check — fail fast before burning a hold.
      const avail = await getAvailability(
        hostelId,
        formData.checkIn,
        formData.checkOut,
        formData.roomSelection
      );
      const days = avail?.data?.calendar || [];
      const anySoldOut = days.some((d) => {
        const cell = d?.rooms?.[formData.roomSelection];
        return cell && cell.available <= 0;
      });
      if (anySoldOut) {
        toast({
          title: "Sold out",
          description:
            "This room just sold out for the selected dates. Please pick different dates.",
          variant: "destructive",
        });
        resetAttempt();
        return;
      }

      // 1. Create hold (server computes amount).
      if (!holdKeyRef.current) holdKeyRef.current = newIdempotencyKey();

      const holdRes = await holdBooking({
        hostelId,
        roomSelection: formData.roomSelection,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guest: formData.guest,
        idempotencyKey: holdKeyRef.current,
      });

      const heldBooking = holdRes.data?.booking;
      const holdAmount = holdRes.data?.amount;
      if (!heldBooking?._id) {
        throw new Error("Hold response missing booking id");
      }
      bookingIdRef.current = heldBooking._id;

      // 2. Create Razorpay order (server reads amount from hold).
      const orderRes = await createOrder({
        bookingId: heldBooking._id,
        idempotencyKey: newIdempotencyKey(),
      });
      const { orderId, amount, currency, keyId } = orderRes.data || {};
      if (!orderId || !keyId) {
        throw new Error("Payment order could not be created");
      }

      // 3. Load Razorpay SDK.
      const ok = await loadRazorpay();
      if (!ok) {
        toast({
          title: "Payment unavailable",
          description: "Could not load Razorpay. Check your connection.",
          variant: "destructive",
        });
        return;
      }

      // 4. Open Razorpay checkout.
      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount: typeof amount === "number" ? amount : holdAmount,
        currency: currency || "INR",
        name: "Travel Tribe",
        description: `${hostelName} — ${roomType} (${nights} night${
          nights === 1 ? "" : "s"
        })`,
        prefill: {
          name: formData.guest?.name,
          email: formData.guest?.email,
          contact: formData.guest?.phone,
        },
        notes: {
          hostelId,
          roomSelection: formData.roomSelection,
          bookingId: heldBooking._id,
        },
        theme: { color: "#e11d48" },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast({
              title: "Booking confirmed",
              description: "Your stay is locked in. Enjoy!",
            });
            resetAttempt();
            navigate("/profile");
          } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;

            if (status === 409 && data?.refundInitiated) {
              toast({
                title: "Refund initiated",
                description:
                  data?.message ||
                  "Your hold expired or the price changed. A refund has been initiated.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Payment verification failed",
                description:
                  data?.message ||
                  "We could not confirm your payment. Contact support if money was deducted.",
                variant: "destructive",
              });
            }
            resetAttempt();
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the Razorpay window. Hold remains pending
            // and will be swept by the expireHolds job.
            toast({
              title: "Payment cancelled",
              description:
                "Your hold will expire in 15 minutes unless you complete payment.",
            });
          },
        },
      });

      rzp.on("payment.failed", (resp) => {
        toast({
          title: "Payment failed",
          description:
            resp?.error?.description ||
            "Razorpay reported a failure. Please try again.",
          variant: "destructive",
        });
        resetAttempt();
      });

      rzp.open();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409) {
        toast({
          title: "Booking conflict",
          description:
            data?.message ||
            "This room is no longer available. Try different dates.",
          variant: "destructive",
        });
      } else if (status === 401) {
        toast({
          title: "Please log in again",
          description: "Your session expired.",
          variant: "destructive",
        });
      } else if (status === 400) {
        toast({
          title: "Invalid booking request",
          description: data?.message || "Please review your inputs.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Could not start payment",
          description:
            data?.message ||
            err?.message ||
            "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
      resetAttempt();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handlePay}
      disabled={processing}
      className="cursor-pointer group h-11 rounded-full bg-primary px-6 text-[0.85rem] font-semibold text-on-primary shadow-md transition hover:bg-primary-hover disabled:opacity-60"
    >
      {processing ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Processing…
        </>
      ) : (
        <>
          <ShieldCheck className="mr-0 h-4 w-4" />
          Pay
        </>
      )}
    </Button>
  );
}