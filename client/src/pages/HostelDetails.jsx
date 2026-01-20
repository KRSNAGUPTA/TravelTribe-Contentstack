import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  MapPin,
  Utensils,
  ShieldCheck,
  Home,
  Wifi,
  ParkingCircle,
  Share2,
  Star,
  User,
  Calendar,
  Clock,
  Music,
  Sparkles,
  Coffee,
  AlignVerticalJustifyCenterIcon,
  BookOpen,
  School,
  Bed,
  Phone,
  Mail,
  ChevronRight,
  Landmark,
  Building,
  Zap,
  ShowerHead,
  Tv,
  UtensilsCrossed,
  Bike,
  GraduationCap,
  Footprints,
  HeartPulse,
  BellRing,
  Contact,
  AudioWaveform,
  Check,
  CircleCheck,
  Mars,
  Venus,
  VenusAndMars,
  BedSingle,
  Cctv,
  Droplets,
  LockKeyhole,
  Accessibility,
  Flame,
  Snowflake,
  Fan,
  WashingMachine,
  BatteryCharging,
  Users,
  CookingPot,
  Microwave,
  House,
  TvMinimalPlayIcon,
} from "lucide-react";
import Autoplay from "embla-carousel-autoplay"
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import api from "@/api";
import { toast } from "@/hooks/use-toast";
import Loading from "./Loading";
import { Toaster } from "@/components/ui/toaster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import cmsClient from "@/contentstackClient";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function HostelDetails() {
  const { id } = useParams();
  const [hostel, setHostel] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cmsRes = await cmsClient.get(`/content_types/hostel/entries/${id}`);
        const apiRes = await api.get(`/api/hostel/${id}`);

        setHostel(cmsRes.data.entry);
        setRoomAvailability(apiRes.data);
        setReviews(apiRes.data.reviews || []);
      } catch (error) {
        console.error("Error fetching hostel data:", error);
        setHostel(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);


  const mergedRooms = useMemo(() => {
    if (!hostel?.room_types || !roomAvailability?.room_types) return [];

    const apiRoomMap = roomAvailability.room_types.reduce((acc, room) => {
      acc[room.room_key] = room;
      return acc;
    }, {});

    return hostel.room_types.map((cmsRoom) => {
      const apiRoom = apiRoomMap[cmsRoom.room_key];

      return {
        ...cmsRoom,
        total_beds: apiRoom?.total_beds ?? 0,
        available_beds: apiRoom?.available_beds ?? 0,
        is_available: (apiRoom?.available_beds ?? 0) > 0,
      };
    });
  }, [hostel, roomAvailability]);


  useEffect(() => {
    document.title = `${hostel?.title} | Travel Tribe`
  }, [hostel])

  const navigate = useNavigate();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hostel?.title,
          text: `Check out ${hostel?.title} in ${hostel?.address}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  if (!hostel && !loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Hostel not found</p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  const base = "w-5 h-5";

  const FACILITY_MAP = {
    wifi: {
      label: "Free Wi-Fi",
      icon: <Wifi className={`${base} text-sky-500`} />,
    },
    parking: {
      label: "Parking",
      icon: <ParkingCircle className={`${base} text-slate-500`} />,
    },
    cctv: {
      label: "CCTV Surveillance",
      icon: <Cctv className={`${base} text-indigo-500`} />,
    },
    security_guard: {
      label: "24×7 Security",
      icon: <ShieldCheck className={`${base} text-emerald-600`} />,
    },
    drinking_water: {
      label: "Drinking Water",
      icon: <Droplets className={`${base} text-blue-500`} />,
    },
    lockers: {
      label: "Lockers",
      icon: <LockKeyhole className={`${base} text-gray-600`} />,
    },
    wheelchair_access: {
      label: "Wheelchair Access",
      icon: <Accessibility className={`${base} text-teal-600`} />,
    },
    fire_safety: {
      label: "Fire Safety",
      icon: <Flame className={`${base} text-amber-500`} />,
    },
    first_aid: {
      label: "First Aid",
      icon: <HeartPulse className={`${base} text-rose-500`} />,
    },
    ac: {
      label: "Air Conditioner",
      icon: <Snowflake className={`${base} text-cyan-500`} />,
    },
    "non-ac": {
      label: "Non-AC Room",
      icon: <Fan className={`${base} text-neutral-500`} />,
    },
    hot_water: {
      label: "Hot Water",
      icon: <ShowerHead className={`${base} text-orange-500`} />,
    },
    laundry: {
      label: "Laundry",
      icon: <WashingMachine className={`${base} text-indigo-400`} />,
    },
    power_backup: {
      label: "Power Backup",
      icon: <BatteryCharging className={`${base} text-lime-600`} />,
    },
    housekeeping: {
      label: "Housekeeping",
      icon: <House className={`${base} text-emerald-500`} />,
    },
    study_area: {
      label: "Study Area",
      icon: <BookOpen className={`${base} text-violet-500`} />,
    },
    tv: {
      label: "Television",
      icon: <TvMinimalPlayIcon className={`${base} text-fuchsia-500`} />,
    },
    common_area: {
      label: "Common Area",
      icon: <Users className={`${base} text-purple-500`} />,
    },
    kitchen: {
      label: "Kitchen",
      icon: <CookingPot className={`${base} text-amber-600`} />,
    },
    microwave: {
      label: "Microwave",
      icon: <Microwave className={`${base} text-pink-500`} />,
    },
  };


  const HOSTEL_TYPE_MAP = {
    Boys: {
      label: "Boys Only",
      icon: Mars,
      color: "text-blue-600",
    },
    Girls: {
      label: "Girls Only",
      icon: Venus,
      color: "text-pink-600",
    },
    Unisex: {
      label: "Unisex",
      icon: VenusAndMars,
      color: "text-purple-600",
    },
  };


  const minRoom = hostel.room_types.reduce((min, room) =>
    room.base_price < min.base_price ? room : min
  );

  const minPrice = minRoom.base_price;
  const minRoomType = minRoom.room_key;


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Header />
        </div>
        <div className="max-w-5xl mx-auto p-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {hostel?.title}
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                <p className="max-w-lg">{hostel?.address}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-full bg-[var(--hero-grad-start)] hover:bg-[var(--primary)] hover:text-white transition-all duration-500 ease-in-out"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Carousel with navigation */}
          <div className="relative mb-8 rounded-xl overflow-hidden bg-black/5">
            <Carousel
              plugins={[plugin.current]}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {hostel?.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-64 sm:h-96 w-full">
                      <img
                        src={image?.url}
                        alt={`${hostel?.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="details" className="mb-8">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="facilities">Facilities</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Hostel Information */}
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <Building className="w-5 h-5 text-purple-500" />
                        Hostel Information
                      </h3>

                      <div className="rounded-xl bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
                        {hostel?.type && HOSTEL_TYPE_MAP[hostel.type] && (() => {
                          const { icon: Icon, label, color } = HOSTEL_TYPE_MAP[hostel.type];

                          return (
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${color}`} />
                              <span className="font-medium">Type:</span>
                              <span>{label}</span>
                            </div>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <Contact className="w-5 h-5 text-purple-500" />
                        Contact Information
                      </h3>

                      <div className="rounded-xl bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
                        {hostel?.contact?.name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-black" />
                            <span className="font-medium">Name:</span>
                            <span>{hostel.contact.name}</span>
                          </div>
                        )}

                        {hostel?.contact?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-black" />
                            <span className="font-medium">Phone:</span>
                            <span> +91 {hostel.contact.phone}</span>
                          </div>
                        )}

                        {hostel?.contact?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-black" />
                            <span className="font-medium">Email:</span>
                            <span>{hostel.contact.email}</span>
                          </div>
                        )}

                        {hostel?.google_map_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-fit flex items-center gap-2 rounded-full"
                            onClick={() => window.open(hostel.google_map_link, "_blank")}
                          >
                            <MapPin className="w-4 h-4 text-purple-600" />
                            View on  Maps
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>


              {hostel?.nearby_college && hostel?.nearby_college.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <GraduationCap className="w-5 h-5 text-blue-500 mr-2" />
                      Nearby Colleges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hostel?.nearby_college ? hostel.nearby_college.map((college, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg transition-all hover:bg-blue-100"
                        >
                          <School className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-blue-800 font-medium">
                            {college}
                          </span>
                        </div>
                      )
                      ) : "No Nearby College Available"}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-orange-500" />
                    Food & Meals
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {hostel.food_info?.available ? (
                    <div className="rounded-xl border border-green-100 bg-green-50/50 p-4 space-y-4">

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                          <CircleCheck className="w-4 h-4 text-green-500" />
                          Food Available
                        </div>

                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Optional
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid gap-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Type:</span>
                          <span>{hostel.food_info.food_type.join(", ")}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">Meals:</span>
                          <span>{hostel.food_info.meals.join(", ")}</span>
                        </div>

                        {hostel.food_info.extra_cost && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Extra Cost:</span>
                            <span className="text-gray-900">
                              ₹{hostel.food_info.extra_cost} / day
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {hostel.food_info.notes && (
                        <div className="text-xs text-gray-500 border-t pt-2">
                          {hostel.food_info.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
                      <UtensilsCrossed className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Food not available</p>
                        <p className="text-xs text-gray-500">
                          Residents need to arrange meals independently
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>


              </Card>


              {hostel?.house_rules?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShieldCheck className="w-5 h-5 text-red-500" />
                      House Rules
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                        {hostel.house_rules.map((rule, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                          >
                            <ChevronRight className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            {/* Rooms Tab */}
            <TabsContent value="rooms" className="space-y-6">
              {mergedRooms.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mergedRooms.map((room) => (
                    <Card key={room.room_key}>
                      <CardContent className="p-5 space-y-3">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BedSingle className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-semibold">{room.room_name}</h3>
                          </div>

                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${room.is_available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {room.is_available ? "Available" : "Sold Out"}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 min-h-[1.2rem]">
                          {room.description || ""}
                        </p>


                        {/* Availability */}
                        <div className="flex items-center justify-between text-sm text-gray-700">
                          <span>
                            Beds Available:{" "}
                            <span className="font-medium">
                              {room.available_beds} / {room.total_beds}
                            </span>
                          </span>

                          <span className="font-semibold text-gray-900">
                            ₹{room.base_price} / day
                          </span>
                        </div>

                        {/* Book room */}
                        <Button
                          disabled={!room.is_available}
                          onClick={() =>
                            navigate(`/hostel/${hostel.uid}/book?room=${room.room_key}`)
                          }
                          className={`
    w-full rounded-full text-white font-medium
    transition-all duration-300
    ${room.is_available
                              ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] hover:translate-y-2 active:translate-y-4 transition-all hover:scale-105 shadow-md hover:shadow-lg"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }
  `}
                        >
                          {room.is_available ? (
                            <span className="flex items-center justify-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Book Room
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Fully Booked
                            </span>
                          )}
                        </Button>


                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No room information available.</p>
              )}
            </TabsContent>


            <TabsContent value="facilities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
                    Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {hostel?.facilities?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {hostel.facilities.map((key) => {
                        const facility = FACILITY_MAP[key];
                        if (!facility) return null;

                        return (
                          <div
                            key={key}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                          >
                            {facility.icon}
                            <span className="font-medium text-gray-700">
                              {facility.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p>No facilities available</p>
                  )}

                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center space-y-3">
                    <Star className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-gray-600 font-medium">
                      No reviews yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Be the first to share your experience
                    </p>

                    <Button
                      className="mt-2 rounded-full text-black"
                      onClick={() =>
                        toast({ title: "Review feature coming soon" })
                      }
                    >
                      Write a Review
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                // <div className="space-y-4">
                //   {reviews.map((review, index) => (
                //     <Card key={review._id || index}>
                //       <CardContent className="p-5 flex gap-4">

                //         {/* Avatar */}
                //         <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                //           <User className="w-6 h-6 text-gray-500" />
                //         </div>

                //         {/* Content */}
                //         <div className="flex-1 space-y-1">
                //           <div className="flex items-center justify-between">
                //             <h4 className="font-semibold text-gray-800">
                //               {review.user_name || "Anonymous"}
                //             </h4>

                //             {/* Rating */}
                //             <div className="flex gap-1">
                //               {[...Array(5)].map((_, i) => (
                //                 <Star
                //                   key={i}
                //                   className={`w-4 h-4 ${i < review.rating
                //                     ? "fill-yellow-500 text-yellow-500"
                //                     : "text-gray-300"
                //                     }`}
                //                 />
                //               ))}
                //             </div>
                //           </div>

                //           <p className="text-sm text-gray-600">
                //             {review.comment}
                //           </p>

                //           {review.createdAt && (
                //             <p className="text-xs text-gray-400">
                //               {new Date(review.createdAt).toLocaleDateString()}
                //             </p>
                //           )}
                //         </div>

                //       </CardContent>
                //     </Card>
                //   ))}
                // </div>
                ""
              )}
            </TabsContent>

          </Tabs>

          <div className="sticky bottom-0 left-0 right-0 bg-white p-4 shadow-lg rounded-lg border-t z-10 md:relative md:shadow-none md:p-0 md:border-0">
            <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-between items-center max-w-5xl mx-auto">
              <div className="text-center sm:text-left">
                {hostel?.room_types && hostel?.room_types.length > 0 && (
                  <div className="ml-4 m-2">
                    <p className="text-sm text-gray-500">Starts from</p>
                    <p className="text-xl font-bold text-gray-800">
                      ₹ {minPrice}
                      / day
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => navigate(`/hostel/${hostel?.uid}/book?room=${minRoomType}`)}
                className="w-full sm:w-auto flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] text-[var(--on-primary)] px-8 py-6 rounded-full"
              >
                <Calendar className="w-5 h-5" />
                Book Now
              </Button>
            </div>
          </div>

          <Toaster />
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  );
}