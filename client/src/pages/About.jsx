import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import cmsClient from "@/contentstack/contentstackClient";
import React, { useEffect, useState } from "react";
import Loading from "./Loading";
import Stack from "@/contentstack/contentstackSDK";

function About() {
  const [about, setAbout] = useState(null);

  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const entry = (
          await cmsClient.get(
            "/content_types/about_us/entries/blt185b62aabf4f0649"
          )
        ).data.entry;

        setAbout(entry);

        if (entry?.title) {
          document.title = entry.title;
        }
      } catch (error) {
        console.error("CDA: Error fetching About data:", error?.message);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack
          .ContentType("about_us")
          .Entry("blt185b62aabf4f0649")
          .toJSON()
          .fetch();
        setAbout(entry);
        if (entry?.title) {
          document.title = entry.title;
        }
      } catch (error) {
        console.error("SDK: Error fetching About data:", error?.message);
      }
    };

    if (import.meta.env.VITE_SDK === "true") {
      // console.log("SDK active")
      fetchSDKData()
    } else {
      fetchCDAData();
      // console.log("CDA active")
    }
  }, []);

  if (!about) return <Loading />;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--bg-muted)]">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <main className="flex flex-col items-center px-6 md:px-20 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-center text-[var(--text-dark)] my-8">
          {about.title}
        </h1>

        {about?.info_group?.map((info, index) => (
          <Card
            key={info.uid || index}
            className="w-full max-w-3xl p-6 bg-white shadow-lg"
          >
            <CardTitle className="text-xl text-center mb-4 text-[var(--primary)]">
              {info.title}
            </CardTitle>
            <CardContent>
              <p className="text-[var(--text-muted)] leading-relaxed">
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
