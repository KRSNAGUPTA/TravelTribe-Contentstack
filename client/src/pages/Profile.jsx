import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import api from "@/api";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  LucideAppWindow,
  Mail,
  Phone,
  User,
  Calendar,
  BadgeIndianRupee,
  Clock,
  BedDouble,
  Building,
  Edit,
  ReceiptIndianRupee,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import {
  fetchEntryById,
  setDataForChromeExtension,
} from "@/contentstack/utils";
import { Eye } from "lucide-react";
import { Ellipsis } from "lucide-react";
import { EllipsisVertical } from "lucide-react";
import { AlertCircle } from "lucide-react";
import BookingReceipt from "@/components/BookingReceipt";
import { Download } from "lucide-react";
import { generateBookingPDF } from "@/lib/printPdf";

export default function ProfilePage() {
  const [userData, setUserData] = useState({});
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    isPasswordChanged: false,
  });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const data = {
    entryUid: "bltc76b51f6a5d5e5e2",
    contenttype: "profile_page",
    locale: import.meta.env.VITE_CS_LOCALE,
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = await fetchEntryById(
          data.contenttype,
          data.entryUid,
          import.meta.env.VITE_SDK,
          null,
        );
        setProfileData(entry);
        if (entry?.page_title) document.title = entry.page_title;
      } catch (error) {
        console.error("Error fetching profile page data", error);
      }
    };
    onEntryChange(fetchData);
    setDataForChromeExtension(data);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await api.get("/api/user/profile");
        setUserData(userRes.data.userData);
        const bookingRes = await api.get("/api/booking/my-bookings");
        setBookings(bookingRes.data || []);
      } catch (error) {
        console.error("Error fetching user profile or bookings:", error);
      }
    };
    fetchUserData();
  }, []);

  const filteredBookings = bookings.filter(
    (booking) => statusFilter === "all" || booking.status === statusFilter,
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };
  const handleProfileUpdate = async () => {
    try {
      const updatedFields = Object.fromEntries(
        Object.entries(formData).filter(
          ([key, value]) =>
            key !== "isPasswordChanged" && value !== "" && value !== "*******",
        ),
      );

      if (!formData.isPasswordChanged) {
        delete updatedFields.password;
      }

      if (Object.keys(updatedFields).length > 0) {
        const res = await api.patch("/api/user/update", updatedFields);
        toast({
          title: "Profile updated successfully",
        });

        const userRes = await api.get("/api/user/profile");
        setUserData(userRes.data.userData);

        setFormData((prev) => ({
          ...prev,
          password: "*******",
          isPasswordChanged: false,
        }));
      }
    } catch (error) {
      toast({
        title: error.message || "Failed to update",
        description: "Please retry to update profile",
        variant: "destructive",
      });
    }
  };
  const handleValueChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
      ...(id === "password" && value !== "*******"
        ? { isPasswordChanged: true }
        : {}),
    }));
  };

  const handleDownloadClick = async (booking) => {
    setSelectedBooking(booking);
    setIsGenerating(true);

    // Wait for component to render
    setTimeout(async () => {
      await generateBookingPDF(booking);
      setIsGenerating(false);
      setSelectedBooking(null);
    }, 300);
  };

  if (!userData || !profileData) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--hero-grad-start)] via-white to-[var(--hero-grad-end)]">
      <Toaster />

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
        <Header />
      </div>

      <section className="pt-20 pb-28 px-6 text-center">
        <Avatar className="w-28 h-28 md:w-36 md:h-36 mx-auto border-4 bg-[var(--accent)]  shadow-xl">
          {/* {console.log(userData)} */}
          <AvatarImage
            src={userData?.avatar || "/icon.png"}
            draggable="false"
          />
          <AvatarFallback className="bg-[var(--accent)] text-[var(--primary)] text-3xl">
            {userData?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">
          {userData?.name}
        </h1>
      </section>

      <section className="px-4 md:px-10 pb-16">
        <Card className="max-w-4xl mx-auto rounded-2xl border border-purple-100 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80 rounded-xl">
                  <div className="space-y-3">
                    <Input
                      id="name"
                      defaultValue={userData?.name}
                      onChange={handleValueChange}
                      placeholder="Name"
                    />
                    <Input
                      id="phone"
                      defaultValue={userData?.phone}
                      onChange={handleValueChange}
                      placeholder="Phone"
                    />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={handleValueChange}
                      placeholder="New password"
                    />
                    <Button
                      onClick={handleProfileUpdate}
                      className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-md  "
                    >
                      Update
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <Mail className="w-4 text-purple-600" />
                <span>{userData.email}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 text-purple-600" />
                <span>{userData.phone || "NA"}</span>
              </div>

              <div className="flex items-center gap-3">
                <LucideAppWindow className="w-4 text-purple-600" />
                <span>
                  Joined {new Date(userData.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="px-4 md:px-10 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {profileData?.booking_label}
            </h2>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-52 rounded-full">
                <SelectValue placeholder="Filter bookings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bookings.length === 0 ? (
            <Card className="p-8 text-center rounded-xl">
              <p className="text-gray-500">{profileData?.no_booking_text}</p>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--accent)] bg-white shadow">
              <Table>
                <TableHeader className="bg-[var(--accent)] ">
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow
                      key={booking.receiptId}
                      className="hover:bg-[var(--accent)]  transition"
                    >
                      <TableCell>{booking.receiptId}</TableCell>
                      <TableCell>{booking.hostelId}</TableCell>
                      <TableCell>{booking.roomSelection}</TableCell>
                      <TableCell>
                        {new Date(booking.checkInDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.checkOutDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{booking.amount}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status,
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <EllipsisVertical className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadClick(booking)}
                            >
                              <Download className="w-4 h-4" />
                              Download PDF
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>

      {selectedBooking && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-100">
          <div className="flex items-center justify-center h-full">
            <BookingReceipt booking={selectedBooking} userData={userData} isGenerating={isGenerating} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
