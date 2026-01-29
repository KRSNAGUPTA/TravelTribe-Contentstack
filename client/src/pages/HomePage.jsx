import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import cmsClient from "@/contentstack/contentstackClient";
import Loading from "./Loading";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import { setDataForChromeExtension } from "@/contentstack/utils";
import { addEditableTags } from "@contentstack/utils";

export default function HomePage() {
  const [landingData, setLandingData] = useState(null);

  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const entry = (
          await cmsClient.get(
            "/content_types/landing_page/entries/bltd518b717b8917267?include[]=page_sections.hostels_section.reference",
          )
        ).data.entry;

        document.title = entry.title;
        // console.log("Using CDA")
        setLandingData(entry.page_sections);
      } catch (error) {
        console.error("Failed to fetch data from CDA", error);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack.ContentType("landing_page")
          .Entry("bltd518b717b8917267")
          .includeReference("page_sections.hostels_section.reference")
          .toJSON()
          .fetch();

        addEditableTags(entry, "landing_page", true, "en-us");
        // console.log("Entry with editable tags:", entry);

        document.title = entry.title;
        setLandingData(entry.page_sections);
        // console.log(entry);

        // for live preview
        const data = {
          entryUid: "bltd518b717b8917267",
          contenttype: "landing_page",
          locale: "en-us",
        };
        setDataForChromeExtension(data);
        // console.log("Using SDK")
      } catch (error) {
        console.error("Failed to fetch data from SDK", error);
      }
    };

    if (import.meta.env.VITE_SDK === "true") {
      fetchSDKData();
      onEntryChange(fetchSDKData);
    } else {
      fetchCDAData();
    }

    // Cleanup listener
    // return () => {
    //   ContentstackLivePreview.offEntryChange(fetchData);
    // };
  }, []);

  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));
  const navigate = useNavigate();

  if (!landingData) {
    return <Loading />;
  }

  const heroSection = landingData.find((s) => s.hero_section)?.hero_section;
  const featuresSection = landingData.find(
    (s) => s.features_section,
  )?.features_section;
  const hostelsSection = landingData.find(
    (s) => s.hostels_section,
  )?.hostels_section;
  const featuredHostels = hostelsSection?.reference || [];

  const testimonialsSection = landingData.find(
    (s) => s.testimonials_section,
  )?.testimonials_section;
  const faqSection = landingData.find((s) => s.faq_section)?.faq_section;

  return (
    <div className="flex flex-col min-h-screen bg-white mx-auto">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <Toaster />

      {/* Hero Section */}
      <section
        className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[var(--hero-grad-start)] to-[var(--hero-grad-end)] px-6 md:px-16 pt-36 md:pt-24"
      >
        <div className="relative z-10 max-w-xl md:max-w-2xl md:pl-10 md:pt-20 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight pacifico-regular" {...heroSection?.$?.title}>
              {heroSection?.title}
            </h1>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--primary)]" {...heroSection?.$?.subtitle}>
              {heroSection?.subtitle}
            </h2>

            <p className="text-base sm:text-lg text-[var(--secondary)] max-w-lg" {...heroSection?.$?.subtext}>
              {heroSection?.subtext}
            </p>
          </div>

          <Button
            onClick={() =>
              heroSection?.cta?.href && navigate(heroSection.cta.href)
            }
            className=" max-w-xs rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-7 py-5 text-base sm:text-lg shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-0.5"
            {...heroSection?.cta?.$.title}
          >
            {heroSection?.cta?.title}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div
          className=" absolute bottom-0 right-0 hidden md:block w-[70vw] lg:w-[75vw] max-w-none z-0 pointer-events-none"
        >
          <img
            src={heroSection?.hero_image?.url}
            alt="Travel Tribe Illustration"
            className="w-full h-auto object-contain"
            draggable="false"
          />
        </div>

        <div className="mt-12 md:hidden pt-32">
          <img
            src={heroSection?.hero_image?.url}
            alt="Travel Tribe Illustration"
            className="w-full h-auto object-contain"
            draggable="false"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 w-full">
        <div className="container mx-auto px-4">
          <h2
            className="text-4xl font-bold text-center mb-12 text-[var(--text-dark)] bubblegum-sans-regular"
            {...featuresSection?.$?.title}
          >
            {featuresSection?.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-12">
            {featuresSection?.features?.map((item, index) => (
              <div
                key={index}
                className=" group flex flex-col items-center text-center p-8  rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 "
              >
                <div className=" mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent)] transition-colors duration-300 group-hover:bg-white">
                  <img
                    src={item?.feature_icon?.url}
                    alt={item?.feature_title}
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <h3
                  className="text-2xl font-semibold mb-3 text-[var(--text-dark)]"
                  {...item?.$?.feature_title}
                >
                  {item?.feature_title}
                </h3>

                <p
                  className="text-lg text-[var(--text-muted)] leading-relaxed"
                  {...item?.$?.feature_description}
                >
                  {item?.feature_description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hostel */}
      <section className="py-24 w-full bg-[var(--hero-grad-start)]">
        <div className="container mx-auto px-4">
          <h2
            className="text-4xl font-bold text-center mb-12 bubblegum-sans-regular"
            {...hostelsSection?.$?.title}
          >
            {hostelsSection?.title}
          </h2>

          <div className="relative max-w-full mx-auto px-8">
            <Carousel
              className="cursor-grab active:cursor-grabbing"
              opts={{ align: "start", loop: true }}
              plugins={[plugin.current]}
              onMouseEnter={() => plugin.current?.stop()}
              onMouseLeave={() => plugin.current?.play()}
            >
              <CarouselContent className="flex py-8">
                {featuredHostels.map((hostel) => {
                  const minPrice = Math.min(
                    ...hostel.room_types.map((r) => r.base_price),
                  );

                  return (
                    <CarouselItem className="max-w-md mx-auto" key={hostel.uid}>
                      <Card className="group overflow-hidden bg-white shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_var(--card-shadow-hover)] cursor-pointer">
                        {/* Image */}
                        <div className="relative h-64 w-full overflow-hidden">
                          <img
                            src={hostel.images?.[0]?.url}
                            alt={hostel.title}
                            className="
                        h-full w-full object-cover
                        transition-transform duration-500
                        group-hover:scale-110
                      "
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                          {/* Title */}
                          <h3
                            className="absolute bottom-4 left-4 right-4 text-white text-lg font-semibold leading-snug"
                            {...hostel?.$?.title}
                          >
                            {hostel.title.length > 32
                              ? `${hostel.title.slice(0, 32)}...`
                              : hostel.title}
                          </h3>
                        </div>

                        {/* Content */}
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
                            onClick={() => navigate(`/hostel/${hostel.uid}`)}
                            className=" rounded-full px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active) "
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
        </div>
      </section>

      {/* Tesitimonials Section  */}
      <section className="py-24 w-full flex items-center">
        <div className="container mx-auto px-4">
          <h2
            className="text-4xl font-bold text-center mb-12 bubblegum-sans-regular"
            {...testimonialsSection?.$?.title}
          >
            {testimonialsSection?.title}
          </h2>

          <Carousel
            className="max-w-6xl mx-auto"
            opts={{ align: "start", loop: true }}
            plugins={[plugin.current]}
            onMouseEnter={() => plugin.current?.stop()}
            onMouseLeave={() => plugin.current?.play()}
          >
            <CarouselContent className="md:basis-1/2 lg:basis-1/3 pl-4 flex py-8">
              {testimonialsSection?.testimonials?.map((data, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/3 pl-4 hover:cursor-pointer hover:select-none"
                >
                  <Card className="w-full h-full min-h-[420px] shadow-md hover:shadow-xl transition-all duration-500 transform hover:bg-[var(--hero-grad-start)]">
                    <CardContent className="p-8 pt-14 flex flex-col items-center h-full">
                      <Avatar className="w-20 h-20 ring-2 ring-[var(--hero-grad-start)]">
                        <AvatarImage
                          src={data?.user_avatar?.url}
                          alt={data?.user_name}
                        />
                        <AvatarFallback className="bg-[var(--primary)] font-bold text-2xl">
                          {data?.user_name?.[0] ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <h3
                        className="mt-6 text-xl font-semibold text-gray-900 border-b-2 "
                        {...data?.$?.user_name}
                      >
                        {data?.user_name}
                      </h3>
                      <p
                        className="mt-4 text-gray-600 text-center leading-relaxed"
                        {...data?.$?.user_quote}
                      >
                        "{data?.user_quote}"
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* FAQ Section  */}
      <section className="py-24 bg-[var(--hero-grad-start)]">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2
            className="text-4xl font-bold text-center mb-12 text-gray-900 bubblegum-sans-regular"
            {...faqSection?.$?.title}
          >
            {faqSection?.title}
          </h2>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqSection?.faqs?.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index + 1}`}
                className="bg-white rounded-lg"
              >
                <AccordionTrigger
                  className="text-lg font-medium px-6 hover:text-[var(--primary)] transition-colors duration-500"
                  {...item?.$?.question}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent
                  className="text-gray-700 px-6 pb-4 font-semibold"
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
