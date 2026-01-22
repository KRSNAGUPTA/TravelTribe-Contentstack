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
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { setDataForChromeExtension } from "@/contentstack/utils";

export default function HomePage() {
  const [landingData, setLandingData] = useState(null);

  useEffect(() => {
  const fetchCDAData = async () => {
    try {
      const entry = (
        await cmsClient.get(
          "/content_types/landing_page/entries/bltd518b717b8917267?include[]=page_sections.hostels_section.reference"
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
      const entry = await Stack
        .ContentType("landing_page")
        .Entry("bltd518b717b8917267")
        .includeReference("page_sections.hostels_section.reference")
        .toJSON()
        .fetch();

      document.title = entry.title;
      setLandingData(entry.page_sections);
      console.log(entry)


      // for live preview 
      const data = {
        "entryUid":"bltd518b717b8917267",
        "contenttype":"landing_page",
        "locale":"en-us"
      }
      setDataForChromeExtension(data)
      // console.log("Using SDK")
    } catch (error) {
      console.error("Failed to fetch data from SDK", error);
    }
  };

  if(import.meta.env.VITE_SDK === "true"){
    fetchSDKData();
    onEntryChange(fetchSDKData);
  }else{
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

  const heroSection = landingData.find(s => s.hero_section)?.hero_section;
  const featuresSection = landingData.find(s => s.features_section)?.features_section;
  const hostelsSection = landingData.find(s => s.hostels_section)?.hostels_section;
  const featuredHostels = hostelsSection?.reference || [];

  const testimonialsSection = landingData.find(s => s.testimonials_section)?.testimonials_section;
  const faqSection = landingData.find(s => s.faq_section)?.faq_section;




  return (
    <div className="flex flex-col min-h-screen bg-white" >
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header  />
      </div>

      <Toaster />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col md:flex-row items-center justify-between w-full px-6 md:px-16 pt-32 pb-32 bg-gradient-to-br from-[var(--hero-grad-start)]
    to-[var(--hero-grad-end)]">
        <div className="flex flex-col items-start md:w-1/2 space-y-6 z-10">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold  tracking-tight" >
              {heroSection?.title}
            </h1>

            <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary)]">
              {heroSection?.subtitle}
            </h2>

            <p className="text-lg text-[var(--secondary)] max-w-lg">
              {heroSection?.subtext}
            </p>
          </div>

          <Button
            onClick={() => {
              if (heroSection?.cta?.href) {
                navigate(heroSection.cta.href);
              }
            }}

            className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] px-8 py-6 text-lg shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out hover:-translate-y-0.5"
          >
            {heroSection?.cta?.title}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
          <img
            src={heroSection?.hero_image?.url}
            alt={heroSection?.hero_image?.title || "Travel Tribe Hostel Illustration"}
            className="w-full max-w-2xl h-auto object-contain transform hover:scale-105 transition-transform duration-500"
            draggable="false"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 w-full">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-[var(--text-dark)]">
            {featuresSection?.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {featuresSection?.features?.map((item, index) => (
              <div
                key={index}
                className=" group flex flex-col items-center text-center p-8  rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y- "
              >
                <div
                  className=" mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent)] transition-colors duration-300 group-hover:bg-white"
                >
                  <img
                    src={item?.feature_icon?.url}
                    alt={item?.feature_title}
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <h3 className="text-2xl font-semibold mb-3 text-[var(--text-dark)]">
                  {item?.feature_title}
                </h3>

                <p className="text-lg text-[var(--text-muted)] leading-relaxed">
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
          <h2 className="text-4xl font-bold text-center mb-12">
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
                    ...hostel.room_types.map(r => r.base_price)
                  );

                  return (
                    <CarouselItem className="max-w-md mx-auto"
                      key={hostel.uid}
                    >
                      <Card
                        className="group overflow-hidden bg-white shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_var(--card-shadow-hover)] cursor-pointer"
                      >
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
                          <h3 className="absolute bottom-4 left-4 right-4 text-white text-lg font-semibold leading-snug">
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
          <h2 className="text-4xl font-bold text-center mb-12 ">
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
                        <AvatarImage src={data?.user_avatar?.url} alt={data?.user_name} />
                        <AvatarFallback className="bg-[var(--primary)] font-bold text-2xl">
                          {data?.user_name?.[0] ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="mt-6 text-xl font-semibold text-gray-900 border-b-2">
                        {data?.user_name}
                      </h3>
                      <p className="mt-4 text-gray-600 text-center leading-relaxed">
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
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            {faqSection?.title}
          </h2>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqSection?.faqs?.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index + 1}`}
                className="bg-white rounded-lg"
              >
                <AccordionTrigger className="text-lg font-medium px-6 hover:text-[var(--primary)] transition-colors duration-500">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 px-6 pb-4 font-semibold">
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
