import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
} from "lucide-react";
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
import cmsClient from "@/contentstackClient";
import Loading from "./Loading";

export default function HomePage() {
  const [landingData, setLandingData] = useState();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = (
          await cmsClient.get(
            "/content_types/landing_page/entries/bltd518b717b8917267"
          )
        ).data.entry;
        setLandingData(data);
        // console.log(data);
      } catch (error) {
        console.error("Failed to fetch data from cms", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (landingData?.page_title) document.title = landingData?.page_title
  }, [landingData])

  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));
  const navigate = useNavigate();
  if (!landingData) {
    return (<Loading />)
  } else {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Header />
        </div>
        <Toaster />
        <section className="relative min-h-screen flex flex-col md:flex-row items-center justify-center w-full px-6 md:px-16 pt-20 bg-gradient-to-br from-purple-50 via-white to-purple-50">
          <div className="flex flex-col items-start md:w-1/2 space-y-6 z-10">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl text-purple-600 font-bold tracking-tight">
                {landingData?.title}
              </h1>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                {landingData?.subtitle}
              </h3>
              <p className="text-lg text-gray-600 max-w-lg">
                {landingData?.subtext}
              </p>
            </div>
            <Button
              onClick={() => {
                if (landingData?.cta_link?.href) {
                  navigate(landingData.cta_link.href);
                }

              }}
              className="rounded-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 px-8 py-6 text-lg shadow-lg"
            >
              {landingData?.cta_link?.title}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
            <img
              src={landingData?.image?.url}
              alt={landingData?.image?.title || "Travel Tribe Hostel Illustration"}
              className="w-full max-w-2xl h-auto object-contain transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </section>

        <section className="py-24 w-full bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
              {landingData?.features_title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {landingData?.features?.map((item, index) => (
                <div
                  key={index}
                  className="group flex flex-col items-center text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="bg-purple-100 p-4 rounded-full mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                    <img
                      src={item?.feature_icon.url}
                      alt={item?.feature_title}
                      className="h-12 w-12 object-contain text-purple-600"
                    />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                    {item?.feature_title}
                  </h3>
                  <p className="text-gray-600 text-lg">{item?.feature_description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 w-full bg-purple-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Featured Hostels --in progress
            </h2>
            {/* <div className="relative max-w-6xl mx-auto px-8">
            <Carousel className="cursor-grab active:cursor-grabbing">
              <CarouselContent>
                {hostels.map((hostel, index) => (
                  <CarouselItem
                    key={index}
                    className="md:basis-1/2 lg:basis-1/3 pl-4"
                  >
                    <Card className="bg-white p-4 hover:shadow-xl transition-all duration-300 ">
                      <CardTitle className="text-xl font-semibold text-center mb-4">
                        {hostel?.name.length > 25 ? `${hostel.name.slice(0, 25)}...` : hostel.name}
                      </CardTitle>
                      <CardContent className="flex flex-col items-center p-0">
                        <img
                          src={hostel.images[0]}
                          alt={hostel.name}
                          className="w-full h-64 object-cover rounded-lg hover:opacity-90 transition-opacity duration-300"
                        />
                        <Button
                          onClick={() => navigate(`/hostel/${hostel.hostelId}`)}
                          className="mt-6 bg-purple-600 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md rounded-full"
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-purple-50 shadow-md" />
              <CarouselNext className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-purple-50 shadow-md" />
            </Carousel>
          </div> */}
          </div>
        </section>

        <section className="py-24 w-full bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              {landingData?.testimonial_title}
            </h2>
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[plugin.current]}
              className="max-w-6xl mx-auto"
              onMouseEnter={() => plugin.current?.stop()}
              onMouseLeave={() => plugin.current?.play()}
            >
              <CarouselContent>
                {landingData?.testimonials?.map((data, index) => (
                  <CarouselItem
                    key={index}
                    className="md:basis-1/2 lg:basis-1/3 pl-4 hover:cursor-pointer hover:select-none "
                  >
                    <Card className="shadow-md hover:shadow-xl transition-all duration-500 transform 
  hover:bg-purple-50">
                      <CardContent className="p-8 flex flex-col items-center">
                        <Avatar className="w-20 h-20 ring-2 ring-purple-200">
                          <AvatarImage src={data?.user_avatar?.url} alt={data?.user_name} />
                          <AvatarFallback className="bg-purple-100 text-purple-600 font-bold text-2xl">
                            {data?.user_name?.[0] ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="mt-6 text-xl font-semibold text-gray-900">
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

        <section className="py-24 bg-purple-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              {landingData?.faq_title}
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {landingData?.faqs?.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index + 1}`}
                  className="bg-white rounded-lg"
                >
                  <AccordionTrigger className=" text-lg font-medium px-6 hover:text-purple-600 transition-colors duration-500">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 px-6 pb-4 font-semibold">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>



        <Footer />
      </div>
    )
  };
}
