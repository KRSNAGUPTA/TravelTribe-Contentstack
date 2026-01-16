import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import cmsClient from "@/contentstackClient";
import React, { useEffect, useState } from "react";
import Loading from "./Loading";

function About() {
  const [about, setAbout] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cmsRes = (
          await cmsClient.get(
            "/content_types/about_us/entries/blt185b62aabf4f0649"
          )
        ).data.entry;

        setAbout(cmsRes);

        if (cmsRes?.title) {
          document.title = cmsRes.title;
        }
      } catch (error) {
        console.error("Error fetching About data:", error?.message);
      }
    };

    fetchData();
  }, []);

  if (!about) return <Loading />;

  return (
    <div className="flex flex-col min-h-screen w-full bg-purple-50">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <main className="flex flex-col items-center px-6 md:px-20 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-center text-purple-700 my-8">
          {about.title}
        </h1>

        {about?.info_group?.map((info, index) => (
          <Card
            key={info.uid || index}
            className="w-full max-w-3xl p-6 shadow-lg"
          >
            <CardTitle className="text-xl text-center mb-4 text-purple-700">
              {info.title}
            </CardTitle>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {info.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </main>

      <Footer />
    </div>
  );
}

export default About;
