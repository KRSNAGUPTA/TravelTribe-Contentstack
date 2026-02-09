import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import Loading from "./Loading";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import {
  fetchEntryById,
  setDataForChromeExtension,
} from "@/contentstack/utils";

function About() {
  const [about, setAbout] = useState(null);
  const data = {
    entryUid: "blt185b62aabf4f0649",
    contenttype: "about_us",
    locale: import.meta.env.VITE_CS_LOCALE,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = await fetchEntryById(
          data.contenttype,
          data.entryUid,
          import.meta.env.VITE_SDK,
          null,
        );
        // console.log("Abous Us");
        // console.log(entry);
        setAbout(entry);
        document.title = entry?.title || "About - Travel Tribe";
      } catch (error) {
        console.error("Error fetching about page data", error);
      }
    };

    onEntryChange(fetchData);
    setDataForChromeExtension(data);
  }, []);

  if (!about) return <Loading />;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--bg-muted)]">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <main className="flex flex-col items-center px-6 md:px-20 py-10 space-y-8">
        <h1
          className="text-3xl font-bold text-center text-[var(--text-dark)] my-8"
          {...about?.$?.title}
        >
          {about?.title}
        </h1>

        {about?.info_group?.map((info, index) => (
          <Card
            key={info.uid || index}
            className="w-full max-w-3xl p-6 bg-white shadow-lg"
          >
            <CardTitle
              className="text-xl text-center mb-4 text-[var(--primary)]"
              {...info?.$?.title}
            >
              {info?.title}
            </CardTitle>
            <CardContent>
              <p
                className="text-[var(--text-muted)] leading-relaxed"
                {...info?.$?.description}
              >
                {info?.description}
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
