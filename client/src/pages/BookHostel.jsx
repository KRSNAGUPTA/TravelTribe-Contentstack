import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CalendarIcon,
  BedDouble,
  User,
  Phone,
  Mail,
  AlertCircle,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, useSearchParams } from "react-router-dom";
import RazorPayPayment from "@/components/RazorPayPayment";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import api from "@/api";
import { useAuth } from "@/context/AuthContext";
import cmsClient from "@/contentstackClient";

export default function HostelBooking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const selectedRoomFromQuery = searchParams.get("room");

  const { toast } = useToast();
  const { user } = useAuth();
  const [cmsRooms, setCmsRooms] = useState([]);
  const [availabilityRooms, setAvailabilityRooms] = useState([]);
  const [hostel, setHostel] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    roomSelection: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    amount: 0,
  });

  const [bookingSummary, setBookingSummary] = useState({
    roomType: "",
    dailyRent: 0,
    securityDeposit: 0,
    days: 0,
    totalAmount: 0,
  });
  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      name: user.name || prev.name,
      email: user.email || prev.email,
    }));
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiRes = await api.get(`/api/hostel/${id}`);
        const cmsRes = await cmsClient.get(
          `/content_types/hostel/entries/${id}`
        );

        setAvailabilityRooms(apiRes.data.room_types || []);
        setCmsRooms(cmsRes.data.entry.room_types || []);
        setHostel(cmsRes.data.entry);
      } catch (err) {
        toast({
          title: "Failed to load hostel data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [id, toast]);

  const mergedRooms = useMemo(() => {
    const availabilityMap = availabilityRooms.reduce((acc, r) => {
      acc[r.room_key] = r;
      return acc;
    }, {});

    return cmsRooms.map((cmsRoom) => {
      const backendRoom = availabilityMap[cmsRoom.room_key];

      return {
        ...cmsRoom,
        total_beds: backendRoom?.total_beds ?? 0,
        available_beds: backendRoom?.available_beds ?? 0,
        is_available: (backendRoom?.available_beds ?? 0) > 0,
      };
    });
  }, [cmsRooms, availabilityRooms]);

  useEffect(() => {
    if (!selectedRoomFromQuery || !mergedRooms.length) return;

    const room = mergedRooms.find(
      (r) => r.room_key === selectedRoomFromQuery
    );

    if (!room || !room.is_available) return;
    setBookingSummary((prev) => ({
      ...prev,
      dailyRent: room.base_price,
      securityDeposit: room.base_price,
      roomType: room.room_name,
    }));


    setFormData((prev) => ({
      ...prev,
      roomSelection: room.room_key,
      amount: room.base_price,
    }));
  }, [selectedRoomFromQuery, mergedRooms]);

  useEffect(() => {
    if (
      !formData.checkIn ||
      !formData.checkOut ||
      !formData.roomSelection
    )
      return;

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);

    if (isNaN(checkIn) || isNaN(checkOut)) return;

    const diffDays = Math.ceil(
      (checkOut - checkIn) / (1000 * 60 * 60 * 24)
    );

    const room = mergedRooms.find(
      (r) => r.room_key === formData.roomSelection
    );

    if (!room) return;

    const rentAmount = room.base_price * diffDays;
    const securityDeposit = room.base_price;

    setBookingSummary({
      roomType: room.room_name,
      dailyRent: room.base_price,
      securityDeposit,
      days: diffDays,
      totalAmount: rentAmount,
    });

    setFormData((prev) => ({
      ...prev,
      amount: rentAmount + securityDeposit,
    }));

  }, [
    formData.checkIn,
    formData.checkOut,
    formData.roomSelection,
    mergedRooms,
  ]);

  const validateDates = () => {
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);

    if (checkOut <= checkIn) {
      toast({
        title: "Invalid dates",
        description: "Checkout must be at least 1 day after check-in",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.gender) {
      toast({
        title: "Incomplete details",
        description: "Please fill in all required fields to continue.",
        variant: "destructive",
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return false;
    }

    if (!validateDates()) return false;
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateDates()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>
      <Toaster />

      <main className="flex-grow py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Book Your Accommodation
              </h1>
              <div className="hidden md:flex items-center space-x-2">
                <div
                  className={`h-2 w-12 rounded-full ${currentStep >= 1 ? "bg-[var(--primary)]" : "bg-gray-200"
                    }`}
                ></div>
                <div
                  className={`h-2 w-12 rounded-full ${currentStep >= 2 ? "bg-[var(--primary)]" : "bg-gray-200"
                    }`}
                ></div>
              </div>
            </div>
            <div className="text-gray-600 mt-2 flex items-center">
              <span className="font-medium">Step {currentStep} of 2:</span>
              <span className="ml-2">
                {currentStep === 1
                  ? "Select Dates" : "Personal Details & Payment"}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <form>
                {/* Step 1: Date Selection */}
                {currentStep === 1 && (
                  <Card className="mb-6 border-purple-200 shadow-md">
                    <CardHeader className="bg-[var(--hero-grad-start)] rounded-t-xl border-b border-purple-100">
                      <CardTitle className="flex items-center gap-2 text-purple-900">
                        <Calendar className="w-5 h-5 text-[var(--primary)]" />
                        Select Your Stay Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 p-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="checkIn"
                            className="text-gray-700 font-medium"
                          >
                            Check-in Date
                          </Label>
                          <div className="relative">
                            <Input
                              id="checkIn"
                              name="checkIn"
                              type="date"
                              value={formData.checkIn}
                              onChange={handleInputChange}
                              required
                              min={new Date().toISOString().split("T")[0]}
                              className="pl-10 border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                            />
                            <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="checkOut"
                            className="text-gray-700 font-medium"
                          >
                            Check-out Date
                          </Label>
                          <Input
                            id="checkOut"
                            name="checkOut"
                            type="date"
                            value={formData.checkOut}
                            onChange={handleInputChange}
                            required
                            min={
                              formData.checkIn
                                ? new Date(
                                  new Date(formData.checkIn).setDate(
                                    new Date(formData.checkIn).getDate() + 1
                                  )
                                )
                                  .toISOString()
                                  .split("T")[0]
                                : new Date().toISOString().split("T")[0]
                            }
                            className="pl-10 border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                          />

                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
                        >
                          Continue to Room Selection{" "}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}



                {/* Step 2: Personal Details */}
                {currentStep === 2 && (
                  <Card className="mb-6 border-purple-200 shadow-md">
                    <CardHeader className="bg-purple-50 border-b rounded-t-xl border-purple-100">
                      <CardTitle className="flex items-center gap-2 text-purple-900">
                        <User className="w-5 h-5 text-purple-600" />
                        Enter Your Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 p-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="name"
                            className="text-gray-700 font-medium"
                          >
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                            placeholder="Krishna Gupta"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="gender"
                            className="text-gray-700 font-medium"
                          >
                            Gender
                          </Label>
                          <Select
                            name="gender"
                            value={formData.gender}
                            onValueChange={(value) =>
                              handleInputChange({
                                target: { name: "gender", value },
                              })
                            }
                          >
                            <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="email"
                            className="text-gray-700 font-medium"
                          >
                            Email Address
                          </Label>
                          <div className="relative">
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="pl-10 border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                              placeholder="krsna@traveltribe.com"
                            />
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="phone"
                            className="text-gray-700 font-medium"
                          >
                            Phone Number
                          </Label>
                          <div className="relative">
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              pattern="[0-9]{10}"
                              maxLength={10}
                              className="pl-10 border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                              placeholder="10-digit number"
                            />
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center mb-4">
                          <CreditCard className="w-5 h-5 text-purple-600 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900">
                            Payment Details
                          </h3>
                        </div>

                        <div className="flex justify-between space-x-4">
                          <Button
                            type="button"
                            onClick={prevStep}
                            variant="outline"
                            className="border-purple-200 text-[var(--primary)] hover:bg-purple-50"
                          >
                            Back to Date Selection
                          </Button>

                          <RazorPayPayment
                            hostelId={id}
                            formData={formData}
                            validateForm={validateForm}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </form>
            </div>

            {/* Booking Summary - Always visible */}
            <div className="md:col-span-1">
              <Card className="sticky top-24 border-purple-200 shadow-md overflow-hidden">
                <CardHeader className="bg-black text-white py-4 px-5">
                  <CardTitle className="flex items-center gap-2 text-white">
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 bg-gradient-to-b from-purple-50 to-white">
                  {formData.roomSelection ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Type</span>
                        <span className="font-medium text-black">
                          {bookingSummary.roomType}
                        </span>
                      </div>

                      {formData.checkIn && formData.checkOut && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium text-black">
                            {bookingSummary.days}{" "} Day
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily Rent</span>
                        <span className="font-medium text-black">
                          ₹{bookingSummary.dailyRent}
                        </span>
                      </div>

                      {bookingSummary.days > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Rent</span>
                          <span className="font-medium text-black">
                            ₹ {bookingSummary.totalAmount}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600">Security Deposit</span>
                        <span className="font-medium text-black">
                          ₹{bookingSummary.securityDeposit}
                        </span>
                      </div>

                      <div className="pt-3 mt-3 border-t border-purple-200">
                        <div className="flex justify-between font-bold">
                          <span className="text-[var(--primary)] ">Total Amount</span>
                          <span className="text-[var(--primary-active)] text-lg">
                            ₹{bookingSummary?.totalAmount + bookingSummary?.securityDeposit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <BedDouble className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Select room and dates to see your booking summary
                      </p>
                    </div>
                  )}

                  <Alert className="bg-purple-50 mt-3 mb-3 border-purple-200 shadow-lg">
                    <AlertCircle className="h-4 w-4 text-[var(--primary)]" />
                    <AlertDescription className="text-gray-800 text-sm">
                      Security deposit is refundable at checkout after deducting
                      any damages.
                    </AlertDescription>
                  </Alert>

                  {formData.checkIn &&
                    formData.checkOut &&
                    formData.roomSelection && (
                      <div className="bg-black text-white p-4 -mx-5 -mb-5 ">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">
                            Check-in
                          </span>
                          <span className="text-sm text-gray-300">
                            Check-out
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">
                            {new Date(formData.checkIn).toLocaleDateString(
                              "en-US",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                          <span className="text-purple-300">→</span>
                          <span className="font-bold">
                            {new Date(formData.checkOut).toLocaleDateString(
                              "en-US",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
