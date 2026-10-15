import React, { useEffect, useMemo, useState, useContext } from "react";
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
  ChevronLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import RazorPayPayment from "@/components/RazorPayPayment";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { fetchEntryById } from "@/contentstack/utils";
import { trackEvent } from "@/Lytics/config";
import { LyticsContext } from "@/context/LyticsContext";

const today = () => new Date().toISOString().split("T")[0];
const addDays = (iso, n) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const formatShortDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })
    : "—";

export default function HostelBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedRoomFromQuery = searchParams.get("room");

  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useContext(LyticsContext);

  const [cmsRooms, setCmsRooms] = useState([]);
  const [hostel, setHostel] = useState(null);
  const [loadingHostel, setLoadingHostel] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasTrackedBookingStarted, setHasTrackedBookingStarted] = useState(false);

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

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        setLoadingHostel(true);

        const entry = await fetchEntryById(
          "hostel",
          id,
          import.meta.env.VITE_SDK,
          null,
        );

        if (!entry) {
          throw new Error("Hostel not found");
        }

        setHostel(entry);
        setCmsRooms(entry.room_types || []);
      } catch (err) {
        console.error("[BookHostel] Failed to load hostel:", err);
        toast({
          title: "Failed to load hostel data",
          description: err.message || "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoadingHostel(false);
      }
    };

    fetchHostel();

    trackEvent("booking_page_viewed", {
      hostel_id: id,
      email: user?.email || null,
      name: user?.name || null,
    });
  }, [id, user?.email, user?.name, toast]);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: user.name || prev.name,
      email: user.email || prev.email,
      phone: user.phone || profile?.user?.phone || prev.phone || "",
      gender: user?.gender || profile?.user?.gender || prev.gender || "",
    }));
  }, [user, profile]);

  const selectedRoom = useMemo(
    () => cmsRooms.find((r) => r.room_key === selectedRoomFromQuery),
    [cmsRooms, selectedRoomFromQuery]
  );

  useEffect(() => {
    if (!selectedRoom) return;
    setFormData((prev) => ({
      ...prev,
      roomSelection: selectedRoom.room_key,
    }));
  }, [selectedRoom]);

  const stay = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut || !selectedRoom) {
      return { days: 0, rentAmount: 0, securityDeposit: 0, total: 0 };
    }

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    if (isNaN(checkIn) || isNaN(checkOut)) {
      return { days: 0, rentAmount: 0, securityDeposit: 0, total: 0 };
    }

    const days = Math.max(0, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const dailyRent = Math.round(Number(selectedRoom.base_price) || 0);
    const rentAmount = dailyRent * days;
    const securityDeposit = dailyRent;
    const total = rentAmount + securityDeposit;

    return { days, dailyRent, rentAmount, securityDeposit, total };
  }, [formData.checkIn, formData.checkOut, selectedRoom]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, amount: stay.total }));
  }, [stay.total]);

  const validateDates = () => {
    if (!formData.checkIn || !formData.checkOut) {
      toast({
        title: "Dates required",
        description: "Select both check-in and check-out dates.",
        variant: "destructive",
      });
      return false;
    }
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      toast({
        title: "Invalid dates",
        description: "Check-out must be at least 1 day after check-in.",
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
    const phoneRegex = /^\d{10}$/;

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
    if (!selectedRoom) {
      toast({
        title: "Room not selected",
        description: "Please pick a room before continuing.",
        variant: "destructive",
      });
      return false;
    }

    trackEvent("checkout_attempted", {
      hostel_id: id,
      room_type: formData.roomSelection,
      total_amount: formData.amount,
      email: formData.email,
      name: formData.name,
    });

    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateDates()) {
      if (!hasTrackedBookingStarted) {
        trackEvent("booking_started", {
          hostel_id: id,
          hostel_name: hostel?.title || "Unknown",
          room_type: selectedRoom?.room_name || "Unknown",
          total_amount: formData.amount || 0,
          check_in: formData.checkIn,
          check_out: formData.checkOut,
          email: formData.email,
          name: formData.name,
        });
        setHasTrackedBookingStarted(true);
      }
      setCurrentStep(2);
    }
  };

  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loadingHostel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-muted-soft text-text-muted">
        Loading hostel…
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-muted-soft px-6 text-center">
        <p className="text-xl font-semibold text-text-dark">Hostel not found</p>
        <Button onClick={() => navigate("/hostels")}>Back to hostels</Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-bg-muted-soft text-text-dark">
      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
        <Header />
      </div>
      <Toaster />

      <main className="flex-1 px-5 pb-32 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 flex flex-col gap-4 sm:mb-14">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-text-muted">
                  Booking
                </p>
                <h1 className="mt-1 text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-text-dark sm:text-[2.5rem]">
                  {hostel.title}
                </h1>
              </div>
              <p className="text-sm text-text-muted">
                Step {currentStep} of 2 —{" "}
                {currentStep === 1 ? "Dates" : "Details & Payment"}
              </p>
            </div>

            <div className="flex gap-2">
              {[1, 2].map((step) => (
                <span
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    currentStep >= step ? "bg-primary" : "bg-border-subtle"
                  }`}
                />
              ))}
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={(e) => e.preventDefault()}>
                {currentStep === 1 && (
                  <Card className="overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.06)]">
                    <CardHeader className="border-b border-border-subtle pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-text-dark">
                        <Calendar className="h-5 w-5 text-primary" />
                        Select your stay
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="checkIn">Check-in</Label>
                          <div className="relative">
                            <Input
                              id="checkIn"
                              name="checkIn"
                              type="date"
                              value={formData.checkIn}
                              onChange={handleInputChange}
                              min={today()}
                              className="h-11 rounded-full pl-10"
                              required
                            />
                            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="checkOut">Check-out</Label>
                          <div className="relative">
                            <Input
                              id="checkOut"
                              name="checkOut"
                              type="date"
                              value={formData.checkOut}
                              onChange={handleInputChange}
                              min={
                                formData.checkIn
                                  ? addDays(formData.checkIn, 1)
                                  : today()
                              }
                              className="h-11 rounded-full pl-10"
                              required
                            />
                            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="group h-11 rounded-full bg-primary px-6 text-[0.85rem] font-semibold text-on-primary shadow-md transition hover:bg-primary-hover"
                        >
                          Continue
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentStep === 2 && (
                  <Card className="overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.06)]">
                    <CardHeader className="border-b border-border-subtle pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-text-dark">
                        <User className="h-5 w-5 text-primary" />
                        Guest details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                            className="h-11 rounded-full"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            value={formData.gender}
                            onValueChange={(value) =>
                              handleInputChange({
                                target: { name: "gender", value },
                              })
                            }
                          >
                            <SelectTrigger className="h-11 rounded-full">
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

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="you@example.com"
                              className="h-11 rounded-full pl-10"
                              required
                            />
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <div className="relative">
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              inputMode="numeric"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="10-digit mobile"
                              maxLength={10}
                              pattern="\d{10}"
                              className="h-11 rounded-full pl-10"
                              required
                            />
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border-subtle pt-6">
                        <div className="mb-4 flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <h3 className="text-base font-semibold text-text-dark">
                            Payment
                          </h3>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className="h-11 rounded-full border-border-strong"
                          >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>

                          <RazorPayPayment
                            hostelId={id}
                            formData={formData}
                            hostelName={hostel?.title || "Unknown"}
                            roomType={selectedRoom?.room_name || "Unknown"}
                            validateForm={validateForm}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </form>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-[0_2px_20px_-8px_rgba(0,0,0,0.06)]">
                <CardHeader className="border-b border-border-subtle bg-primary/[0.04] pb-4">
                  <CardTitle className="text-base font-semibold text-text-dark">
                    Booking summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {selectedRoom ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Room</span>
                        <span className="font-medium text-text-dark">
                          {selectedRoom.room_name}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-text-muted">Nights</span>
                        <span className="font-medium text-text-dark">
                          {stay.days || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-text-muted">Daily rent</span>
                        <span className="font-medium text-text-dark">
                          ₹{stay.dailyRent || "—"}
                        </span>
                      </div>

                      {stay.days > 0 && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Rent total</span>
                          <span className="font-medium text-text-dark">
                            ₹{stay.rentAmount}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-text-muted">Security deposit</span>
                        <span className="font-medium text-text-dark">
                          ₹{stay.securityDeposit || "—"}
                        </span>
                      </div>

                      <div className="mt-3 border-t border-border-subtle pt-3">
                        <div className="flex justify-between text-base font-semibold">
                          <span className="text-text-dark">Total</span>
                          <span className="text-primary">
                            ₹{stay.total || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <BedDouble className="h-10 w-10 text-primary/40" />
                      <p className="text-sm text-text-muted">
                        Select a room to see your summary
                      </p>
                    </div>
                  )}

                  <Alert className="mt-4 rounded-2xl border-primary/20 bg-primary/[0.05]">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-[0.78rem] leading-relaxed text-text-dark">
                      Security deposit is refundable at checkout after deducting
                      any damages.
                    </AlertDescription>
                  </Alert>

                  {formData.checkIn && formData.checkOut && (
                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-text-dark p-4 text-white">
                      <div className="text-center">
                        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/60">
                          Check-in
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {formatShortDate(formData.checkIn)}
                        </p>
                      </div>
                      <span className="text-primary">→</span>
                      <div className="text-center">
                        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/60">
                          Check-out
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {formatShortDate(formData.checkOut)}
                        </p>
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