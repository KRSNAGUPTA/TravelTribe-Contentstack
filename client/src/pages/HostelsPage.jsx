import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import cmsClient from "@/contentstackClient";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import api from "@/api";

// Updated amenity icons based on the facilities in the data
import {
  Wifi,
  ParkingCircle,
  Cctv,
  ShieldCheck,
  Droplets,
  LockKeyhole,
  Accessibility,
  Flame,
  HeartPulse,
  Snowflake,
  Fan,
  ShowerHead,
  WashingMachine,
  BatteryCharging,
  BookOpen,
  Users,
  CookingPot,
  Microwave,
  House,
  TvMinimalPlayIcon,
  Mars,
  Venus,
  VenusAndMars,
  MapPin,
  View,
} from "lucide-react";
import Stack from "@/sdk/contentstackSDK";

const base = "mr-1 h-4 w-4";

export const facilityIcons = {
  wifi: <Wifi className={`${base} text-sky-500`} />,

  parking: <ParkingCircle className={`${base} text-slate-500`} />,

  cctv: <Cctv className={`${base} text-indigo-500`} />,

  security_guard: (
    <ShieldCheck className={`${base} text-emerald-600`} />
  ),

  drinking_water: (
    <Droplets className={`${base} text-blue-500`} />
  ),

  lockers: (
    <LockKeyhole className={`${base} text-gray-600`} />
  ),

  wheelchair_access: (
    <Accessibility className={`${base} text-teal-600`} />
  ),

  fire_safety: (
    <Flame className={`${base} text-amber-500`} />
  ),

  first_aid: (
    <HeartPulse className={`${base} text-rose-500`} />
  ),

  ac: (
    <Snowflake className={`${base} text-cyan-500`} />
  ),

  "non-ac": (
    <Fan className={`${base} text-neutral-500`} />
  ),

  hot_water: (
    <ShowerHead className={`${base} text-orange-500`} />
  ),

  laundry: (
    <WashingMachine className={`${base} text-indigo-400`} />
  ),

  power_backup: (
    <BatteryCharging className={`${base} text-lime-600`} />
  ),

  housekeeping: (
    <House className={`${base} text-emerald-500`} />
  ),

  study_area: (
    <BookOpen className={`${base} text-violet-500`} />
  ),

  tv: (
    <TvMinimalPlayIcon className={`${base} text-fuchsia-500`} />
  ),

  common_area: (
    <Users className={`${base} text-purple-500`} />
  ),

  kitchen: (
    <CookingPot className={`${base} text-amber-600`} />
  ),

  microwave: (
    <Microwave className={`${base} text-pink-500`} />
  ),
};

const FACILITY_PRIORITY = [
  "wifi",
  "cctv",
  "security_guard",
  "parking",
  "drinking_water",
  "fire_safety",
];

const hostelTypeIcon = {
  Boys: <Mars className="h-4 w-4 text-blue-600" />,
  Girls: <Venus className="h-4 w-4 text-pink-600" />,
  Unisex: <VenusAndMars className="h-4 w-4 text-purple-600" />,
};


