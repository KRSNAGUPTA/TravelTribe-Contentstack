import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  MapPin, ShieldCheck, Wifi, ParkingCircle, Share2, Star, User, Phone, Mail,
  ChevronRight, ChevronDown, ShowerHead, UtensilsCrossed, GraduationCap,
  HeartPulse, Check, CircleCheck, Mars, Venus, VenusAndMars, BedSingle, Cctv,
  Droplets, LockKeyhole, Accessibility, Flame, Snowflake, Fan, WashingMachine,
  BatteryCharging, Users, CookingPot, Microwave, House, TvMinimalPlayIcon,
  BookOpen, XCircle,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import api from "@/api";
import { getAvailability, getMyBookings } from "@/services/bookingApi";
import { toast } from "@/hooks/use-toast";
import Loading from "./Loading";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntryById } from "@/contentstack/utils";
import { AuthContext } from "@/context/AuthContext";

/* ---------- helpers ---------- */
// Local-date ISO (toISOString() is UTC and gives the wrong day in IST early mornings)
const toLocalISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayISO = () => toLocalISO(new Date());
const tomorrowISO = () => toLocalISO(new Date(Date.now() + 86400000));

const ic = "h-4 w-4";
const FACILITY_MAP = {
  wifi: { label: "Free Wi-Fi", Icon: Wifi, color: "text-sky-600" },
  parking: { label: "Parking", Icon: ParkingCircle, color: "text-slate-600" },
  cctv: { label: "CCTV", Icon: Cctv, color: "text-indigo-600" },
  security_guard: { label: "24×7 Security", Icon: ShieldCheck, color: "text-emerald-600" },
  drinking_water: { label: "Drinking water", Icon: Droplets, color: "text-blue-600" },
  lockers: { label: "Lockers", Icon: LockKeyhole, color: "text-slate-600" },
  wheelchair_access: { label: "Wheelchair access", Icon: Accessibility, color: "text-teal-600" },
  fire_safety: { label: "Fire safety", Icon: Flame, color: "text-amber-600" },
  first_aid: { label: "First aid", Icon: HeartPulse, color: "text-rose-600" },
  ac: { label: "Air conditioning", Icon: Snowflake, color: "text-cyan-600" },
  "non-ac": { label: "Non-AC", Icon: Fan, color: "text-slate-500" },
  hot_water: { label: "Hot water", Icon: ShowerHead, color: "text-orange-600" },
  laundry: { label: "Laundry", Icon: WashingMachine, color: "text-indigo-500" },
  power_backup: { label: "Power backup", Icon: BatteryCharging, color: "text-lime-600" },
  housekeeping: { label: "Housekeeping", Icon: House, color: "text-emerald-500" },
  study_area: { label: "Study area", Icon: BookOpen, color: "text-violet-600" },
  tv: { label: "Television", Icon: TvMinimalPlayIcon, color: "text-fuchsia-600" },
  common_area: { label: "Common area", Icon: Users, color: "text-purple-600" },
  kitchen: { label: "Kitchen", Icon: CookingPot, color: "text-amber-700" },
  microwave: { label: "Microwave", Icon: Microwave, color: "text-pink-600" },
};

const HOSTEL_TYPE_MAP = {
  Boys: { label: "Boys only", Icon: Mars, color: "text-blue-600" },
  Girls: { label: "Girls only", Icon: Venus, color: "text-pink-600" },
  Unisex: { label: "Unisex", Icon: VenusAndMars, color: "text-purple-600" },
};

const Stars = ({ value, size = "h-3.5 w-3.5" }) => (
  <div className="flex gap-0.5" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`${size} ${s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-border-strong"}`}
      />
    ))}
  </div>
);

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-border-strong"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const SectionTitle = ({ children, hint }) => (
  <div className="mb-4 flex items-baseline justify-between gap-3">
    <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink">{children}</h2>
    {hint && <span className="text-xs text-ink-muted">{hint}</span>}
  </div>
);

