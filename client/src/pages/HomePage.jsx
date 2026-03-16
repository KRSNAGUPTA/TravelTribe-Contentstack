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
import Loading from "./Loading";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntries, setDataForChromeExtension } from "@/contentstack/utils";
import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";
import NewsletterUnsubscribe from "@/components/NewsletterUnsubscribe";
// import { personalizeSdk } from "@/contentstack/personalizeSdk";
import { FocusCards } from "@/components/ui/focus-cards";
import HostelCard from "@/components/HostelCard";

export default function HomePage() {
  const [landingData, setLandingData] = useState(null);
  const { user } = useContext(AuthContext);

  const searchParams = new URLSearchParams(window.location.search);
  if (
    searchParams.get("action") === "unsubscribe" &&
    searchParams.get("email")
  ) {
    return <NewsletterUnsubscribe email={searchParams.get("email")} />;
  }

  useEffect(() => {
    const fetchData = async () => {
      const entry = (
        await fetchEntries(
          "landing_page",
          import.meta.env.VITE_SDK,
          "page_sections.hostels_section.reference",
        )
      )[0];

      // console.log("entry", entry);

      if (!entry) return;

      document.title = entry.title || "Travel Tribe";
      setLandingData(entry.page_sections);

      // Set data for chrome extension with the fetched entry UID
      const data = {
        entryUid: entry?.uid,
        contenttype: "landing_page",
        locale: import.meta.env.VITE_CS_LOCALE,
      };
      setDataForChromeExtension(data);
    };

    fetchData();
    onEntryChange(fetchData);
  }, []);

  const hostelsPlugin = useRef(Autoplay({ delay: 2000 }));
  const testimonialsPlugin = useRef(Autoplay({ delay: 2000 }));
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

  const featureCards = (featuresSection?.features || []).map((item) => ({
    title: item?.feature_title || "Feature",
    description: item?.feature_description || "",
    src: item?.feature_image?.url || "",
    titleProps: item?.$?.feature_title,
    descriptionProps: item?.$?.feature_description,
  }));

  // const sendPersonalizeEvent = async (eventName) => {
  //   try {
  //     const res = await personalizeSdk?.triggerEvent(eventName);
  //     console.log(`Personalize ${eventName} event triggered`, res);
  //   } catch (error) {
  //     console.error(`Personalize ${eventName} event failed`, error);  
  //   }
  //  };

  return (
    <div className="flex flex-col min-h-screen bg-white mx-auto">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <Toaster />

      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[var(--hero-grad-start)] to-[var(--hero-grad-end)] px-6 md:px-16 pt-36 md:pt-24">
        <div className="relative z-10 max-w-xl md:max-w-2xl md:pl-10 md:pt-20 space-y-6">
          <div className="space-y-4">
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight pacifico-regular"
              {...heroSection?.$?.title}
            >
              {heroSection?.title}
            </h1>

            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--primary)]"
              {...heroSection?.$?.subtitle}
            >
              {heroSection?.subtitle}
            </h2>

            <p
              className="text-base sm:text-lg text-[var(--secondary)] max-w-lg"
              {...heroSection?.$?.subtext}
            >
              {heroSection?.subtext}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Button
              onClick={() => {
                jstag.send({
                  _e: "hero_cta_clicked",
                  cta_title: heroSection?.cta?.title || "Unknown CTA",
                });

                // sendPersonalizeEvent("click");

                if (heroSection?.cta?.href) {
                  navigate(heroSection.cta.href);
                }
              }}
              className="group relative inline-flex w-full max-w-xs items-center justify-center overflow-hidden rounded-full border border-white/40 bg-[linear-gradient(135deg,var(--primary),var(--primary-hover))] px-8 py-6 text-base font-semibold text-[var(--on-primary)] shadow-[0_14px_35px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.28)] active:translate-y-0 active:scale-[0.99]"
              {...heroSection?.cta?.$?.title}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.28)_50%,transparent_80%)] translate-x-[-130%] transition-transform duration-700 ease-out group-hover:translate-x-[130%]"
              />
              <span className="relative z-10 flex items-center">
                {heroSection?.cta?.title}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Button>
          </div>
        </div>

        <div className=" absolute bottom-0 right-0 hidden md:block w-[70vw] lg:w-[75vw] max-w-none z-0 pointer-events-none">
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

          <FocusCards cards={featureCards} />
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
              plugins={[hostelsPlugin.current]}
              onMouseEnter={() => hostelsPlugin.current?.stop()}
              onMouseLeave={() => hostelsPlugin.current?.play()}
            >
              <CarouselContent className="flex py-8">
                {featuredHostels.map((hostel) => {
                  const minPrice = Math.min(
                    ...hostel.room_types.map((r) => r.base_price),
                  );

                  return (
                    <CarouselItem className="max-w-md mx-auto" key={hostel.uid}>
                      <HostelCard
                        hostel={hostel}
                        lytics_event="home_page"
                        variant="compact"
                      />
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
            plugins={[testimonialsPlugin.current]}
            onMouseEnter={() => testimonialsPlugin.current?.stop()}
            onMouseLeave={() => testimonialsPlugin.current?.play()}
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
