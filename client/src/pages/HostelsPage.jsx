import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HostelCard from "@/components/HostelCard";
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
import { onEntryChange } from "@/contentstack/contentstackSDK";
import {
  fetchEntries,
  setDataForChromeExtension,
} from "@/contentstack/utils";
import api from "@/api";
import { searchClient } from "@/services/algoliaSearch";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function HostelsPage() {
  const navigate = useNavigate();
  const [listingPageData, setListingPageData] = useState();
  const [hostels, setHostels] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [page, setPage] = useState(1);
  const [loadingHostels, setLoadingHostels] = useState(true);
  const autocompleteBoxRef = useRef(null);
  const hasHydratedFiltersFromUrl = useRef(false);
  const [filters, setFilters] = useState({
    search: "",
    college: "all",
    location: "all",
    maxPrice: "none",
  });
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME || "travel_tribe";

  let data = {
    entryUid: "blt637d48315eb69a7b",
    contenttype: "hostel_listing",
    locale: import.meta.env.VITE_CS_LOCALE,
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";
    setFilters((prev) => ({
      ...prev,
      search: initialQuery,
      college: params.get("college") || "all",
      location: params.get("location") || "all",
      maxPrice: params.get("price") || "none",
    }));
    setSearchInput(initialQuery);
    const initialPage = parseInt(params.get("page"), 10) || 1;
    setPage(initialPage);
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

    if (page > 1) params.set("page", page.toString());
    else params.delete("page");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, page]);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const listingEntry = (
          await fetchEntries("hostel_listing", import.meta.env.VITE_SDK, null)
        )[0];
        if (listingEntry) {
          data.entryUid = listingEntry?.uid;
          document.title = listingEntry.page_title || "Hostels | Travel Tribe";
          setListingPageData(listingEntry);
        }
      } catch (error) {
        console.error("Error fetching hostel listing header data", error);
      }
    };

    fetchHeaderData();
    onEntryChange(fetchHeaderData);
    scrollTo({
      top:0,
      behavior:'smooth'
    })
    setDataForChromeExtension(data);
  }, []);

  // Fetch paginated hostels from backend server
  const fetchPaginatedHostels = async () => {
    try {
      setLoadingHostels(true);
      const res = await api.get("/api/hostel", {
        params: {
          page,
          limit: 6,
          q: filters.search.trim() || undefined,
          college: filters.college !== "all" ? filters.college : undefined,
          location: filters.location !== "all" ? filters.location : undefined,
          price: filters.maxPrice !== "none" ? filters.maxPrice : undefined,
        },
      });

      if (res.data) {
        setHostels(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching paginated hostels from server", error);
    } finally {
      setLoadingHostels(false);
    }
  };

  useEffect(() => {
    fetchPaginatedHostels();
  }, [page, filters]);

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

  // Algolia Search for Autocomplete (uses live searchInput)
  useEffect(() => {
    const query = searchInput.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await searchClient.search([
          {
            indexName,
            query,
            params: {
              hitsPerPage: 5,
            },
          },
        ]);
        // console.log("Algolia autocomplete search response:", response);  
        const hits = response?.results?.[0]?.hits || [];
        setSuggestions(hits);
      } catch (err) {
        console.error("Algolia autocomplete search error:", err);
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput, indexName]);

  const getSuggestionPrice = (item) => {
    const roomPrices = Array.isArray(item?.room_types)
      ? item.room_types
          .map((room) => Number(room?.base_price))
          .filter((price) => Number.isFinite(price) && price > 0)
      : [];

    if (roomPrices.length > 0) {
      return Math.min(...roomPrices);
    }
    return Number(item?.base_price) || null;
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
      )
    );
  };

  const executeSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
    setPage(1);
    setIsAutocompleteOpen(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput("");
    setFilters({
      search: "",
      college: "all",
      location: "all",
      maxPrice: "none",
    });
    setPage(1);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Header />
        </div>

        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12 mt-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bubblegum-sans-regular">
              {listingPageData?.title || "Hostels"}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {listingPageData?.subtitle || "Discover student hostels & co-living spaces"}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div className="relative w-80" ref={autocompleteBoxRef}>
              <div className="flex items-center rounded-full border border-purple-200 bg-white p-1 shadow-sm transition-all focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200">
                <input
                  type="text"
                  placeholder={
                    listingPageData?.search_placeholder || "Search hostels..."
                  }
                  value={searchInput}
                  onFocus={() => setIsAutocompleteOpen(true)}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setIsAutocompleteOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeSearch();
                    }
                  }}
                  className="flex-1 bg-transparent pl-4 pr-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={executeSearch}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {isAutocompleteOpen && searchInput.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_16px_38px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      No suggestions found for "{searchInput.trim()}"
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto py-1">
                      {suggestions.map((item) => {
                        const suggestionPrice = getSuggestionPrice(item);
                        const itemUid = item.uid || item.objectID;
                        return (
                          <button
                            key={itemUid || item.title}
                            type="button"
                            onClick={() => {
                              if (itemUid) {
                                setIsAutocompleteOpen(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                navigate(`/hostel/${itemUid}`);
                                return;
                              }
                              setSearchInput(item.title || "");
                              setFilters((prev) => ({
                                ...prev,
                                search: (item.title || "").trim(),
                              }));
                              setPage(1);
                              setIsAutocompleteOpen(false);
                            }}
                            className="block w-full border-b border-gray-100/80 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-purple-50/60"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                                {highlightText(
                                  item.title || "Untitled Hostel",
                                  searchInput.trim()
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
              onValueChange={(value) => handleFilterChange("college", value)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select College" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={true}>
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
              onValueChange={(value) => handleFilterChange("location", value)}
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
              onValueChange={(value) => handleFilterChange("maxPrice", value)}
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
              className="text-sm rounded-full text-black active:translate-y-1 hover:translate-y-1 transition-all"
            >
              {listingPageData?.reset_button_text || "Reset Filters"}
            </Button>
          </div>

          <div className="text-center mb-6 text-gray-600">
            Found {pagination.total} stays
          </div>

          {loadingHostels ? (
            <div className="text-center py-12 text-gray-500">
              Loading hostels...
            </div>
          ) : hostels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hostels found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {hostels.map((hostel) => (
                <HostelCard
                  key={hostel.uid}
                  hostel={hostel}
                  lytics_event="hostels_page"
                  variant="detailed"
                  isAvailable={hostel.isAvailable ?? true}
                />
              ))}
            </div>
          )}

          {/* Server-Side Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mb-10">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl p-0 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={`h-9 min-w-9 rounded-xl px-3 text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary)]"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  )
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl p-0 hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </TooltipProvider>
  );
}