/* ---------- reviews ---------- */
function ReviewsSection({ hostelId, user, reviews, setReviews, canReview }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const isMine = (r) => user && (r.user === user._id || r.user?._id === user._id);
  const alreadyReviewed = reviews.some(isMine);
  const visible = showAll ? reviews : reviews.slice(0, 3);

  const resetForm = () => {
    setShowForm(false);
    setRating(0);
    setComment("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast({ title: "Select a star rating", variant: "destructive" });
    if (comment.trim().length < 5)
      return toast({ title: "Write at least 5 characters", variant: "destructive" });
    setSubmitting(true);
    try {
      const res = await api.post(`/api/hostel/${hostelId}/reviews`, { rating, comment: comment.trim() });
      setReviews((prev) => [res.data.review, ...prev]);
      resetForm();
      toast({ title: "Review posted" });
    } catch (err) {
      const status = err?.response?.status;
      toast({
        title:
          status === 403
            ? "Only guests with a confirmed booking can review."
            : status === 409
              ? "You've already reviewed this hostel."
              : err?.response?.data?.message || "Couldn't post your review. Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId);
    try {
      await api.delete(`/api/hostel/${hostelId}/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
      toast({ title: "Review deleted" });
    } catch (err) {
      toast({ title: err?.response?.data?.message || "Couldn't delete the review", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const note = (text, withCheck) => (
    <p className="flex items-center gap-2 text-sm text-ink-muted">
      {withCheck && <Check className="h-4 w-4 text-emerald-500" />}
      {text}
    </p>
  );

  const cta = () => {
    if (!user)
      return (
        <p className="text-sm text-ink-muted">
          <a href="/login" className="font-medium text-primary hover:underline">Log in</a> to write a review.
        </p>
      );
    if (alreadyReviewed) return note("You've reviewed this hostel.", true);
    if (!canReview) return note("Guests with a confirmed booking can leave a review.");
    if (!showForm)
      return (
        <Button className="rounded-full bg-primary px-5 text-on-primary hover:bg-primary-hover" onClick={() => setShowForm(true)}>
          Write a review
        </Button>
      );
    return (
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-hairline bg-white p-5">
        <StarPicker value={rating} onChange={setRating} />
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What was your stay like?"
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-hairline bg-white p-3 text-sm text-ink outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-ink-muted">{comment.length}/1000</p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="rounded-full bg-primary px-5 text-on-primary hover:bg-primary-hover">
            {submitting ? "Posting…" : "Post review"}
          </Button>
          <Button type="button" variant="outline" className="rounded-full" onClick={resetForm}>Cancel</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-5">
      {reviews.length > 0 && (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-3">
            <p className="text-5xl font-semibold tracking-tight text-ink">{avg.toFixed(1)}</p>
            <div>
              <Stars value={avg} />
              <p className="mt-1 text-xs text-ink-muted">
                {reviews.length} review{reviews.length !== 1 && "s"}
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="w-2">{star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                    <div className="h-full bg-amber-400" style={{ width: `${(count / reviews.length) * 100}%` }} />
                  </div>
                  <span className="w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cta()}

      {reviews.length === 0 ? (
        <p className="text-sm text-ink-muted">No reviews yet. Guests who stay here can be the first.</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {visible.map((review) => {
            const reviewId = review._id || review.id;
            const canDelete = isMine(review) || user?.role === "admin";
            return (
              <li key={reviewId} className="flex gap-3 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                  {review.img ? (
                    <img src={review.img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-ink">{review.name || "Anonymous"}</h4>
                      <Stars value={review.rating} size="h-3 w-3" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      {review.createdAt &&
                        new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(reviewId)}
                          disabled={deletingId === reviewId}
                          className="transition hover:text-destructive"
                          aria-label="Delete review"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 break-words text-sm text-ink-muted">{review.comment}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {reviews.length > 3 && (
        <Button variant="outline" className="rounded-full" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${reviews.length} reviews`}
        </Button>
      )}
    </div>
  );
}

/* ---------- page ---------- */
export default function HostelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [hostel, setHostel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [myBookings, setMyBookings] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [carouselApi, setCarouselApi] = useState(null);
  const [slide, setSlide] = useState({ current: 1, count: 0 });
  const [activeSection, setActiveSection] = useState("rooms");

  useEffect(() => {
    let cancelled = false;

    const fetchBackend = async () => {
      try {
        const res = await api.get(`/api/hostel/${id}`);
        if (!cancelled) setReviews(res.data?.reviews || []);
      } catch (err) {
        console.error("[HostelDetails] backend fetch failed:", err);
      }
    };

    const fetchAvailability = async () => {
      try {
        const res = await getAvailability(id, todayISO(), tomorrowISO());
        if (cancelled) return;
        const row = res.data?.calendar?.find((d) => d.date === todayISO());
        if (row?.rooms) {
          const map = {};
          Object.entries(row.rooms).forEach(([k, v]) => (map[k] = v.available ?? 0));
          setAvailabilityMap(map);
        }
      } catch (err) {
        console.warn("[HostelDetails] availability fetch failed:", err);
      }
    };

    const fetchCms = async () => {
      try {
        const entry = await fetchEntryById("hostel", id);
        if (!cancelled) setHostel(entry);
      } catch (err) {
        console.error("[HostelDetails] CMS fetch failed:", err);
        if (!cancelled) setHostel(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    onEntryChange(fetchCms);
    fetchCms();
    fetchBackend();
    fetchAvailability();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setMyBookings([]);
      return;
    }
    getMyBookings()
      .then((res) => !cancelled && setMyBookings(res.data || []))
      .catch(() => !cancelled && setMyBookings([]));
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (hostel?.title) document.title = `${hostel.title} | Travel Tribe`;
  }, [hostel]);

  useEffect(() => {
    if (!carouselApi) return;
    const update = () =>
      setSlide({ current: carouselApi.selectedScrollSnap() + 1, count: carouselApi.scrollSnapList().length });
    update();
    carouselApi.on("select", update);
    return () => carouselApi.off("select", update);
  }, [carouselApi]);

  const canReview = useMemo(
    () => !!user && myBookings.some((b) => b.hostelId === id && b.status === "confirmed"),
    [myBookings, user, id]
  );

  const rooms = useMemo(() => {
    if (!hostel?.room_types) return [];
    return hostel.room_types.map((r) => {
      const total = Number(r.total_beds) || 0;
      const live = availabilityMap[r.room_key];
      const available = typeof live === "number" ? live : total;
      return { ...r, total_beds: total, available_beds: available, is_available: available > 0 };
    });
  }, [hostel, availabilityMap]);

  // Default the selection to the cheapest room that still has beds
  useEffect(() => {
    if (!rooms.length || rooms.some((r) => r.room_key === selectedKey && r.is_available)) return;
    const pick = [...rooms]
      .filter((r) => r.is_available)
      .sort((a, b) => Number(a.base_price) - Number(b.base_price))[0];
    setSelectedKey(pick?.room_key ?? null);
  }, [rooms, selectedKey]);

  const selectedRoom = rooms.find((r) => r.room_key === selectedKey) || null;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const sections = useMemo(
    () =>
      [
        { id: "rooms", label: "Rooms", show: true },
        { id: "facilities", label: "Facilities", show: hostel?.facilities?.some((k) => FACILITY_MAP[k]) },
        { id: "food", label: "Food", show: !!hostel?.food_info },
        { id: "rules", label: "House rules", show: hostel?.house_rules?.length > 0 },
        { id: "reviews", label: `Reviews${reviews.length ? ` (${reviews.length})` : ""}`, show: true },
      ].filter((s) => s.show),
    [hostel, reviews.length]
  );

  // Highlight the tab for the section currently in view
  useEffect(() => {
    if (!hostel) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [hostel, sections]);

  const scrollTo = (sectionId) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToBooking = () => {
    if (!selectedRoom || !hostel?.uid) return;
    navigate(`/hostel/${hostel.uid}/book?room=${selectedRoom.room_key}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: hostel?.title, text: `Check out ${hostel?.title}`, url: window.location.href });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied" });
    }
  };

  if (loading) return <Loading />;

  if (!hostel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <p className="text-lg font-medium text-ink">We couldn't find this hostel</p>
        <p className="text-sm text-ink-muted">It may have been removed, or the link is incorrect.</p>
        <Button onClick={() => navigate("/hostel")} className="rounded-full">Browse all hostels</Button>
      </div>
    );
  }

  const type = HOSTEL_TYPE_MAP[hostel.type];
  const facilityKeys = (hostel.facilities || []).filter((k) => FACILITY_MAP[k]);
  const shownFacilities = showAllFacilities ? facilityKeys : facilityKeys.slice(0, 8);
  const food = hostel.food_info;

  const BookCard = () => (
    <div className="rounded-lg border border-hairline bg-white p-5">
      {selectedRoom ? (
        <>
          <p className="text-sm text-ink-muted">{selectedRoom.room_name}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            ₹{selectedRoom.base_price}
            <span className="text-sm font-normal text-ink-muted"> / day</span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {selectedRoom.available_beds} bed{selectedRoom.available_beds !== 1 && "s"} left tonight
          </p>
          <Button
            onClick={goToBooking}
            className="mt-4 h-11 w-full rounded-full bg-primary text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            Choose dates and book
          </Button>
          <p className="mt-2 text-center text-xs text-ink-muted">You pick your dates on the next step.</p>
        </>
      ) : (
        <p className="text-center text-sm text-ink-muted">
          {rooms.length ? "All rooms are sold out tonight. Check other dates on the booking page." : "No rooms listed yet."}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="relative flex min-h-screen w-full flex-col bg-paper text-ink">
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <Header />
        </div>
        <Toaster />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-40 pt-10 sm:px-8 sm:pt-14 lg:px-12 lg:pb-32">
          <nav className="mb-4 text-xs text-ink-muted" aria-label="Breadcrumb">
            <button onClick={() => navigate("/hostel")} className="hover:text-primary">Hostels</button>
            <span className="mx-2">/</span>
            <span className="text-ink">{hostel.title}</span>
          </nav>

          {/* Title block */}
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">{hostel.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted">
                {reviews.length > 0 && (
                  <button onClick={() => scrollTo("reviews")} className="flex items-center gap-1.5 hover:text-primary">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-ink">{avg.toFixed(1)}</span>
                    <span className="underline-offset-2 hover:underline">({reviews.length})</span>
                  </button>
                )}
                {type && (
                  <span className="flex items-center gap-1.5">
                    <type.Icon className={`${ic} ${type.color}`} />
                    {type.label}
                  </span>
                )}
                <span className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {hostel.address}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleShare}
              className="h-9 shrink-0 rounded-full border-hairline-strong text-ink hover:border-primary/40 hover:text-primary"
            >
              <Share2 className="mr-2 h-3.5 w-3.5" />
              Share
            </Button>
          </header>

          {/* Gallery */}
          {hostel.images?.length > 0 && (
            <div className="relative mb-8 overflow-hidden rounded-xl bg-primary/5">
              <Carousel setApi={setCarouselApi} opts={{ loop: hostel.images.length > 1 }}>
                <CarouselContent>
                  {hostel.images.map((image, idx) => (
                    <CarouselItem key={idx}>
                      <div className="h-64 w-full sm:h-80 md:h-[26rem]">
                        <img
                          src={image?.url}
                          alt={`${hostel.title}, photo ${idx + 1}`}
                          loading={idx === 0 ? "eager" : "lazy"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {hostel.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3 border-0 bg-white/90 shadow-sm" />
                    <CarouselNext className="right-3 border-0 bg-white/90 shadow-sm" />
                  </>
                )}
              </Carousel>
              {slide.count > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                  {slide.current} / {slide.count}
                </span>
              )}
            </div>
          )}

          {/* Section tabs */}
          <div className="sticky top-0 z-30 -mx-5 mb-8 border-b border-hairline bg-paper/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
            <div className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    activeSection === s.id ? "bg-primary text-on-primary" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-12">
              {/* Contact + nearby: compact intro */}
              {(hostel.contact?.phone || hostel.contact?.email || hostel.google_map_link || hostel.nearby_college?.length > 0) && (
                <section className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {hostel.contact?.phone && (
                      <a href={`tel:${hostel.contact.phone}`} className="flex items-center gap-2 hover:text-primary">
                        <Phone className={`${ic} text-primary`} />+91 {hostel.contact.phone}
                      </a>
                    )}
                    {hostel.contact?.email && (
                      <a href={`mailto:${hostel.contact.email}`} className="flex items-center gap-2 hover:text-primary">
                        <Mail className={`${ic} text-primary`} />{hostel.contact.email}
                      </a>
                    )}
                    {hostel.contact?.name && (
                      <span className="flex items-center gap-2 text-ink-muted">
                        <User className={`${ic} text-primary`} />{hostel.contact.name}
                      </span>
                    )}
                    {hostel.google_map_link && (
                      <a
                        href={hostel.google_map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-medium text-primary hover:underline"
                      >
                        <MapPin className={ic} />Open in Google Maps
                      </a>
                    )}
                  </div>
                  {hostel.nearby_college?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <GraduationCap className={`${ic} text-primary`} />
                      <span className="text-ink-muted">Near</span>
                      {hostel.nearby_college.map((c, i) => (
                        <span key={i} className="rounded-full border border-hairline bg-white px-3 py-1 text-xs text-ink">{c}</span>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Rooms */}
              <section id="rooms" className="scroll-mt-20">
                <SectionTitle hint="Availability shown for tonight">Choose a room</SectionTitle>
                {rooms.length > 0 ? (
                  <div className="space-y-3" role="radiogroup" aria-label="Room type">
                    {rooms.map((room) => {
                      const selected = room.room_key === selectedKey;
                      const pct = room.total_beds ? (room.available_beds / room.total_beds) * 100 : 0;
                      const low = room.is_available && room.available_beds <= 3;
                      return (
                        <button
                          key={room.room_key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={!room.is_available}
                          onClick={() => setSelectedKey(room.room_key)}
                          className={`w-full rounded-lg border bg-white p-4 text-left transition sm:p-5 ${
                            selected ? "border-primary ring-2 ring-primary/20" : "border-hairline hover:border-primary/40"
                          } ${!room.is_available ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <BedSingle className={`${ic} text-primary`} />
                                <h3 className="font-medium text-ink">{room.room_name}</h3>
                              </div>
                              {room.description && <p className="mt-1 text-sm text-ink-muted">{room.description}</p>}
                            </div>
                            <p className="shrink-0 text-right text-lg font-semibold">
                              ₹{room.base_price}
                              <span className="block text-xs font-normal text-ink-muted">per day</span>
                            </p>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-border-subtle">
                              <div
                                className={`h-full ${low ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs ${low ? "font-medium text-amber-600" : "text-ink-muted"}`}>
                              {room.is_available
                                ? low
                                  ? `Only ${room.available_beds} left`
                                  : `${room.available_beds} of ${room.total_beds} beds free`
                                : "Sold out tonight"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">This hostel hasn't listed rooms yet.</p>
                )}
              </section>

              {/* Facilities */}
              {facilityKeys.length > 0 && (
                <section id="facilities" className="scroll-mt-20">
                  <SectionTitle>Facilities</SectionTitle>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    {shownFacilities.map((key) => {
                      const { Icon, label, color } = FACILITY_MAP[key];
                      return (
                        <div key={key} className="flex items-center gap-3 text-sm">
                          <Icon className={`${ic} ${color}`} />
                          {label}
                        </div>
                      );
                    })}
                  </div>
                  {facilityKeys.length > 8 && (
                    <Button variant="outline" className="mt-4 rounded-full" onClick={() => setShowAllFacilities((v) => !v)}>
                      {showAllFacilities ? "Show fewer" : `Show all ${facilityKeys.length} facilities`}
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showAllFacilities ? "rotate-180" : ""}`} />
                    </Button>
                  )}
                </section>
              )}

              {/* Food */}
              {food && (
                <section id="food" className="scroll-mt-20">
                  <SectionTitle>Food and meals</SectionTitle>
                  {food.available ? (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
                      <p className="flex items-center gap-2 font-medium text-ink">
                        <CircleCheck className="h-4 w-4 text-emerald-600" />
                        Meals available
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-normal text-emerald-800">Optional</span>
                      </p>
                      <dl className="mt-3 grid gap-1.5">
                        {food.food_type?.length > 0 && (
                          <div className="flex gap-2"><dt className="w-24 text-ink-muted">Type</dt><dd>{food.food_type.join(", ")}</dd></div>
                        )}
                        {food.meals?.length > 0 && (
                          <div className="flex gap-2"><dt className="w-24 text-ink-muted">Meals</dt><dd>{food.meals.join(", ")}</dd></div>
                        )}
                        {food.extra_cost != null && food.extra_cost !== "" && (
                          <div className="flex gap-2"><dt className="w-24 text-ink-muted">Extra cost</dt><dd>₹{food.extra_cost} per day</dd></div>
                        )}
                      </dl>
                      {food.notes && <p className="mt-3 border-t border-emerald-100 pt-3 text-xs text-ink-muted">{food.notes}</p>}
                    </div>
                  ) : (
                    <p className="flex items-center gap-3 text-sm text-ink-muted">
                      <UtensilsCrossed className={ic} />
                      No meals are provided. Guests arrange their own food.
                    </p>
                  )}
                </section>
              )}

              {/* House rules */}
              {hostel.house_rules?.length > 0 && (
                <section id="rules" className="scroll-mt-20">
                  <SectionTitle>House rules</SectionTitle>
                  <ul className="space-y-2 text-sm">
                    {hostel.house_rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Reviews */}
              <section id="reviews" className="scroll-mt-20">
                <SectionTitle>Guest reviews</SectionTitle>
                <ReviewsSection hostelId={id} user={user} reviews={reviews} setReviews={setReviews} canReview={canReview} />
              </section>
            </div>

            {/* Desktop booking card */}
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                {BookCard()}
              </div>
            </aside>
          </div>
        </main>

        {/* Mobile booking bar, sits above the floating nav */}
        {selectedRoom && (
          <div className="fixed inset-x-0 bottom-20 z-30 px-4 lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-hairline bg-white py-2 pl-5 pr-2 shadow-lg">
              <div className="min-w-0">
                <p className="truncate text-xs text-ink-muted">{selectedRoom.room_name}</p>
                <p className="font-semibold">
                  ₹{selectedRoom.base_price}
                  <span className="text-xs font-normal text-ink-muted"> / day</span>
                </p>
              </div>
              <Button onClick={goToBooking} className="h-10 rounded-full bg-primary px-5 text-on-primary hover:bg-primary-hover">
                Book
              </Button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </TooltipProvider>
  );
}