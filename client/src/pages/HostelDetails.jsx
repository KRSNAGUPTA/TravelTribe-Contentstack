import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  MapPin,
  Utensils,
  ShieldCheck,
  Wifi,
  ParkingCircle,
  Share2,
  Star,
  User,
  Calendar,
  Clock,
  BookOpen,
  School,
  Phone,
  Mail,
  ChevronRight,
  Building,
  ShowerHead,
  UtensilsCrossed,
  GraduationCap,
  HeartPulse,
  Contact,
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
  XCircle,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import api from "@/api";
import { toast } from "@/hooks/use-toast";
import Loading from "./Loading";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntryById } from "@/contentstack/utils";
import { AuthContext } from "@/context/AuthContext";

const todayISO = () => new Date().toISOString().split("T")[0];
const tomorrowISO = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

// ─── Star picker ────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-border-strong"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Reviews ────────────────────────────────────────────────────────────────
function ReviewsSection({ hostelId, user, reviews, setReviews }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const userAlreadyReviewed = user
    ? reviews.some((r) => r.user === user._id || r.user?._id === user._id)
    : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast({ title: "Please select a star rating", variant: "destructive" });
      return;
    }
    if (comment.trim().length < 5) {
      toast({
        title: "Comment must be at least 5 characters",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/hostel/${hostelId}/reviews`, {
        rating,
        comment: comment.trim(),
      });
      setReviews((prev) => [res.data.review, ...prev]);
      setRating(0);
      setComment("");
      setShowForm(false);
      toast({ title: "Review submitted" });
    } catch (err) {
      toast({
        title: err?.response?.data?.message || "Failed to submit review",
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
      toast({
        title: err?.response?.data?.message || "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {reviews.length > 0 && (
        <div className="flex items-center gap-6 rounded-lg border border-hairline bg-white p-5">
          <div className="text-center">
            <p className="text-3xl font-semibold text-ink">
              {avgRating.toFixed(1)}
            </p>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-border-strong"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div
                  key={star}
                  className="flex items-center gap-2 text-xs text-ink-muted"
                >
                  <span className="w-2">{star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review CTA / form */}
      {user ? (
        userAlreadyReviewed ? (
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-white p-4 text-sm text-ink-muted">
            <Check className="h-4 w-4 text-emerald-500" />
            You have already reviewed this hostel.
          </div>
        ) : showForm ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-hairline bg-white p-5"
          >
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Rating</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Comment</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience"
                rows={4}
                maxLength={1000}
                className="w-full resize-none rounded-lg border border-hairline bg-white p-3 text-sm text-ink outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-right text-xs text-ink-muted">
                {comment.length}/1000
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-5 text-on-primary hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? "Submitting" : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setShowForm(false);
                  setRating(0);
                  setComment("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            className="rounded-full bg-primary px-5 text-on-primary hover:bg-primary-hover"
            onClick={() => setShowForm(true)}
          >
            Write a review
          </Button>
        )
      ) : (
        <div className="rounded-lg border border-hairline bg-white p-4 text-sm text-ink-muted">
          <a
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Log in
          </a>{" "}
          to write a review.
        </div>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-white p-8 text-center">
          <Star className="mx-auto h-8 w-8 text-border-strong" />
          <p className="mt-2 text-sm font-medium text-ink">No reviews yet</p>
          <p className="text-xs text-ink-muted">
            Be the first to share your experience
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const reviewId = review._id || review.id;
            const isOwner =
              user &&
              (review.user === user._id || review.user?._id === user._id);
            const isAdmin = user?.role === "admin";

            return (
              <li
                key={reviewId}
                className="flex gap-3 rounded-lg border border-hairline bg-white p-4"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                  {review.img ? (
                    <img
                      src={review.img}
                      alt={review.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-ink">
                      {review.name || "Anonymous"}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-border-strong"
                            }`}
                          />
                        ))}
                      </div>
                      {(isOwner || isAdmin) && (
                        <button
                          onClick={() => handleDelete(reviewId)}
                          disabled={deletingId === reviewId}
                          className="text-ink-muted transition hover:text-destructive"
                          title="Delete review"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 break-words text-sm text-ink-muted">
                    {review.comment}
                  </p>

                  {review.createdAt && (
                    <p className="mt-1 text-xs text-ink-muted/70">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function HostelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [hostel, setHostel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [userData, setUserData] = useState(null);
  const plugin = useRef(null);

  useEffect(() => setUserData(user), [user]);

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
        const res = await api.get("/api/hostel/availability", {
          params: {
            hostelId: id,
            checkIn: todayISO(),
            checkOut: tomorrowISO(),
          },
        });
        if (cancelled) return;
        const row = res.data?.calendar?.find((d) => d.date === todayISO());
        if (row?.rooms) {
          const map = {};
          Object.entries(row.rooms).forEach(([k, v]) => {
            map[k] = v.available ?? 0;
          });
          setAvailabilityMap(map);
        }
      } catch (err) {
        console.warn("[HostelDetails] availability fetch failed:", err);
      }
    };

    const fetchCms = async () => {
      try {
        const entry = await fetchEntryById("hostel", id);

        if (cancelled) return;
        setHostel(entry);
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
  }, [id, user?.email, user?.name]);

  useEffect(() => {
    if (hostel?.title) document.title = `${hostel.title} | Travel Tribe`;
  }, [hostel]);

  const mergedRooms = useMemo(() => {
    if (!hostel?.room_types) return [];
    return hostel.room_types.map((cmsRoom) => {
      const total = Number(cmsRoom.total_beds) || 0;
      const live = availabilityMap[cmsRoom.room_key];
      const available = typeof live === "number" ? live : total;
      return {
        ...cmsRoom,
        total_beds: total,
        available_beds: available,
        is_available: available > 0,
      };
    });
  }, [hostel, availabilityMap]);

  const minRoom = useMemo(() => {
    if (!hostel?.room_types?.length) return null;
    return hostel.room_types.reduce((min, r) =>
      Number(r.base_price) < Number(min.base_price) ? r : min,
    );
  }, [hostel]);

  const goToBooking = ({ roomKey, roomPrice, source }) => {
    if (!roomKey || !hostel?.uid) return;
    navigate(`/hostel/${hostel.uid}/book?room=${roomKey}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hostel?.title,
          text: `Check out ${hostel?.title}`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied" });
    }
  };

  if (loading) return <Loading />;

  if (!hostel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <p className="text-lg font-medium text-ink">Hostel not found</p>
        <Button onClick={() => navigate("/hostels")} className="rounded-full">
          Back to hostels
        </Button>
      </div>
    );
  }

  const i = "h-4 w-4";
  const FACILITY_MAP = {
    wifi: {
      label: "Free Wi-Fi",
      icon: <Wifi className={`${i} text-sky-600`} />,
    },
    parking: {
      label: "Parking",
      icon: <ParkingCircle className={`${i} text-slate-600`} />,
    },
    cctv: { label: "CCTV", icon: <Cctv className={`${i} text-indigo-600`} /> },
    security_guard: {
      label: "24×7 Security",
      icon: <ShieldCheck className={`${i} text-emerald-600`} />,
    },
    drinking_water: {
      label: "Drinking Water",
      icon: <Droplets className={`${i} text-blue-600`} />,
    },
    lockers: {
      label: "Lockers",
      icon: <LockKeyhole className={`${i} text-slate-600`} />,
    },
    wheelchair_access: {
      label: "Wheelchair Access",
      icon: <Accessibility className={`${i} text-teal-600`} />,
    },
    fire_safety: {
      label: "Fire Safety",
      icon: <Flame className={`${i} text-amber-600`} />,
    },
    first_aid: {
      label: "First Aid",
      icon: <HeartPulse className={`${i} text-rose-600`} />,
    },
    ac: {
      label: "Air Conditioner",
      icon: <Snowflake className={`${i} text-cyan-600`} />,
    },
    "non-ac": {
      label: "Non-AC",
      icon: <Fan className={`${i} text-slate-500`} />,
    },
    hot_water: {
      label: "Hot Water",
      icon: <ShowerHead className={`${i} text-orange-600`} />,
    },
    laundry: {
      label: "Laundry",
      icon: <WashingMachine className={`${i} text-indigo-500`} />,
    },
    power_backup: {
      label: "Power Backup",
      icon: <BatteryCharging className={`${i} text-lime-600`} />,
    },
    housekeeping: {
      label: "Housekeeping",
      icon: <House className={`${i} text-emerald-500`} />,
    },
    study_area: {
      label: "Study Area",
      icon: <BookOpen className={`${i} text-violet-600`} />,
    },
    tv: {
      label: "Television",
      icon: <TvMinimalPlayIcon className={`${i} text-fuchsia-600`} />,
    },
    common_area: {
      label: "Common Area",
      icon: <Users className={`${i} text-purple-600`} />,
    },
    kitchen: {
      label: "Kitchen",
      icon: <CookingPot className={`${i} text-amber-700`} />,
    },
    microwave: {
      label: "Microwave",
      icon: <Microwave className={`${i} text-pink-600`} />,
    },
  };

  const HOSTEL_TYPE_MAP = {
    Boys: { label: "Boys Only", icon: Mars, color: "text-blue-600" },
    Girls: { label: "Girls Only", icon: Venus, color: "text-pink-600" },
    Unisex: { label: "Unisex", icon: VenusAndMars, color: "text-purple-600" },
  };

  return (
    <TooltipProvider>
      <div className="relative flex min-h-screen w-full flex-col bg-paper text-ink">
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <Header />
        </div>
        <Toaster />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-32 pt-10 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16">
          {/* ── Breadcrumb ── */}
          <nav className="mb-4 text-xs text-ink-muted">
            <button
              onClick={() => navigate("/hostels")}
              className="transition-colors hover:text-primary"
            >
              Hostels
            </button>
            <span className="mx-2">/</span>
            <span className="text-ink">{hostel.title}</span>
          </nav>

          {/* ── Title + share ── */}
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-3xl">
                {hostel.title}
              </h1>
              <div className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-muted">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="max-w-xl">{hostel.address}</p>
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

          {/* ── Images ── */}
          {hostel.images?.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-lg bg-primary/5">
              <Carousel plugins={plugin.current ? [plugin.current] : []}>
                <CarouselContent>
                  {hostel.images.map((image, idx) => (
                    <CarouselItem key={idx}>
                      <div className="relative h-60 w-full sm:h-80 md:h-96">
                        <img
                          src={image?.url}
                          alt={`${hostel.title} ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          )}

          {/* ── Two column: info + booking sidebar ── */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* LEFT: content */}
            <div className="space-y-10">
              {/* Overview */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-ink">
                  About this hostel
                </h2>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  {hostel.type && HOSTEL_TYPE_MAP[hostel.type] && (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const {
                          icon: Icon,
                          label,
                          color,
                        } = HOSTEL_TYPE_MAP[hostel.type];
                        return (
                          <>
                            <Icon className={`${i} ${color}`} />
                            <span className="text-ink-muted">Type:</span>
                            <span className="font-medium text-ink">
                              {label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {hostel?.contact?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className={`${i} text-primary`} />
                      <span className="text-ink-muted">Phone:</span>
                      <a
                        href={`tel:${hostel.contact.phone}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        +91 {hostel.contact.phone}
                      </a>
                    </div>
                  )}
                  {hostel?.contact?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className={`${i} text-primary`} />
                      <span className="text-ink-muted">Email:</span>
                      <a
                        href={`mailto:${hostel.contact.email}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        {hostel.contact.email}
                      </a>
                    </div>
                  )}
                  {hostel?.contact?.name && (
                    <div className="flex items-center gap-2">
                      <User className={`${i} text-primary`} />
                      <span className="text-ink-muted">Contact:</span>
                      <span className="font-medium text-ink">
                        {hostel.contact.name}
                      </span>
                    </div>
                  )}
                </div>

                {hostel?.google_map_link && (
                  <a
                    href={hostel.google_map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4" />
                    View on Google Maps
                  </a>
                )}
              </section>

              {/* Rooms */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-ink">
                  Rooms & pricing
                </h2>

                {mergedRooms.length > 0 ? (
                  <div className="divide-y divide-border-subtle rounded-lg border border-hairline bg-white">
                    {mergedRooms.map((room) => (
                      <div key={room.room_key} className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <BedSingle className={`${i} text-primary`} />
                              <h3 className="text-base font-medium text-ink">
                                {room.room_name}
                              </h3>
                            </div>
                            {room.description && (
                              <p className="mt-1 text-sm text-ink-muted">
                                {room.description}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-ink-muted">
                              {room.is_available
                                ? `${room.available_beds} of ${room.total_beds} beds available`
                                : "Sold out"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-semibold text-ink">
                              ₹{room.base_price}
                              <span className="text-xs font-normal text-ink-muted">
                                {" "}
                                / day
                              </span>
                            </p>
                            <Button
                              disabled={!room.is_available}
                              onClick={() =>
                                goToBooking({
                                  roomKey: room.room_key,
                                  roomPrice: room.base_price,
                                  source: "room_card",
                                })
                              }
                              className="mt-2 h-9 rounded-full bg-primary px-4 text-xs font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-border-strong/40 disabled:text-ink-muted"
                            >
                              {room.is_available ? "Book" : "Sold out"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">No rooms listed yet.</p>
                )}
              </section>

              {/* Facilities */}
              {hostel?.facilities?.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-ink">
                    Facilities
                  </h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {hostel.facilities.map((key) => {
                      const f = FACILITY_MAP[key];
                      if (!f) return null;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
                        >
                          {f.icon}
                          <span className="text-ink">{f.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Food */}
              {hostel.food_info && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-ink">
                    Food & meals
                  </h2>

                  {hostel.food_info.available ? (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 text-sm">
                      <div className="flex items-center gap-2 font-medium text-emerald-700">
                        <CircleCheck className="h-4 w-4 text-emerald-500" />
                        Food available
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-normal">
                          Optional
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-ink">
                        {hostel.food_info.food_type?.length > 0 && (
                          <p>
                            <span className="text-ink-muted">Type: </span>
                            {hostel.food_info.food_type.join(", ")}
                          </p>
                        )}
                        {hostel.food_info.meals?.length > 0 && (
                          <p>
                            <span className="text-ink-muted">Meals: </span>
                            {hostel.food_info.meals.join(", ")}
                          </p>
                        )}
                        {hostel.food_info.extra_cost && (
                          <p>
                            <span className="text-ink-muted">Extra cost: </span>
                            ₹{hostel.food_info.extra_cost} / day
                          </p>
                        )}
                      </div>
                      {hostel.food_info.notes && (
                        <p className="mt-2 border-t border-emerald-100 pt-2 text-xs text-ink-muted">
                          {hostel.food_info.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white p-4 text-sm">
                      <UtensilsCrossed className={`${i} text-ink-muted`} />
                      <span className="text-ink-muted">
                        Food is not available. Residents arrange meals
                        independently.
                      </span>
                    </div>
                  )}
                </section>
              )}

              {/* Nearby colleges */}
              {hostel?.nearby_college?.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-ink">
                    Nearby colleges
                  </h2>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {hostel.nearby_college.map((c, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
                      >
                        <GraduationCap className={`${i} text-primary`} />
                        <span className="text-ink">{c}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* House rules */}
              {hostel?.house_rules?.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-ink">
                    House rules
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {hostel.house_rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-ink">
                        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Reviews */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-ink">Reviews</h2>
                <ReviewsSection
                  hostelId={id}
                  user={userData}
                  reviews={reviews}
                  setReviews={setReviews}
                />
              </section>
            </div>

            {/* RIGHT: booking sidebar */}
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-lg border border-hairline bg-white p-5">
                {minRoom ? (
                  <>
                    <p className="text-xs uppercase tracking-wider text-ink-muted">
                      Starts from
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-ink">
                      ₹{minRoom.base_price}
                      <span className="text-sm font-normal text-ink-muted">
                        {" "}
                        / day
                      </span>
                    </p>

                    <Button
                      onClick={() =>
                        goToBooking({
                          roomKey: minRoom.room_key,
                          roomPrice: minRoom.base_price,
                          source: "sidebar_book",
                        })
                      }
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-on-primary hover:bg-primary-hover"
                    >
                      <Calendar className="h-4 w-4" />
                      Book now
                    </Button>

                    <p className="mt-3 text-center text-xs text-ink-muted">
                      Security deposit refundable at checkout
                    </p>
                  </>
                ) : (
                  <p className="text-center text-sm text-ink-muted">
                    No rooms available
                  </p>
                )}
              </div>
            </aside>
          </div>

          {/* Recently viewed */}
          {/* <section className="mt-14">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              Recently viewed
            </h2>
            <RecentlyViewedHostel email={user?.email || null} />
          </section> */}
        </main>

        <Footer />
      </div>
    </TooltipProvider>
  );
}
