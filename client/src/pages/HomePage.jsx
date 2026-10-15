import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Autoplay from "embla-carousel-autoplay";
import React, { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Loading from "./Loading";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntries } from "@/contentstack/utils";
import { FocusCards } from "@/components/FocusCard";
import HostelCard from "@/components/HostelCard";
import { StickyBar } from "@/components/StickyBanner";

export default function HomePage() {
  const [landingData, setLandingData] = useState(null);

  

  useEffect(() => {
    const fetchData = async () => {
      const entry = (
        await fetchEntries("landing_page", [
          "page_sections.hostels_section.reference",
        ])
      )[0];

      if (!entry) return;

      document.title = entry.title || "Travel Tribe";
      setLandingData(entry.page_sections);
    };

    fetchData();
    onEntryChange(fetchData);
  }, []);

  const hostelsPlugin = useRef(Autoplay({ delay: 2500 }));
  const navigate = useNavigate();

  if (!landingData) {
    return <Loading />;
  }

  const heroSection = landingData.find((s) => s.hero_section)?.hero_section;
  const featuresSection = landingData.find(
    (s) => s.features_section
  )?.features_section;
  const hostelsSection = landingData.find(
    (s) => s.hostels_section
  )?.hostels_section;

  // ── Resolve hostel refs into real hostel objects ──
  // Resolved refs still carry `_content_type_uid`, so filter for hostels.
  const featuredHostels = (hostelsSection?.reference || []).filter(
    (h) => h.title || h.uid
  );

  const testimonialsSection = landingData.find(
    (s) => s.testimonials_section
  )?.testimonials_section;
  const faqSection = landingData.find((s) => s.faq_section)?.faq_section;

  const featureCards = (featuresSection?.features || []).map((item) => ({
    title: item?.feature_title || "Feature",
    description: item?.feature_description || "",
    src: item?.feature_image?.url || "",
    titleProps: item?.$?.feature_title,
    descriptionProps: item?.$?.feature_description,
  }));

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-paper text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(60% 40% at 15% 0%, hsl(var(--primary) / 0.06) 0%, transparent 60%),
            radial-gradient(50% 40% at 85% 100%, hsl(var(--primary) / 0.04) 0%, transparent 60%)
          `,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--text-dark) / 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--text-dark) / 0.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <StickyBar />
      <Toaster />

      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <Header />
      </div>

      {/* Hero */}
      <section className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-primary lg:h-[100svh]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--on-primary)) 1.2px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 ml-1 pb-16 pt-24 sm:px-10 sm:pt-28 lg:px-12 lg:pt-32">
          <div className="max-w-xl lg:max-w-[42%]">
            <h1
              className="pacifico-regular text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.03em] text-on-primary sm:text-[3.2rem] lg:text-[3.8rem] xl:text-[4.2rem]"
              {...heroSection?.$?.title}
            >
              {heroSection?.title}
            </h1>

            <h2
              className="mt-4 max-w-xl text-[1.05rem] font-normal leading-[1.4] text-on-primary/90 sm:text-[1.25rem]"
              {...heroSection?.$?.subtitle}
            >
              {heroSection?.subtitle}
            </h2>

            <p
              className="mt-4 max-w-md text-[0.9rem] font-light leading-[1.6] text-on-primary/75 sm:text-base lg:max-w-[18rem] xl:max-w-[20rem]"
              {...heroSection?.$?.subtext}
            >
              {heroSection?.subtext}
            </p>

            <div className="mt-7 sm:mt-8">
              <Button
                onClick={() => {
                  if (heroSection?.cta?.href) {
                    navigate(heroSection.cta.href);
                  }
                }}
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[0.85rem] font-semibold text-primary shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95 active:translate-y-0 sm:h-12 sm:px-7 sm:text-[0.88rem]"
                {...heroSection?.cta?.$?.title}
              >
                {heroSection?.cta?.title}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {heroSection?.hero_image?.url && (
          <div className="pointer-events-none relative z-[5] mt-auto flex w-full justify-center pb-6 sm:pb-12 lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:block lg:h-[75%] lg:w-[75%] lg:pb-0">
            <img
              src={heroSection.hero_image.url}
              alt="Travel Tribe Illustration"
              className="h-[52svh] w-auto max-w-full object-contain drop-shadow-2xl sm:h-[60svh] lg:h-full lg:w-full lg:object-right-bottom"
              draggable="false"
            />
          </div>
        )}

        <svg
          aria-hidden="true"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          shapeRendering="geometricPrecision"
          className="absolute -bottom-px left-0 z-10 h-12 w-full sm:h-16 lg:h-20"
          style={{ color: "hsl(var(--bg-muted-soft))" }}
        >
          <path
            fill="currentColor"
            d="M0,150 C240,200 480,40 720,100 C960,160 1200,30 1440,120 L1440,200 L0,200 Z"
          />
        </svg>
      </section>

      {/* Features */}
      <section className="relative w-full px-6 py-20 sm:px-10 sm:py-24 lg:px-12 lg:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 flex flex-col gap-3 sm:mb-14">
            <h2
              className="max-w-xl text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.25rem]"
              {...featuresSection?.$?.title}
            >
              {featuresSection?.title}
            </h2>
          </div>

          <FocusCards cards={featureCards} />
        </div>
      </section>

      {/* Hostels */}
      <section className="relative w-full px-6 py-20 sm:px-10 sm:py-24 lg:px-12 lg:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 flex flex-col gap-3 sm:mb-14">
            <h2
              className="max-w-xl text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.25rem]"
              {...hostelsSection?.$?.title}
            >
              {hostelsSection?.title}
            </h2>
          </div>

          <Carousel
            className="w-full cursor-grab active:cursor-grabbing"
            opts={{
              align: "start",
              loop: true,
              duration: 45,
              dragFree: true,
              containScroll: "trimSnaps",
              skipSnaps: false,
              slidesToScroll: 1,
            }}
            plugins={[hostelsPlugin.current]}
            onMouseEnter={() => hostelsPlugin.current?.stop()}
            onMouseLeave={() => hostelsPlugin.current?.play()}
          >
            <CarouselContent className="-ml-3 py-2 md:-ml-4">
              {featuredHostels.map((hostel) => (
                <CarouselItem
                  className="basis-full pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3"
                  key={hostel.uid}
                >
                  <div className="h-full">
                    <HostelCard hostel={hostel} variant="compact" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative w-full px-6 py-20 sm:px-10 sm:py-24 lg:px-12 lg:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 flex flex-col gap-3 text-center sm:mb-14">
            <h2
              className="mx-auto max-w-xl text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.25rem]"
              {...testimonialsSection?.$?.title}
            >
              {testimonialsSection?.title}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-7 lg:gap-8">
            {testimonialsSection?.testimonials?.map((data, index) => (
              <Card
                key={index}
                className="flex w-full flex-col rounded-3xl border border-hairline bg-white p-5 shadow-[0_10px_40px_-15px_var(--card-shadow-hover)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_var(--card-shadow-hover)] sm:w-[calc(50%-0.875rem)] sm:p-6 lg:w-[calc(33.333%-1.334rem)]"
              >
                <CardContent className="flex h-full flex-col items-center p-0 pt-2 text-center sm:pt-4">
                  <Avatar className="h-14 w-14 ring-4 ring-primary/10 sm:h-16 sm:w-16">
                    <AvatarImage
                      src={data?.user_avatar?.url}
                      alt={data?.user_name}
                    />
                    <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary sm:text-lg">
                      {data?.user_name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <h3
                    className="mt-4 text-[0.9rem] font-semibold tracking-[-0.01em] text-ink sm:mt-5 sm:text-[0.95rem]"
                    {...data?.$?.user_name}
                  >
                    {data?.user_name}
                  </h3>

                  <div
                    aria-hidden="true"
                    className="mt-2 h-px w-8 bg-hairline-strong"
                  />

                  <p
                    className="mt-3 flex-1 text-[0.85rem] font-light italic leading-[1.6] text-ink-muted sm:mt-4 sm:text-[0.88rem] sm:leading-[1.65]"
                    {...data?.$?.user_quote}
                  >
                    &ldquo;{data?.user_quote}&rdquo;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative w-full px-6 pb-24 pt-4 sm:px-10 sm:pb-28 sm:pt-6 lg:px-12 lg:pb-32 lg:pt-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8 flex flex-col gap-3 text-center sm:mb-12">
            <h2
              className="mx-auto max-w-xl text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.25rem]"
              {...faqSection?.$?.title}
            >
              {faqSection?.title}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqSection?.faqs?.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index + 1}`}
                className="overflow-hidden rounded-2xl border border-hairline bg-white px-1 shadow-[0_2px_12px_-6px_var(--card-shadow-hover)]"
              >
                <AccordionTrigger
                  className="px-4 py-3.5 text-left text-[0.9rem] font-medium text-ink transition-colors hover:text-primary sm:px-5 sm:py-4 sm:text-base"
                  {...item?.$?.question}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent
                  className="border-t border-hairline px-4 pb-4 pt-3 text-[0.85rem] font-light leading-[1.65] text-ink-muted sm:px-5 sm:text-[0.9rem] sm:leading-[1.7]"
                  {...item?.$?.answer}
                >
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}