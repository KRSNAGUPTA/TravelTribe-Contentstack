import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Cctv,
  Droplets,
  Flame,
  IndianRupee,
  MapPin,
  Mars,
  ParkingCircle,
  ShieldCheck,
  Snowflake,
  Venus,
  VenusAndMars,
  Wifi,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const typeIconMap = {
  Boys: <Mars className="h-4 w-4 text-blue-600" aria-hidden="true" />,
  Girls: <Venus className="h-4 w-4 text-pink-600" aria-hidden="true" />,
  Unisex: <VenusAndMars className="h-4 w-4 text-purple-600" aria-hidden="true" />,
};

const facilityIconMap = {
  wifi: <Wifi className="h-4 w-4 text-sky-500" aria-hidden="true" />,
  cctv: <Cctv className="h-4 w-4 text-indigo-500" aria-hidden="true" />,
  security_guard: (
    <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
  ),
  parking: <ParkingCircle className="h-4 w-4 text-slate-500" aria-hidden="true" />,
  drinking_water: <Droplets className="h-4 w-4 text-blue-500" aria-hidden="true" />,
  fire_safety: <Flame className="h-4 w-4 text-amber-500" aria-hidden="true" />,
  ac: <Snowflake className="h-4 w-4 text-cyan-500" aria-hidden="true" />,
};

export default function HostelCard({
  hostel,
  lytics_event = "default",
  variant = "compact",
  lowestPrice,
  isAvailable,
}) {
  const navigate = useNavigate();

  const computedMinPrice =
    hostel?.room_types?.length > 0
      ? Math.min(...hostel.room_types.map((room) => room.base_price || 0))
      : 0;
  const minPrice = Number.isFinite(lowestPrice) ? lowestPrice : computedMinPrice;
  const hasValidPrice = Number.isFinite(minPrice) && minPrice > 0;

  const title = hostel?.title || "Untitled Hostel";
  const imageUrl = hostel?.images?.[0]?.url;
  const hostelType = hostel?.type || "Hostel";
  const address = hostel?.address || "Location not available";
  const shortAddress =
    address.length > 42 ? `${address.slice(0, 42)}...` : address;

  const facilities = Array.isArray(hostel?.facilities)
    ? hostel.facilities.filter((facility) => facilityIconMap[facility]).slice(0, 3)
    : [];

  const typeIcon =
    typeIconMap[hostelType] || (
      <VenusAndMars className="h-4 w-4 text-purple-600" aria-hidden="true" />
    );

  const statusMeta =
    isAvailable === false
      ? {
          label: "Full",
          className: "bg-red-50 text-red-600 hover:bg-red-50",
        }
      : {
          label: "Available",
          className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        };

  const handleOpen = () => {
  
    jstag.send({
      _e: lytics_event,
      hostelId: hostel?.uid,
      hostelName: hostel?.title
    })
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (hostel?.uid) {
      navigate(`/hostel/${hostel.uid}`);
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Card
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpen();
          }
        }}
        className="group overflow-hidden bg-white shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_var(--card-shadow-hover)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
      >
      <div className="relative h-64 w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-[var(--hero-grad-start)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        {isAvailable === false && (
          <Badge className="absolute top-3 right-3 rounded-full bg-red-600 px-3 py-1 text-white hover:bg-red-600 transition-transform duration-200 group-hover:scale-105">
            Full
          </Badge>
        )}

        <h3 className="absolute bottom-4 left-4 right-4 text-white text-lg font-semibold leading-snug">
          {title.length > 32 ? `${title.slice(0, 32)}...` : title}
        </h3>
      </div>

      {variant === "detailed" ? (
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-muted)] truncate flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>{shortAddress}</span>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`rounded-full px-2 py-1 text-xs font-medium ${statusMeta.className}`}>
                {statusMeta.label}
              </Badge>
              <Tooltip>
                <TooltipContent className="rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold text-black">
                  {hostelType}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
              <p className="text-lg font-bold text-[var(--text-dark)]">
                {hasValidPrice ? minPrice : "N/A"}
              </p>
              {hasValidPrice && (
                <span className="text-sm text-[var(--text-muted)]">/day</span>
              )}
            </div>

            {facilities.length > 0 && (
              <div className="flex items-center gap-2">
              {facilities.map((facility) => (
                <Tooltip key={facility}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="p-1.5 transition-transform duration-200 hover:scale-110"
                    >
                      {facilityIconMap[facility]}
                      <span className="sr-only">{facility.replace(/_/g, " ")}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold text-black capitalize">
                    {facility.replace(/_/g, " ")}
                  </TooltipContent>
                </Tooltip>
              ))}
              </div>
            )}
          </div>
        </CardContent>
      ) : (
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
            <p className="text-lg font-bold text-[var(--text-dark)]">
              {hasValidPrice ? minPrice : "N/A"}
            </p>
            {hasValidPrice && (
              <span className="text-sm text-[var(--text-muted)]">/day</span>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                className="rounded-full bg-[var(--hero-grad-start)] px-2 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--hero-grad-start)] transition-transform duration-200 group-hover:scale-105"
              >
                {typeIcon}
                <span className="sr-only">{hostelType}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold text-black">
              {hostelType}
            </TooltipContent>
          </Tooltip>
        </CardContent>
      )}
      </Card>
    </TooltipProvider>
  );
}
