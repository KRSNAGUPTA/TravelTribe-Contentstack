import React, { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { fetchEntryById } from "@/contentstack/utils";
import { Toaster } from "./ui/toaster";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import { useContext } from "react";
import { LyticsContext } from "@/context/LyticsContext";
import HostelCard from "@/components/HostelCard";

export function RecentlyViewedHostel({ email }) {
  const [hostelDetails, setHostelDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const hostelsPlugin = useRef(Autoplay({ delay: 2000 }));
  const { profile, isLoading, error } = useContext(LyticsContext);

  useEffect(() => {
    let mounted = true;

    const fetchRecentlyViewedFromProfile = async () => {
      if (isLoading) return;

      const viewedIds = profile?.user?.viewed_hostel || [];

      if (!viewedIds.length) {
        if (mounted) {
          setHostelDetails([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const entries = await Promise.all(
          viewedIds.map((hostelId) =>
            fetchEntryById("hostel", hostelId, import.meta.env.VITE_SDK, null),
          ),
        );

        if (mounted) {
          setHostelDetails(entries.filter(Boolean));
        }
      } catch (fetchError) {
        console.error("Failed to fetch recently viewed hostels:", fetchError);
        if (mounted) {
          setHostelDetails([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRecentlyViewedFromProfile();

    return () => {
      mounted = false;
    };
  }, [profile, isLoading]);

  // useEffect(() => {
  //   let isMounted = true;

  //   const fetchRecentlyViewed = async () => {
  //     if (!email) {
  //       setHostelDetails([]);
  //       return;
  //     }

  //     // console.log("Entity from profile");

  //     setLoading(true);
  //     try {
  //       const profile = await api.get(`/api/lytics/profile/email/${email}`);
  //       const viewedIds = profile?.data?.viewed_hostel || [];
  //       // const viewedIds = profile?.data?.viewed_hostel || [];
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
                return (
                  <CarouselItem className="max-w-md mx-auto" key={hostel.uid}>
                    <HostelCard
                      hostel={hostel}
                      lytics_event="recently_viewed_hostel"
                      variant="compact"
                    />
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
