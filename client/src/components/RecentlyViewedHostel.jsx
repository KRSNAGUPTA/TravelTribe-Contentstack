import React, { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from "react-router-dom";
import { Toaster } from "./ui/toaster";
import api from "@/api";
import { fetchEntryById } from "@/contentstack/utils";
import { trackEvent } from "@/Lytics/config";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

export function RecentlyViewedHostel({ email }) {
  const [hostelDetails, setHostelDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const hostelsPlugin = useRef(Autoplay({ delay: 2000 }));
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchRecentlyViewed = async () => {
      if (!email) {
        setHostelDetails([]);
        return;
      }

      setLoading(true);
      try {
        const profile = await api.get(`/api/lytics/profile/email/${email}`);
        const viewedIds = profile?.data?.viewed_hostel || [];

        if (!isMounted) return;

        if (!viewedIds.length) {
          setHostelDetails([]);
          return;
        }

        const entries = await Promise.all(
          viewedIds.map((hostelId) =>
            fetchEntryById("hostel", hostelId, import.meta.env.VITE_SDK, null),
          ),
        );

        if (!isMounted) return;
        setHostelDetails(entries.filter(Boolean));
      } catch (error) {
        if (isMounted) {
          setHostelDetails([]);
        }
        console.error("Failed to fetch recently viewed hostels:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecentlyViewed();

    return () => {
      isMounted = false;
    };
  }, [email]);

  if (!email) return <div>Please log in to see recently viewed hostels.</div>;

  return (
    <>
    
      <Toaster />
      

        {loading && <div className="text-center">Loading recently viewed hostels...</div>}

        {!loading && hostelDetails.length > 0 && (
          <div className="relative max-w-full mx-auto px-8">
            <Carousel
              className="cursor-grab active:cursor-grabbing"
              opts={{ align: "start", loop: true }}
              plugins={[hostelsPlugin.current]}
              onMouseEnter={() => hostelsPlugin.current?.stop()}
              onMouseLeave={() => hostelsPlugin.current?.play()}
            >
              <CarouselContent className="flex py-8">
                {hostelDetails.map((hostel) => {
                  const minPrice =
                    hostel?.room_types?.length > 0
                      ? Math.min(...hostel.room_types.map((r) => r.base_price || 0))
                      : 0;

                  return (
                    <CarouselItem className="max-w-md mx-auto" key={hostel.uid}>
                      <Card className="group overflow-hidden bg-white shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_var(--card-shadow-hover)] cursor-pointer">
                        <div className="relative h-64 w-full overflow-hidden">
                          <img
                            src={hostel.images?.[0]?.url}
                            alt={hostel.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                          <h3 className="absolute bottom-4 left-4 right-4 text-white text-lg font-semibold leading-snug">
                            {hostel.title?.length > 32
                              ? `${hostel.title.slice(0, 32)}...`
                              : hostel.title}
                          </h3>
                        </div>

                        <CardContent className="p-5 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[var(--text-muted)]">Starting from</p>
                            <p className="text-lg font-bold text-[var(--text-dark)]">₹{minPrice}</p>
                          </div>

                          <Button
                            onClick={() => {
                              trackEvent("recently_viewed_hostel_opened", {
                                hostelId: hostel.uid,
                                hostelTitle: hostel.title,
                              });
                              navigate(`/hostel/${hostel.uid}`);
                            }}
                            className="rounded-full px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
                          >
                            View
                          </Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        {!loading && !hostelDetails.length && (
          <div className="text-center">No recently viewed hostels found.</div>
        )}
        </>
  );
}

export default RecentlyViewedHostel;
