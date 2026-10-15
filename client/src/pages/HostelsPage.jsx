import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HostelCard from "@/components/HostelCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntries } from "@/contentstack/utils";
import api from "@/api";
import { searchClient } from "@/services/algoliaSearch";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const buildPageWindow = (current, total, siblings = 1) => {
  if (total <= 1) return [];
  const totalNumbers = siblings * 2 + 5;
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  const range = [];
  const start = showLeftEllipsis ? leftSibling : 1;
  const end = showRightEllipsis ? rightSibling : total;

  for (let i = start; i <= end; i++) range.push(i);

  const result = [];
  if (showLeftEllipsis) result.push(1, "…");
  result.push(...range);
  if (showRightEllipsis) result.push("…", total);

  return result;
};

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
          await fetchEntries("hostel_listing")
        )[0];
        if (listingEntry) {
          document.title = listingEntry.page_title || "Hostels | Travel Tribe";
          setListingPageData(listingEntry);
        }
      } catch (error) {
        console.error("Error fetching hostel listing header data", error);
      }
    };

    fetchHeaderData();
    onEntryChange(fetchHeaderData);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
          className="rounded bg-primary/15 px-0.5 text-primary"
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

  const pageWindow = buildPageWindow(page, pagination.totalPages, 1);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-paper text-ink">
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <Header />
        </div>

        <main className="container mx-auto px-4 pb-32 pt-24">
          <div className="mb-12 text-center">
            <h1 className="mb-2 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              {listingPageData?.title || "Hostels"}
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-ink-muted sm:text-base">
              {listingPageData?.subtitle ||
                "Discover student hostels & co-living spaces"}
            </p>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-3">
            <div className="relative w-full max-w-md" ref={autocompleteBoxRef}>
              <div className="flex items-center rounded-full border border-hairline bg-white p-1 shadow-sm transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
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
                    if (e.key === "Enter") executeSearch();
                  }}
                  className="flex-1 bg-transparent pl-4 pr-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />

                <button
                  type="button"
                  onClick={executeSearch}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm transition hover:bg-primary-hover"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {isAutocompleteOpen && searchInput.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_16px_38px_-12px_rgba(0,0,0,0.15)]">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-ink-muted">
                      No suggestions for "{searchInput.trim()}"
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
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
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
                            className="block w-full border-b border-hairline/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/[0.06]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="line-clamp-1 text-sm font-semibold text-ink">
                                {highlightText(
                                  item.title || "Untitled Hostel",
                                  searchInput.trim()
                                )}
                              </p>
                              {suggestionPrice ? (
                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                  from ₹{suggestionPrice}
                                </span>
                              ) : null}
                            </div>
                            {item.address && (
                              <p className="mt-1 line-clamp-1 text-xs text-ink-muted">
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
              <SelectTrigger className="h-11 w-56 rounded-full border-hairline bg-white">
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
              onValueChange={(value) => handleFilterChange("location", value)}
            >
              <SelectTrigger className="h-11 w-56 rounded-full border-hairline bg-white">
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
              <SelectTrigger className="h-11 w-44 rounded-full border-hairline bg-white">
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

          <div className="mb-6 flex justify-center">
            <Button
              onClick={handleReset}
              variant="outline"
              className="h-10 rounded-full border-hairline-strong text-ink hover:border-primary/40 hover:text-primary"
            >
              {listingPageData?.reset_button_text || "Reset Filters"}
            </Button>
          </div>

          <div className="mb-6 text-center text-sm text-ink-muted">
            Found{" "}
            <span className="font-medium text-ink">{pagination.total}</span>{" "}
            {pagination.total === 1 ? "stay" : "stays"}
          </div>

          {loadingHostels ? (
            <div className="py-16 text-center text-ink-muted">
              Loading hostels…
            </div>
          ) : hostels.length === 0 ? (
            <div className="py-16 text-center text-ink-muted">
              No hostels found matching your criteria.
            </div>
          ) : (
            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {hostels.map((hostel) => (
                <HostelCard
                  key={hostel.uid}
                  hostel={hostel}
                  variant="detailed"
                  isAvailable={hostel.isAvailable ?? true}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mb-10 flex justify-center">
              <div className="flex items-center gap-1 rounded-full border border-hairline bg-white p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full p-0 hover:bg-primary/10 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageWindow.map((item, idx) => {
                  if (item === "…") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="flex h-9 w-9 items-center justify-center text-sm text-ink-muted"
                      >
                        …
                      </span>
                    );
                  }

                  const isActive = item === page;
                  return (
                    <Button
                      key={item}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(item)}
                      className={`h-9 min-w-9 rounded-full px-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-on-primary shadow-sm hover:bg-primary"
                          : "text-ink hover:bg-primary/10"
                      }`}
                    >
                      {item}
                    </Button>
                  );
                })}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() =>
                    setPage((p) =>
                      Math.min(pagination.totalPages, p + 1)
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full p-0 hover:bg-primary/10 disabled:opacity-40"
                  aria-label="Next page"
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