import { useState, useEffect, useRef } from "react";
import {
  InstantSearch,
  Hits,
  Configure,
  Pagination,
} from "react-instantsearch";
import { searchClient } from "@/services/algoliaSearch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HostelCard from "@/components/HostelCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import {
  fetchEntryById,
  setDataForChromeExtension,
} from "@/contentstack/utils";
import api from "@/api";

// Facility icons (keep your existing ones)
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
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useStats } from "react-instantsearch";
import { useNavigate } from "react-router-dom";

const base = "mr-1 h-4 w-4";

export const facilityIcons = {
  wifi: <Wifi className={`${base} text-sky-500`} />,
  parking: <ParkingCircle className={`${base} text-slate-500`} />,
  cctv: <Cctv className={`${base} text-indigo-500`} />,
  security_guard: <ShieldCheck className={`${base} text-emerald-600`} />,
  drinking_water: <Droplets className={`${base} text-blue-500`} />,
  lockers: <LockKeyhole className={`${base} text-gray-600`} />,
  wheelchair_access: <Accessibility className={`${base} text-teal-600`} />,
  fire_safety: <Flame className={`${base} text-amber-500`} />,
  first_aid: <HeartPulse className={`${base} text-rose-500`} />,
  ac: <Snowflake className={`${base} text-cyan-500`} />,
  "non-ac": <Fan className={`${base} text-neutral-500`} />,
  hot_water: <ShowerHead className={`${base} text-orange-500`} />,
  laundry: <WashingMachine className={`${base} text-indigo-400`} />,
  power_backup: <BatteryCharging className={`${base} text-lime-600`} />,
  housekeeping: <House className={`${base} text-emerald-500`} />,
  study_area: <BookOpen className={`${base} text-violet-500`} />,
  tv: <TvMinimalPlayIcon className={`${base} text-fuchsia-500`} />,
  common_area: <Users className={`${base} text-purple-500`} />,
  kitchen: <CookingPot className={`${base} text-amber-600`} />,
  microwave: <Microwave className={`${base} text-pink-500`} />,
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

function HostelHit({ hit }) {
  const [roomAvailability, setRoomAvailability] = useState({});

  useEffect(() => {
    const fetchRoomAvailability = async () => {
      try {
        const res = await api.get(`/api/hostel/${hit.uid}`);
        setRoomAvailability(res.data);
      } catch (err) {
        console.error("Failed to fetch room availability", err);
      }
    };
    fetchRoomAvailability();
  }, [hit.uid]);

  const backendRooms = roomAvailability.room_types || [];
  const hasAvailableRooms = backendRooms.some((r) => r.available_beds > 0);

  return (
    <HostelCard
      hostel={hit}
      lytics_event="hostels_page"
      variant="detailed"
      isAvailable={hasAvailableRooms}
    />
  );
}

function ResultsCount() {
  const { nbHits } = useStats();

  return (
    <div className="text-center mb-6 text-gray-600">
      Found {nbHits || 0} stays
    </div>
  );
}

export default function HostelsPageWithAlgolia() {
  const navigate = useNavigate();
  const [listingPageData, setListingPageData] = useState();
  const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME || "dev_index";
  const autocompleteBoxRef = useRef(null);
  const hasHydratedFiltersFromUrl = useRef(false);
  const [filters, setFilters] = useState({
    search: "",
    college: "all",
    location: "all",
    maxPrice: "none",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const data = {
    entryUid: "blt637d48315eb69a7b",
    contenttype: "hostel_listing",
    locale: import.meta.env.VITE_CS_LOCALE,
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setFilters((prev) => ({
      ...prev,
      search: params.get("q") || "",
      college: params.get("college") || "all",
      location: params.get("location") || "all",
      maxPrice: params.get("price") || "none",
    }));

    hasHydratedFiltersFromUrl.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedFiltersFromUrl.current) return;

    const params = new URLSearchParams(window.location.search);

    if (filters.search) params.set("q", filters.search);
    else params.delete("q");

    if (filters.college !== "all") params.set("college", filters.college);
    else params.delete("college");

    if (filters.location !== "all") params.set("location", filters.location);
    else params.delete("location");

    if (filters.maxPrice !== "none") params.set("price", filters.maxPrice);
    else params.delete("price");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = await fetchEntryById(
          data.contenttype,
          data.entryUid,
          import.meta.env.VITE_SDK,
          null,
        );
        document.title = entry.page_title;
        setListingPageData(entry);
      } catch (error) {
        console.error("Error fetching hostel listing data", error);
      }
    };

    onEntryChange(fetchData);
    setDataForChromeExtension(data);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteBoxRef.current &&
        !autocompleteBoxRef.current.contains(event.target)
      ) {
        setIsAutocompleteOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const query = filters.search.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setIsAutocompleteLoading(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setIsAutocompleteLoading(true);
        const response = await searchClient.search([
          {
            indexName,
            query,
            params: {
              hitsPerPage: 5,
              attributesToRetrieve: [
                "uid",
                "title",
                "address",
                "room_types",
                "lowest_price",
                "base_price",
              ],
            },
          },
        ]);

        const hits = response?.results?.[0]?.hits || [];
        setSuggestions(hits);
      } catch (error) {
        console.error("Autocomplete fetch failed", error);
        setSuggestions([]);
      } finally {
        setIsAutocompleteLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [filters.search, indexName]);

  let priceFilter;
  if (filters.maxPrice && filters.maxPrice !== "none") {
    const maxPrice = Number(filters.maxPrice);
    if (Number.isFinite(maxPrice)) {
      // Support top-level and nested room pricing fields.
      priceFilter = `(room_types.base_price <= ${maxPrice} OR lowest_price <= ${maxPrice} OR base_price <= ${maxPrice})`;
    }
  }

  const composedQuery = [
    filters.search,
    filters.college !== "all" ? filters.college : "",
    filters.location !== "all" ? filters.location : "",
  ]
    .filter(Boolean)
    .join(" ");

  const getSuggestionPrice = (item) => {
    const roomPrices = Array.isArray(item?.room_types)
      ? item.room_types
          .map((room) => Number(room?.base_price))
          .filter((price) => Number.isFinite(price) && price > 0)
      : [];

    if (roomPrices.length > 0) {
      return Math.min(...roomPrices);
    }

    const fallback = [Number(item?.lowest_price), Number(item?.base_price)].find(
      (price) => Number.isFinite(price) && price > 0,
    );

    return fallback || null;
  };

  const highlightText = (text, query) => {
    if (!text || !query) return text || "";

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(${escapedQuery})`, "ig");
    const parts = text.split(pattern);

    return parts.map((part, idx) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={`${part}-${idx}`}
          className="rounded bg-amber-100 px-0.5 text-amber-900"
        >
          {part}
        </mark>
      ) : (
        <span key={`${part}-${idx}`}>{part}</span>
      ),
    );
  };

  const handleReset = () => {
    setFilters({
      search: "",
      college: "all",
      location: "all",
      maxPrice: "none",
    });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Header />
        </div>

        <InstantSearch
          searchClient={searchClient}
          indexName={indexName}
          routing={{
            stateMapping: {
              stateToRoute(uiState) {
                const indexUiState = uiState[indexName] || {};

                return {
                  q: indexUiState.query,
                  page: indexUiState.page,
                  sort: indexUiState.sortBy,
                };
              },
              routeToState(routeState) {
                return {
                  [indexName]: {
                    query: routeState.q || "",
                    page: routeState.page ? Number(routeState.page) : 1,
                    sortBy: routeState.sort,
                  },
                };
              },
            },
          }}
        >
          <main className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 bubblegum-sans-regular">
                {listingPageData?.title}
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {listingPageData?.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <div className="relative w-72" ref={autocompleteBoxRef}>
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder={
                    listingPageData?.search_placeholder || "Search hostels..."
                  }
                  value={filters.search}
                  onFocus={() => setIsAutocompleteOpen(true)}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                    setIsAutocompleteOpen(true);
                  }}
                  className="w-72 rounded-full border-purple-200 bg-white pl-10 pr-4 shadow-sm transition-all focus:border-purple-300 focus:ring-purple-500"
                />

                {isAutocompleteOpen && filters.search.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_16px_38px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                    
                    {isAutocompleteLoading ? (
                      <div className="px-4 py-4 text-sm text-gray-500">
                        Searching...
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-gray-500">
                        No suggestions found for "{filters.search.trim()}"
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto py-1">
                        {suggestions.map((item) => {
                          const suggestionPrice = getSuggestionPrice(item);

                          return (
                            <button
                              key={item.objectID || item.uid || item.title}
                              type="button"
                              onClick={() => {
                                const destinationUid = item.uid || item.objectID;

                                if (destinationUid) {
                                  setIsAutocompleteOpen(false);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                  navigate(`/hostel/${destinationUid}`);
                                  return;
                                }

                                setFilters((prev) => ({
                                  ...prev,
                                  search: item.title || "",
                                }));
                                setIsAutocompleteOpen(false);
                              }}
                              className="block w-full border-b border-gray-100/80 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-purple-50/60"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                                  {highlightText(
                                    item.title || "Untitled Hostel",
                                    filters.search.trim(),
                                  )}
                                </p>
                                {suggestionPrice ? (
                                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                    from Rs. {suggestionPrice}
                                  </span>
                                ) : null}
                              </div>
                              {item.address && (
                                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                  {item.address}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Select
                value={filters.college}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, college: value }))
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select College" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  <SelectItem value="Thakur College of Engineering and Technology">
                    Thakur College of Engineering and Technology
                  </SelectItem>
                  <SelectItem value="Indian Institute of Technology Bombay (IIT Bombay)">
                    Indian Institute of Technology Bombay (IIT Bombay)
                  </SelectItem>
                  <SelectItem value="VJTI Mumbai">VJTI Mumbai</SelectItem>
                  <SelectItem value="Institute of Chemical Technology (ICT)">
                    Institute of Chemical Technology (ICT)
                  </SelectItem>
                  <SelectItem value="Sardar Patel Institute of Technology">
                    Sardar Patel Institute of Technology
                  </SelectItem>
                  <SelectItem value="K.J. Somaiya College of Science & Commerce">
                    K.J. Somaiya College of Science & Commerce
                  </SelectItem>
                  <SelectItem value="Dwarkadas J. Sanghvi College of Engineering (DJSCE)">
                    Dwarkadas J. Sanghvi College of Engineering (DJSCE)
                  </SelectItem>
                  <SelectItem value="Narsee Monjee Institute of Management Studies (NMIMS)">
                    Narsee Monjee Institute of Management Studies (NMIMS)
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.location}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Pune">Pune</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Lucknow">Lucknow</SelectItem>
                  <SelectItem value="Jaipur">Jaipur</SelectItem>
                  <SelectItem value="Prayagraj">Prayagraj</SelectItem>
                  <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Kolkata">Kolkata</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.maxPrice}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, maxPrice: value }))
                }
              >
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

            <div className="flex justify-center mb-6">
              <Button
                onClick={handleReset}
                className="text-sm rounded-full text-black active:translate-y-4 hover:translate-y-2 transition-all"
              >
                {listingPageData?.reset_button_text || "Reset Filters"}
              </Button>
            </div>

            <ResultsCount />

            <Configure
              hitsPerPage={6}
              query={composedQuery || undefined}
              filters={priceFilter}
            />

            <Hits
              hitComponent={HostelHit}
              classNames={{
                root: "mb-10",
                list: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                item: "h-full",
              }}
            />

            <div className="flex justify-center mb-10 hover:cursor-pointer">
              <Pagination
                classNames={{
                  root: "flex justify-center",
                  list: "flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm",
                  item: "",
                  link: "flex h-9 min-w-9 items-center justify-center rounded-xl border border-transparent px-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50",
                  selectedItem:
                    "rounded-xl bg-[var(--primary)] text-white shadow-sm",
                  disabledItem: "pointer-events-none opacity-40",
                  previousPageItem: "mr-1",
                  nextPageItem: "ml-1",
                }}
                translations={{
                  previousPageItemText: <ChevronLeft className="h-4 w-4" />,
                  nextPageItemText: <ChevronRight className="h-4 w-4" />,
                }}
              />
            </div>
          </main>

          <Footer />
        </InstantSearch>
      </div>
    </TooltipProvider>
  );
}
