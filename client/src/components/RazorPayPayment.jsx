import React, { useState } from 'react';
import api from "@/api";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/Lytics/config';

const RazorPayPayment = ({ hostelId, formData, hostelName, roomType, validateForm }) => {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleBooking = async (receiptId) => {
    try {
      const bookingData = {
        ...formData,
        hostelId,
        receiptId
      };
      
      const res = await api.post("/api/booking/", bookingData);

      trackEvent("booking_successful", {
        hostel_id: hostelId,
        total_amount: formData.amount,
        hostel_name: hostelName,
        room_type: roomType,
        email: formData.email || null,
        name: formData.name || null,
      });
      
      toast({
        title: "Booking successful",
        description: "Check your profile for booking information"
      });
      
      navigate("/profile");
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: "Your payment was successful but booking failed. Our team will contact you shortly."
      });
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    trackEvent("booking_initiated", {
      _e: "booking_initiated",
      hostel_id: hostelId,
      hostel_name: hostelName,
      room_type: roomType,
      total_amount: formData.amount,
      check_in: formData.checkIn,
      check_out: formData.checkOut,
      email: formData.email || null,
      name: formData.name || null,
    });

    setIsProcessing(true);
    try {
      const orderResponse = await api.post("/api/payment/create-order", {
        amount: parseFloat(formData.amount),
        currency: "INR",
        hostelId: `${hostelId}`,
      });
      trackEvent("currency_selected", {
        _e: "currency_selected",
        currency: "INR",
        email: formData.email || null,
        name: formData.name || null,
      });

      const cleanPhone = formData.phone?.replace(/\D/g, '').slice(-10) || "";
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: "INR",
        name: "Travel Tribe",
        description: "Hostel Booking Payment",
        order_id: orderResponse.data.id,
        prefill: {
          name: formData.name || "",
          email: formData.email || "",
          contact: cleanPhone,
        },
        theme: {
          color: "var(--primary)",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        handler: async (response) => {
          setIsProcessing(true);
          try {
            const verifyResponse = await api.post(
              "/api/payment/verify-payment",
              response
            );

            if (verifyResponse.data?.success) {
              toast({
                title: "Payment Successful!",
                description: `Payment of ₹${orderResponse.data.amount / 100} was successful.`
              });
              trackEvent("payment_successful", {
                _e: "payment_successful",
                hostel_id: hostelId,
                total_amount: formData.amount,
                hostel_name: hostelName,
                room_type: roomType,
                email: formData.email || null,
                name: formData.name || null,
              });
              await handleBooking(orderResponse.data.receipt);
            } else {
              throw new Error(verifyResponse.data?.message || "Verification failed");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast({
              variant: "destructive",
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted"
            });
          } finally {
            setIsProcessing(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response.error);
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: response.error?.description || "Payment failed or cancelled.",
        });
      });
      razorpayInstance.open();
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "⚠️ Payment Failed",
        description: "Please try again or contact support"
      });
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={isProcessing}
      className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Pay Now"
      )}
    </Button>
  );
};

export default RazorPayPayment;