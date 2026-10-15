import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import api from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Phone,
  Calendar,
  Edit,
  Download,
  EllipsisVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BookingReceipt from "@/components/BookingReceipt";
import { generateBookingPDF } from "@/lib/printPdf";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
};

const PAGE_TEXT = {
  pageTitle: "Your profile · TravelTribe",
  welcomeLabel: "Welcome back",
  title: "Your profile",
  subtitle: "Manage your details and bookings in one place.",
  editButton: "Edit profile",
  saveButton: "Save changes",
  bookingLabel: "My bookings",
  noBookingText: "No bookings found.",
};

const PHONE_RE = /^\d{10}$/;

const passwordChecks = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /\d/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
});

function CheckItem({ label, ok }) {
  return (
    <li
      className={`flex items-center gap-1.5 text-[0.68rem] transition ${
        ok ? "text-emerald-600" : "text-ink-muted"
      }`}
    >
      <span
        className={`inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-[0.6rem] ${
          ok ? "bg-emerald-500 text-white" : "bg-border-strong/50 text-transparent"
        }`}
      >
        ✓
      </span>
      <span>{label}</span>
    </li>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, isInitializing } = useAuth();

  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    document.title = PAGE_TEXT.pageTitle;
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const fetchUserData = async () => {
      try {
        const userRes = await api.get("/api/user/profile");
        const resolved = userRes.data.userData || userRes.data;
        setUserData(resolved);
        setFormData({
          name: resolved?.name || "",
          phone: resolved?.phone || "",
          password: "",
        });

        const bookingRes = await api.get("/api/booking/my-bookings");
        setBookings(bookingRes.data || []);
      } catch (error) {
        console.error("Error fetching user profile or bookings:", error);
      }
    };

    fetchUserData();
  }, [isInitializing]);

  const filteredBookings = bookings.filter(
    (booking) => statusFilter === "all" || booking.status === statusFilter
  );

  const getStatusColor = (status) =>
    STATUS_STYLES[status] || "bg-paper-tint text-ink-muted border-hairline";

  const validateProfile = () => {
    const errs = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Please enter your full name";
    }

    if (formData.phone && !PHONE_RE.test(formData.phone)) {
      errs.phone = "Phone must be exactly 10 digits";
    }

    if (formData.password) {
      const checks = passwordChecks(formData.password);
      const allOk = Object.values(checks).every(Boolean);
      if (!allOk) {
        errs.password = "Password doesn't meet all requirements";
      }
    }

    return errs;
  };

  const handleProfileUpdate = async () => {
    const errs = validateProfile();
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSavingProfile(true);

      const updatedFields = {};
      if (formData.name.trim() && formData.name.trim() !== userData?.name) {
        updatedFields.name = formData.name.trim();
      }
      if (formData.phone && formData.phone !== userData?.phone) {
        updatedFields.phone = formData.phone;
      }
      if (formData.password) {
        updatedFields.password = formData.password;
      }

      if (Object.keys(updatedFields).length === 0) {
        setEditOpen(false);
        return;
      }

      await api.patch("/api/user/update", updatedFields);
      toast({ title: "Profile updated successfully" });

      const userRes = await api.get("/api/user/profile");
      const resolved = userRes.data.userData || userRes.data;
      setUserData(resolved);
      setFormData({
        name: resolved?.name || "",
        phone: resolved?.phone || "",
        password: "",
      });
      setEditErrors({});
      setShowPassword(false);
      setEditOpen(false);
    } catch (error) {
      toast({
        title: error?.response?.data?.message || "Failed to update",
        description: "Please retry to update profile",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleValueChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (editErrors[id]) {
      setEditErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  const handleOpenChange = (open) => {
    setEditOpen(open);
    if (open) {
      setFormData({
        name: userData?.name || "",
        phone: userData?.phone || "",
        password: "",
      });
      setEditErrors({});
      setShowPassword(false);
    }
  };

  const handleDownloadClick = async (booking) => {
    setSelectedBooking(booking);
    setIsGenerating(true);
    setTimeout(async () => {
      await generateBookingPDF(booking);
      setIsGenerating(false);
      setSelectedBooking(null);
    }, 300);
  };

  const handleHostelClick = (hostelId) => {
    if (!hostelId) return;
    navigate(`/hostel/${hostelId}`);
  };

  if (isInitializing || !userData) return <Loading />;

  const initial = userData?.name?.charAt(0)?.toUpperCase() || "U";
  const joinedDate = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const pwChecks = passwordChecks(formData.password);
  const pwAllValid = Object.values(pwChecks).every(Boolean);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-paper text-ink">
      <Toaster />

      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <Header />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary) / 0.22) 1.3px, transparent 1.4px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 30%, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 30%, black 0%, black 55%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(600px circle at 0% 0%, hsl(var(--primary) / 0.06), transparent 60%), radial-gradient(600px circle at 100% 100%, hsl(var(--accent) / 0.08), transparent 60%)",
        }}
      />

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-5 pb-32 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <section className="mb-10 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-left">
          <Avatar className="h-20 w-20 border-4 border-white bg-primary/10 shadow-lg sm:h-24 sm:w-24">
            {userData?.avatar && (
              <AvatarImage
                src={userData.avatar}
                alt={userData?.name || "User Avatar"}
                draggable="false"
              />
            )}
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary sm:text-3xl">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="mb-1 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent-ink">
              {PAGE_TEXT.welcomeLabel}
            </p>
            <h1 className="text-[1.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[2.25rem]">
              {userData?.name || "Traveler"}
            </h1>
            <p className="mt-1.5 text-[0.88rem] font-light text-ink-muted">
              {PAGE_TEXT.subtitle}
            </p>
          </div>

          <Popover open={editOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button className="h-10 rounded-full bg-primary px-5 text-[0.82rem] font-semibold text-on-primary shadow-md transition hover:bg-primary-hover">
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                {PAGE_TEXT.editButton}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-[22rem] rounded-3xl border border-hairline bg-white p-5 shadow-[0_20px_60px_-15px_var(--card-shadow-hover)]"
            >
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="sr-only">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleValueChange}
                    placeholder="Name"
                    className={`h-11 rounded-full ${
                      editErrors.name
                        ? "border-destructive focus-visible:ring-destructive/40"
                        : ""
                    }`}
                    autoComplete="name"
                  />
                  {editErrors.name && (
                    <p className="mt-1 pl-4 text-xs text-destructive">
                      {editErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="sr-only">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData((prev) => ({ ...prev, phone: digits }));
                      if (editErrors.phone) {
                        setEditErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    placeholder="Phone (10 digits)"
                    className={`h-11 rounded-full ${
                      editErrors.phone
                        ? "border-destructive focus-visible:ring-destructive/40"
                        : ""
                    }`}
                    autoComplete="tel"
                  />
                  {editErrors.phone && (
                    <p className="mt-1 pl-4 text-xs text-destructive">
                      {editErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="sr-only">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleValueChange}
                      placeholder="New password (leave blank to keep)"
                      className={`h-11 rounded-full pr-11 ${
                        editErrors.password
                          ? "border-destructive focus-visible:ring-destructive/40"
                          : ""
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted transition hover:bg-primary/10 hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {formData.password.length > 0 && (
                    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 pl-1">
                      <CheckItem label="8+ chars" ok={pwChecks.length} />
                      <CheckItem label="Uppercase" ok={pwChecks.upper} />
                      <CheckItem label="Lowercase" ok={pwChecks.lower} />
                      <CheckItem label="Number" ok={pwChecks.number} />
                      <CheckItem label="Special char" ok={pwChecks.special} />
                    </ul>
                  )}

                  {editErrors.password && (
                    <p className="mt-1 pl-4 text-xs text-destructive">
                      {editErrors.password}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleProfileUpdate}
                  disabled={savingProfile}
                  className="h-11 w-full rounded-full bg-primary font-semibold text-on-primary shadow-md transition hover:bg-primary-hover disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : PAGE_TEXT.saveButton}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </section>

        <section className="mb-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoTile icon={Mail} label="Email" value={userData?.email || "—"} />
            <InfoTile
              icon={Phone}
              label="Phone"
              value={userData?.phone || "Not added"}
            />
            <InfoTile icon={Calendar} label="Joined" value={joinedDate} />
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-ink sm:text-[1.5rem]">
                {PAGE_TEXT.bookingLabel}
              </h2>
              <p className="mt-1 text-[0.82rem] font-light text-ink-muted">
                {bookings.length} total
                {statusFilter !== "all" && ` · filtered by ${statusFilter}`}
              </p>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full rounded-full border-input px-5 text-left sm:w-52">
                <SelectValue placeholder="Filter bookings" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bookings.length === 0 ? (
            <Card className="rounded-3xl border border-hairline bg-white p-10 text-center shadow-[0_20px_60px_-15px_var(--card-shadow-hover)]">
              <p className="text-[0.9rem] text-ink-muted">
                {PAGE_TEXT.noBookingText}
              </p>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-[0_20px_60px_-15px_var(--card-shadow-hover)]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-hairline bg-paper/50 hover:bg-paper/50">
                      <TableHead className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        Receipt
                      </TableHead>
                      <TableHead className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        Hostel
                      </TableHead>
                      <TableHead className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        Room
                      </TableHead>
                      <TableHead className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        Check-in
                      </TableHead>
                      <TableHead className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        Check-out
                      </TableHead>
                      <TableHead className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        Amount
                      </TableHead>
                      <TableHead className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                        Status
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow
                        key={booking.receiptId}
                        className="border-hairline transition hover:bg-paper/40"
                      >
                        <TableCell className="font-mono text-[0.78rem] text-ink-muted">
                          {booking.receiptId}
                        </TableCell>
                        <TableCell className="font-medium text-ink">
                          <button
                            type="button"
                            onClick={() => handleHostelClick(booking.hostelId)}
                            className="text-left transition-colors hover:text-primary hover:underline underline-offset-2"
                          >
                            {booking.hostelId}
                          </button>
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {booking.roomSelection}
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {new Date(booking.checkInDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {new Date(booking.checkOutDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-ink">
                          ₹{booking.amount}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium capitalize ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-full p-0 hover:bg-primary/10 hover:text-primary"
                              >
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="end"
                              className="w-44 rounded-2xl border border-hairline p-1.5"
                            >
                              <button
                                type="button"
                                onClick={() => handleDownloadClick(booking)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[0.82rem] text-ink transition hover:bg-primary/10 hover:text-primary"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download PDF
                              </button>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </section>
      </main>

      {selectedBooking && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <BookingReceipt
              booking={selectedBooking}
              userData={userData}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-hairline bg-white px-5 py-4 shadow-[0_2px_12px_-6px_var(--card-shadow-hover)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          {label}
        </p>
        <p className="truncate text-[0.88rem] font-medium text-ink">
          {value}
        </p>
      </div>
    </div>
  );
}