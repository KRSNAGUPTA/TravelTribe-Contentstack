import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BedDouble, Phone, Mail, User, AlertCircle, ChevronRight, ChevronLeft, Check,
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
import { getAvailability } from "@/services/bookingApi";
import { cn } from "@/lib/utils";

/* ---------- date helpers (all local time, "YYYY-MM-DD" strings) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const today = () => toISO(new Date());
const addDaysISO = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const nightsBetween = (a, b) =>
  a && b ? Math.max(0, Math.round((parseISO(b) - parseISO(a)) / 86400000)) : 0;
const formatShortDate = (iso) =>
  iso ? parseISO(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/* ---------- range calendar ---------- */
function RangeCalendar({ month, onMonthChange, checkIn, checkOut, onPick, availableOn, canCheckOut, showCounts }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const todayStr = today();
  const atCurrentMonth =
    first.getFullYear() === new Date().getFullYear() && first.getMonth() === new Date().getMonth();
  const step = (n) => onMonthChange(new Date(first.getFullYear(), first.getMonth() + n, 1));
  const choosingCheckout = checkIn && !checkOut;

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(<div key={`b${i}`} className="h-10" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(new Date(first.getFullYear(), first.getMonth(), d));
    const left = availableOn(iso);
    const past = iso < todayStr;
    const asCheckout = choosingCheckout && iso > checkIn;
    const disabled = past || (asCheckout ? !canCheckOut(iso) : left !== null && left <= 0);
    const isStart = iso === checkIn;
    const isEnd = iso === checkOut;
    const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut;
    const full = left !== null && left <= 0;

    cells.push(
      <button
        key={iso}
        type="button"
        disabled={disabled}
        onClick={() => onPick(iso)}
        aria-pressed={isStart || isEnd}
        aria-label={`${parseISO(iso).toDateString()}${left !== null ? `, ${full ? "full" : `${left} beds left`}` : ""}`}
        className={cn(
          "flex h-10 flex-col items-center justify-center rounded-md text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
          isStart || isEnd
            ? "bg-primary text-on-primary"
            : inRange
              ? "bg-primary/10 text-ink"
              : "hover:bg-primary/10",
          disabled && !(isStart || isEnd) && "cursor-not-allowed opacity-40 hover:bg-transparent",
          iso === todayStr && !(isStart || isEnd) && "ring-1 ring-inset ring-primary/40"
        )}
      >
        <span className={cn(isStart || isEnd ? "font-semibold" : "")}>{d}</span>
        {showCounts && left !== null && !past && (
          <span
            className={cn(
              "text-[0.6rem] leading-none",
              isStart || isEnd ? "text-on-primary/80" : full ? "text-destructive" : left <= 3 ? "text-amber-600" : "text-ink-muted"
            )}
          >
            {full ? "Full" : left}
          </span>
        )}
      </button>
    );
  }

  while (cells.length < 42) cells.push(<div key={`t${cells.length}`} className="h-10" />);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atCurrentMonth}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium text-ink">
          {first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-ink-muted">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-0.5">{w}</div>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5">{cells}</div>
    </div>
  );
}

