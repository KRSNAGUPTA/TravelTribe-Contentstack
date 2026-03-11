import React, { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from "react-router-dom";
import { Toaster } from "./ui/toaster";
import api from "@/api";
import { fetchEntryById } from "@/contentstack/utils";
import { getLyticsProfile, trackEvent } from "@/Lytics/config";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";

export function RecentlyViewedHostel({ email }) {
  const [hostelDetails, setHostelDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const hostelsPlugin = useRef(Autoplay({ delay: 2000 }));
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const getProfile = async () => {
      setLoading(true);

      try {
        // console.log("This line execute in ad block")
        const profile = await getLyticsProfile();
        // console.log("not reached here")
        if(!profile || !profile.user) {
          if (mounted) {
            setHostelDetails([]);
            setLoading(false);
          }
        }
        const viewedIds = profile?.user?.viewed_hostel || [];

        if (!viewedIds.length) {
          if (mounted) {
            setHostelDetails([]);
            setLoading(false);
          }
          console.warn("No viewed hostels found in Lytics profile.");
          return;
        }

        const entries = await Promise.all(
          viewedIds.map((hostelId) =>
            fetchEntryById("hostel", hostelId, import.meta.env.VITE_SDK, null),
          ),
        );

        if (mounted) {
          setHostelDetails(entries.filter(Boolean));
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch recently viewed hostels:", error);

        if (mounted) {
          setHostelDetails([]);
          setLoading(false);
        }
      }
    };

    getProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // useEffect(() => {
  //   let isMounted = true;

  //   const fetchRecentlyViewed = async () => {
  //     if (!email) {
  //       setHostelDetails([]);
  //       return;
  //     }

  //     // console.log("Enity", jstag.getEntity());

  //     setLoading(true);
  //     try {
  //       const profile = await api.get(`/api/lytics/profile/email/${email}`);
  //       const viewedIds = profile?.data?.viewed_hostel || [];
  //       // const viewedIds = jstag.getEntity();
  //       // console.log("Viewed Hostel IDs from Lytics:", viewedIds);

  //       if (!isMounted) return;

  //       if (!viewedIds.length) {
  //         setHostelDetails([]);
  //         return;
  //       }

  //       const entries = await Promise.all(
  //         viewedIds.map((hostelId) =>
  //           fetchEntryById("hostel", hostelId, import.meta.env.VITE_SDK, null),
  //         ),
  //       );

  //       if (!isMounted) return;
  //       setHostelDetails(entries.filter(Boolean));
  //     } catch (error) {
  //       if (isMounted) {
  //         setHostelDetails([]);
  //       }
  //       if (error.status === 404) {
  //         return console.warn("Lytics profile not found for email:", email);
  //       }
  //       console.error(
  //         "Failed to fetch recently viewed hostels:",
  //         error.message || error,
  //       );
  //     } finally {
  //       if (isMounted) {
  //         setLoading(false);
  //       }
  //     }
  //   };

  //   fetchRecentlyViewed();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, [email]);

  // if (!email) return <div>Please log in to see recently viewed hostels.</div>;

  return (
    <>
      <Toaster />

      {loading && (
        <div className="relative max-w-full mx-auto px-8">
          <Carousel
            className="cursor-grab active:cursor-grabbing"
            opts={{ align: "start", loop: true }}
            plugins={[hostelsPlugin.current]}
            onMouseEnter={() => hostelsPlugin.current?.stop()}
            onMouseLeave={() => hostelsPlugin.current?.play()}
          >
            <CarouselContent className="flex py-8">
              {[1, 2, 3].map((index) => (
                <CarouselItem className="max-w-md mx-auto" key={index}>
                  <Card className="overflow-hidden bg-white shadow-md">
                    <div className="relative h-64 w-full overflow-hidden">
                      <Skeleton className="h-full w-full animate-pulse bg-gray-100" />
                    </div>

                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20 bg-gray-100 animate-pulse" />
                        <Skeleton className="h-6 w-16 bg-gray-100 animate-pulse" />
                      </div>
                      <Skeleton className="h-10 w-20 rounded-full bg-gray-100 animate-pulse" />
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

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
                    ? Math.min(
                        ...hostel.room_types.map((r) => r.base_price || 0),
                      )
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
                          <p className="text-sm text-[var(--text-muted)]">
                            Starting from
                          </p>
                          <p className="text-lg font-bold text-[var(--text-dark)]">
                            ₹{minPrice}
                          </p>
                        </div>

                        <Button
                          onClick={() => {
                            trackEvent("recently_viewed_hostel_opened", {
                              hostelId: hostel.uid,
                              hostelTitle: hostel.title,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
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