export default function FindHostel() {
  const [hostels, setHostels] = useState([]);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [college, setCollege] = useState("all");
  const [price, setPrice] = useState("none");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [roomAvailability, setRoomAvailability] = useState({});
  const [listingPageData, setListingPageData] = useState()
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const data = (
          await cmsClient.get(
            "/content_types/hostel_listing/entries/blt637d48315eb69a7b"
          )
        ).data.entry;
        setListingPageData(data);
      } catch (error) {
        console.error("Failed to fetch data from cms", error);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack
          .ContentType("hostel_listing")
          .Entry("blt637d48315eb69a7b")
          .toJSON()
          .fetch();
        document.title = entry.title;
        setListingPageData(entry);
      } catch (err) {
        console.error(err);
      }
    };

    if (import.meta.env.VITE_SDK === "true") {
      // console.log("SDK active")
      fetchSDKData()
    } else {
      fetchCDAData();
      // console.log("CDA active")
    }
  }, []);

  useEffect(() => {
    if (listingPageData?.page_title) {
      document.title = listingPageData.page_title;
    }
  }, [listingPageData]);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const hostelsData = (await cmsClient.get("/content_types/hostel/entries")).data.entries // array of hostels
        // console.log(hostelsData)
        setHostels(hostelsData);
        setFilteredHostels(hostelsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };
    const fetchRoomAvailability = async () => {
      try {
        const res = await api.get("/api/hostel");

        // Convert array → lookup map
        // hostelId => room_types[]
        const availabilityMap = {};
        res.data.forEach((item) => {
          availabilityMap[item.hostelId] = item.room_types;
        });

        setRoomAvailability(availabilityMap);
      } catch (err) {
        console.error("Failed to fetch room availability", err);
      }
    };
    fetchRoomAvailability();
    fetchData();
  }, []);

  const hasAvailableRooms = (rooms = []) =>
    rooms.some((r) => r.available_beds > 0);

  const getLowestAvailablePrice = (cmsRooms = [], backendRooms = []) => {
    const availableKeys = backendRooms
      .filter(r => r.available_beds > 0)
      .map(r => r.room_key);

    const availableCmsRooms = cmsRooms.filter(r =>
      availableKeys.includes(r.room_key)
    );

    if (!availableCmsRooms.length) return null;

    return Math.min(...availableCmsRooms.map(r => r.base_price));
  };

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredHostels.length / itemsPerPage);
  const paginatedHostels = filteredHostels.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Get priority key facilities to display


  const getKeyFacilities = (facilities = []) =>
    FACILITY_PRIORITY.filter(f => facilities.includes(f)).slice(0, 4);



  useEffect(() => {
    let filtered = hostels.filter((hostel) => {
      const backendRooms = roomAvailability[hostel.uid] || [];

      const matchesSearch =
        search === "" ||
        hostel.title.toLowerCase().includes(search.toLowerCase()) ||
        hostel.address.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        location === "all" ||
        hostel.address.toLowerCase().includes(location.toLowerCase());

      const matchesCollege =
        college === "all" ||
        hostel.nearby_college?.some((c) =>
          c.toLowerCase().includes(college.toLowerCase())
        );

      const lowestPrice = getLowestAvailablePrice(
        hostel.room_types,
        backendRooms
      );

      const matchesPrice =
        price === "none" ||
        (lowestPrice !== null && lowestPrice <= Number(price));

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCollege &&
        matchesPrice
      );
    });

    setFilteredHostels(filtered);
    setPage(1);
  }, [search, location, college, price, hostels, roomAvailability]);


  const goToPreviousPage = () => setPage(Math.max(1, page - 1));
  const goToNextPage = () => setPage(Math.min(totalPages, page + 1));

  return (
    <TooltipProvider>

      <div className="min-h-screen bg-gray-50">
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Header />
        </div>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {listingPageData?.title}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {listingPageData?.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Input
              type="text"
              placeholder={listingPageData?.search_placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-full border-purple-200 focus:ring-purple-500"
            />
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                <SelectItem value="Thakur College of Engineering and Technology">
                  Thakur College of Engineering and Technology
                </SelectItem>
                <SelectItem value="iitb">IIT Bombay</SelectItem>
                <SelectItem value="vjti">VJTI Mumbai</SelectItem>
                <SelectItem value="ict">
                  Institute of Chemical Technology (ICT)
                </SelectItem>
                <SelectItem value="Sardar Patel Institute of Technology">
                  Sardar Patel Institute of Technology
                </SelectItem>
                <SelectItem value="K.J. Somaiya College of Science & Commerce">
                  K.J. Somaiya College of Science & Commerce
                </SelectItem>
                <SelectItem value="DJ Sanghvi College of Engineering">
                  DJ Sanghvi College of Engineering
                </SelectItem>
                <SelectItem value="Mukesh Patel School of Technology">
                  Mukesh Patel School of Technology
                </SelectItem>
                <SelectItem value="NMIMS University">NMIMS University</SelectItem>
                <SelectItem value="rait">
                  Ramrao Adik Institute of Technology (RAIT)
                </SelectItem>
                <SelectItem value="St. Francis Institute of Technology">
                  St. Francis Institute of Technology
                </SelectItem>
                <SelectItem value="SIES Graduate School of Technology">
                  SIES Graduate School of Technology
                </SelectItem>
                <SelectItem value="Don Bosco Institute of Technology">
                  Don Bosco Institute of Technology
                </SelectItem>
                <SelectItem value="Xavier Institute of Engineering">
                  Xavier Institute of Engineering
                </SelectItem>
                <SelectItem value="Thakur Polytechnic">Thakur Polytechnic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                <SelectItem value="Chennai">Chennai</SelectItem>
                <SelectItem value="Kolkata">Kolkata</SelectItem>
                <SelectItem value="Pune">Pune</SelectItem>
                <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                <SelectItem value="Jaipur">Jaipur</SelectItem>
                <SelectItem value="Kota">Kota</SelectItem>
                <SelectItem value="Lucknow">Lucknow</SelectItem>
                <SelectItem value="Kanpur">Kanpur</SelectItem>
                <SelectItem value="Nagpur">Nagpur</SelectItem>
                <SelectItem value="Indore">Indore</SelectItem>
                <SelectItem value="Thane">Thane</SelectItem>
                <SelectItem value="Bhopal">Bhopal</SelectItem>
                <SelectItem value="Prayagraj">Prayagraj</SelectItem>
                <SelectItem value="Patna">Patna</SelectItem>
                <SelectItem value="Varanasi">Varanasi</SelectItem>
                <SelectItem value="Surat">Surat</SelectItem>
                <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                <SelectItem value="Guwahati">Guwahati</SelectItem>
                <SelectItem value="Bhubaneswar">Bhubaneswar</SelectItem>
                <SelectItem value="Dehradun">Dehradun</SelectItem>
                <SelectItem value="Mysore">Mysore</SelectItem>
                <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                <SelectItem value="Vijayawada">Vijayawada</SelectItem>
                <SelectItem value="Ranchi">Ranchi</SelectItem>
                <SelectItem value="Raipur">Raipur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={price} onValueChange={setPrice}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Limit</SelectItem>
                <SelectItem value="500">Under ₹500</SelectItem>
                <SelectItem value="1000">Under ₹1000</SelectItem>
                <SelectItem value="1500">Under ₹1500</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center mb-6 ">
            <Button
              onClick={() => {
                setSearch("");
                setLocation("all");
                setPrice("none");
                setCollege("all");
              }}
              className="text-sm rounded-full text-black active:translate-y-4 hover:translate-y-2 transition-all"
            >
              {listingPageData?.reset_button_text}
            </Button>
          </div>
          <div className="text-center mb-6 text-gray-600">
            Found {filteredHostels.length} stays
          </div>
          <TooltipProvider delayDuration={100}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {isLoading ? (
                [...Array(6)].map((_, index) => (
                  <Card key={index} className="overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <CardContent className="p-4">
                      <div className="h-6 bg-gray-200 mb-2 rounded"></div>
                      <div className="h-4 bg-gray-200 mb-4 rounded w-3/4"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : paginatedHostels.length > 0 ? (
                paginatedHostels.map((hostel) => {
                  const backendRooms = roomAvailability[hostel.uid] || [];
                  const lowestPrice = getLowestAvailablePrice(
                    hostel.room_types,
                    backendRooms
                  );
                  const isAvailable = hasAvailableRooms(backendRooms);

                  return (
                    <Card
                      key={hostel.uid}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={
                            hostel?.images?.length > 0
                              ? hostel.images[0].url
                              : "/placeholder-hostel.jpg"
                          }
                          alt={hostel?.title}
                          className="w-full h-full object-cover"
                        />

                        {isAvailable && lowestPrice !== null ? (
                          <div className="absolute top-2 right-2 bg-white/20 text-[var(--primary)] border-1 px-3 py-1 rounded-full text-sm font-bold">
                            ₹ {lowestPrice} / day
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Full
                          </div>
                        )}

                        {hostel.type && (
                          <Tooltip>

                            <TooltipTrigger className="absolute top-2 left-2  bg-white/80 p-2 rounded-full text-xs font-medium capitalize">
                              {hostelTypeIcon[hostel.type]}
                            </TooltipTrigger>
                            <TooltipContent className="rounded-full bg-white/10 text-black px-4 py-2 border mb-5 font-semibold">
                              {hostel.type}
                            </TooltipContent>
                          </Tooltip>
                        )}

                      </div>

                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {hostel.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400 overflow-hidden" />
                          {hostel.address.length > 40
                            ? hostel.address.slice(0, 40) + "..."
                            : hostel.address}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {getKeyFacilities(hostel.facilities).map((facility) => (
                            <Tooltip key={facility}>
                              <TooltipTrigger asChild>
                                <span className="cursor-help hover:scale-125 transition-transform inline-flex items-center justify-center rounded bg-purple-50 p-1 text-purple-700 ">
                                  {facilityIcons[facility] ?? <Shield className="h-4 w-4" />}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white/90 text-purple-600 font-semibold rounded-full border ">
                                {facility.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>

                        <Button
                          onClick={() => navigate(`/hostel/${hostel.uid}`)}
                          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] hover:rounded-full transition-all  "
                        >
                          {listingPageData?.view_button_text}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })

              )
                : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-600 mb-4">
                      No properties found matching your criteria.
                    </p>
                    <Button
                      onClick={() => {
                        setSearch("");
                        setLocation("all");
                        setPrice("none");
                        setCollege("all");
                      }}
                      variant="outline"
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
            </div>

          </TooltipProvider>
          {filteredHostels.length > itemsPerPage && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink
                      onClick={goToPreviousPage}
                      disabled={page === 1}
                    >
                      Previous
                    </PaginationLink>
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(i + 1)}
                        className={
                          i + 1 === page ? "bg-[var(--primary)] text-white" : ""
                        }
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationLink
                      onClick={goToNextPage}
                      disabled={page === totalPages}
                    >
                      Next
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
        <Footer />
      </div>

    </TooltipProvider>
  );
}