/* ---------- page ---------- */
export default function HostelBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [hostel, setHostel] = useState(null);
  const [loadingHostel, setLoadingHostel] = useState(true);
  const [step, setStep] = useState(1);
  const [month, setMonth] = useState(() => new Date());
  const [availMap, setAvailMap] = useState({}); // "roomKey|YYYY-MM-DD" -> beds available
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [form, setForm] = useState({
    checkIn: "", checkOut: "", roomSelection: searchParams.get("room") || "",
    name: "", email: "", phone: "", gender: "",
  });

  const formRef = useRef(null);
  const pane = (n) =>
    cn(
      "col-start-1 row-start-1 flex flex-col gap-5 transition-[opacity,visibility] duration-200 motion-reduce:transition-none",
      step === n ? "visible opacity-100" : "invisible opacity-0"
    );

  // Keep the form in view when switching steps, without moving the page otherwise
  useEffect(() => {
    const top = formRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 24, behavior: "smooth" });
  }, [step]);

  const cmsRooms = hostel?.room_types || [];
  const selectedRoom = cmsRooms.find((r) => r.room_key === form.roomSelection) || null;
  const nights = nightsBetween(form.checkIn, form.checkOut);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingHostel(true);
        const entry = await fetchEntryById("hostel", id);
        if (!entry) throw new Error("Hostel not found");
        if (cancelled) return;
        setHostel(entry);
        setForm((f) =>
          entry.room_types?.some((r) => r.room_key === f.roomSelection)
            ? f
            : { ...f, roomSelection: entry.room_types?.[0]?.room_key || "" }
        );
      } catch (err) {
        if (!cancelled)
          toast({ title: "Couldn't load this hostel", description: err.message || "Try again in a moment.", variant: "destructive" });
      } finally {
        if (!cancelled) setLoadingHostel(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, toast]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: f.email || user.email || "",
      phone: f.phone || user.phone || "",
      gender: f.gender || user.gender || "",
    }));
  }, [user]);

  // Load availability for the visible month and the next one, for all rooms at once
  useEffect(() => {
    let cancelled = false;
    const monthStart = toISO(new Date(month.getFullYear(), month.getMonth(), 1));
    const start = monthStart < today() ? today() : monthStart;
    const end = toISO(new Date(month.getFullYear(), month.getMonth() + 2, 1));
    if (start >= end) return;
    const t = setTimeout(async () => {
      try {
        setLoadingAvail(true);
        const res = await getAvailability(id, start, end);
        if (cancelled) return;
        const next = {};
        (res.data?.calendar || []).forEach((day) =>
          Object.entries(day.rooms || {}).forEach(([key, cell]) => {
            if (typeof cell.available === "number") next[`${key}|${day.date}`] = cell.available;
          })
        );
        setAvailMap((prev) => ({ ...prev, ...next }));
      } catch {
        /* calendar still works without counts; the server re-checks at checkout */
      } finally {
        if (!cancelled) setLoadingAvail(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [id, month]);

  const availableOn = useCallback(
    (iso) => {
      const v = availMap[`${form.roomSelection}|${iso}`];
      return typeof v === "number" ? v : null;
    },
    [availMap, form.roomSelection]
  );

  // A stay covers nights [checkIn, checkOut). Check-out day itself may be full.
  const firstSoldOutNight = (a, b) => {
    for (let d = a; d < b; d = addDaysISO(d, 1)) {
      const v = availableOn(d);
      if (v !== null && v <= 0) return d;
    }
    return null;
  };
  const canCheckOut = (iso) => nightsBetween(form.checkIn, iso) <= 90 && !firstSoldOutNight(form.checkIn, iso);

  const minBeds = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return null;
    let min = Infinity;
    for (let d = form.checkIn; d < form.checkOut; d = addDaysISO(d, 1)) {
      const v = availableOn(d);
      if (v !== null) min = Math.min(min, v);
    }
    return Number.isFinite(min) ? min : null;
  }, [form.checkIn, form.checkOut, availableOn]);

  const pickRoom = (key) => {
    setForm((f) => ({ ...f, roomSelection: key, checkIn: "", checkOut: "" }));
    setSearchParams({ room: key }, { replace: true });
  };

  const pickDate = (iso) =>
    setForm((f) =>
      f.checkIn && !f.checkOut && iso > f.checkIn
        ? { ...f, checkOut: iso }
        : { ...f, checkIn: iso, checkOut: "" }
    );

  const fail = (title, description) => {
    toast({ title, description, variant: "destructive" });
    return false;
  };

  const validateDates = () => {
    if (!selectedRoom) return fail("Choose a room", "Pick a room type to continue.");
    if (!form.checkIn || !form.checkOut) return fail("Choose your dates", "Select a check-in date, then a check-out date.");
    if (form.checkIn < today()) return fail("Check-in is in the past", "Pick today or a later date.");
    if (nights < 1) return fail("Invalid dates", "Check-out must be at least one day after check-in.");
    if (nights > 90) return fail("Stay too long", "Stays are limited to 90 nights.");
    const bad = firstSoldOutNight(form.checkIn, form.checkOut);
    if (bad) return fail("Sold out", `No beds are left on ${formatShortDate(bad)}. Choose different dates.`);
    return true;
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.phone || !form.gender)
      return fail("Details missing", "Fill in every field to continue.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) return fail("Invalid email", "Enter a valid email address.");
    if (!/^\d{10}$/.test(form.phone)) return fail("Invalid phone number", "Enter a 10-digit mobile number.");
    return validateDates();
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value }));
  };

  if (loadingHostel)
    return <div className="flex min-h-screen items-center justify-center bg-paper text-ink-muted">Loading hostel…</div>;

  if (!hostel)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <p className="text-xl font-semibold text-ink">We couldn't find this hostel</p>
        <Button onClick={() => navigate("/hostel")} className="rounded-full">Browse all hostels</Button>
      </div>
    );

  const total = selectedRoom && nights ? nights * Number(selectedRoom.base_price) : null;
  const stepper = [{ n: 1, label: "Room and dates" }, { n: 2, label: "Details and payment" }];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-paper text-ink [&_button:disabled]:cursor-not-allowed [&_button:not(:disabled)]:cursor-pointer [&_[role=combobox]]:cursor-pointer">
      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2"><Header /></div>
      <Toaster />

      <main className="flex-1 px-5 pb-36 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate(`/hostel/${id}`)}
            className="mb-3 flex items-center gap-1 text-sm text-ink-muted hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {hostel.title}
          </button>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Book your stay</h1>
          <p className="mt-1 text-sm text-ink-muted">{hostel.title}</p>

          <ol className="mt-6 flex gap-2 sm:gap-3" aria-label="Progress">
            {stepper.map(({ n, label }) => (
              <li key={n} className="flex-1">
                <button
                  type="button"
                  disabled={n > step}
                  onClick={() => n < step && setStep(n)}
                  className="w-full text-left"
                >
                  <span className={`block h-1.5 rounded-full transition-colors ${step >= n ? "bg-primary" : "bg-hairline"}`} />
                  <span className={`mt-2 flex items-center gap-1.5 text-sm ${step === n ? "font-medium text-ink" : "text-ink-muted"}`}>
                    {step > n && <Check className="h-3.5 w-3.5 text-primary" />}
                    {label}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="grid">
              <div className={pane(1)} aria-hidden={step !== 1}>
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_19.5rem]">
                  <section>
                    <h2 className="mb-2 text-base font-semibold">Room</h2>
                    <div className="space-y-2" role="radiogroup" aria-label="Room type">
                      {cmsRooms.map((r) => {
                        const on = r.room_key === form.roomSelection;
                        return (
                          <button
                            key={r.room_key}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => pickRoom(r.room_key)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-3.5 py-3 text-left text-sm transition",
                              on ? "border-primary ring-2 ring-primary/20" : "border-hairline hover:border-primary/40"
                            )}
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <BedDouble className="h-4 w-4 text-primary" />
                              {r.room_name}
                            </span>
                            <span>
                              ₹{r.base_price}<span className="text-xs text-ink-muted"> / day</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 min-h-11 text-sm">
                      <p className="text-ink-muted">
                        {!form.checkIn
                          ? "Pick your check-in date."
                          : !form.checkOut
                            ? "Now pick your check-out date."
                            : `${nights} night${nights > 1 ? "s" : ""}, ${formatShortDate(form.checkIn)} to ${formatShortDate(form.checkOut)}`}
                      </p>
                      <p className={minBeds > 0 ? "text-emerald-700" : "text-destructive"}>
                        {minBeds === null
                          ? ""
                          : minBeds > 0
                            ? `${minBeds} bed${minBeds === 1 ? "" : "s"} free for your whole stay.`
                            : "Sold out for these dates."}
                      </p>
                    </div>
                  </section>

                  <section className="self-start rounded-lg border border-hairline bg-white p-3">
                    <RangeCalendar
                      month={month}
                      onMonthChange={setMonth}
                      checkIn={form.checkIn}
                      checkOut={form.checkOut}
                      onPick={pickDate}
                      availableOn={availableOn}
                      canCheckOut={canCheckOut}
                      showCounts={!!selectedRoom}
                    />
                    <p className="mt-2 text-center text-[0.7rem] text-ink-muted">
                      {loadingAvail ? "Checking availability…" : "Small numbers are beds left that night."}
                    </p>
                  </section>
                </div>

                <div className="mt-auto flex justify-end">
                  <Button
                    type="button"
                    onClick={() => validateDates() && setStep(2)}
                    className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-on-primary hover:bg-primary-hover"
                  >
                    Continue to details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className={pane(2)} aria-hidden={step !== 2}>
                  <section className="space-y-5">
                    <h2 className="text-lg font-semibold">Guest details</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <div className="relative">
                          <Input id="name" name="name" value={form.name} onChange={onChange} placeholder="Your full name" className="h-11 rounded-full pl-10" required />
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={form.gender} onValueChange={(value) => onChange({ target: { name: "gender", value } })}>
                          <SelectTrigger id="gender" className="h-11 rounded-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem className="cursor-pointer" value="female">Female</SelectItem>
                            <SelectItem className="cursor-pointer" value="male">Male</SelectItem>
                            <SelectItem className="cursor-pointer" value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" className="h-11 rounded-full pl-10" required />
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Mobile number</Label>
                        <div className="relative">
                          <Input id="phone" name="phone" type="tel" inputMode="numeric" value={form.phone} onChange={onChange} placeholder="10 digits" className="h-11 rounded-full pl-10" required />
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <Alert className="rounded-lg border-primary/20 bg-primary/[0.05]">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm text-ink">
                      Your beds are held for 15 minutes once you start paying. Finish payment in that time to confirm.
                    </AlertDescription>
                  </Alert>

                  <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 rounded-full border-hairline-strong">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Change dates
                    </Button>
                    <div className="min-h-11">
                    {step === 2 && <RazorPayPayment
                      hostelId={id}
                      formData={{
                        checkIn: form.checkIn,
                        checkOut: form.checkOut,
                        roomSelection: form.roomSelection,
                        guest: { name: form.name, email: form.email, phone: form.phone, gender: form.gender },
                      }}
                      hostelName={hostel.title || "Unknown"}
                      roomType={selectedRoom?.room_name || "Unknown"}
                      nights={nights}
                      validateForm={validateForm}
                    />}
                    </div>
                  </div>
              </div>
            </form>

            {/* Summary */}
            <aside>
              <div className="rounded-lg border border-hairline bg-white p-5 lg:sticky lg:top-8">
                <h2 className="text-base font-semibold">Your stay</h2>
                {selectedRoom ? (
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-ink-muted">Room</dt><dd className="font-medium">{selectedRoom.room_name}</dd></div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Dates</dt>
                      <dd className="font-medium">
                        {form.checkIn ? `${formatShortDate(form.checkIn)} to ${form.checkOut ? formatShortDate(form.checkOut) : "…"}` : "Not chosen"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3"><dt className="text-ink-muted">Rate</dt><dd className="font-medium">₹{selectedRoom.base_price} / day</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-ink-muted">Nights</dt><dd className="font-medium">{nights || "—"}</dd></div>
                    <div className="border-t border-hairline pt-3">
                      <div className="flex items-baseline justify-between">
                        <dt className="text-ink-muted">Estimated total</dt>
                        <dd className="text-lg font-semibold">{total !== null ? `₹${total}` : "—"}</dd>
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        The final amount, including any taxes and fees, is confirmed at checkout.
                      </p>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">Choose a room to see your summary.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}