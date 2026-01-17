import React, { useEffect, useState } from "react";
import cmsClient from "@/contentstackClient";
import Loading from "./Loading";
import Header from "@/components/Header";

export default function PrivacyPolicy() {
  const [privacyData, setPrivacyData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cmsRes = (
          await cmsClient.get(
            "/content_types/privacy_page/entries/blta8e91d738392bd3d"
          )
        ).data.entry;

        setPrivacyData(cmsRes);
        if (cmsRes?.title) document.title = cmsRes.title;
      } catch (error) {
        console.error("Error fetching Privacy Page data:", error?.message);
      }
    };

    fetchData();
  }, []);

  if (!privacyData) return <Loading />;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>

      <main className="bg-white">
        {/* Hero */}
        <section className="border-b bg-purple-50/50">
          <div className="max-w-5xl mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {privacyData.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Last updated on{" "}
              {new Date(privacyData.last_updated).toLocaleDateString()}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 py-16 space-y-14">

          {/* Intro */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">
              {privacyData.intro.heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {privacyData.intro.description}
            </p>
          </div>

          {/* Sections */}
          {privacyData.sections.map((section) => (
            <div
              key={section._metadata.uid}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold text-gray-900">
                {section.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                {section.content}
              </p>

              {section.bullets?.length > 0 && (
                <ul className="pl-5 list-disc space-y-1 text-muted-foreground">
                  {section.bullets.map((b) => (
                    <li key={b._metadata.uid}>{b.bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="border-t" />

          {/* User Rights */}
          {privacyData.user_rights?.map((block) => (
            <div
              key={block._metadata.uid}
              className="bg-purple-50 rounded-xl p-6"
            >
              <h3 className="text-xl font-semibold mb-3">
                {block.heading}
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {block.rights.map((r) => (
                  <li key={r._metadata.uid}>{r.right}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Cookies */}
          {privacyData.cookies?.enabled && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Cookies</h3>
              <p className="text-muted-foreground">
                {privacyData.cookies.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {privacyData.cookies.types.map((cookie) => (
                  <div
                    key={cookie._metadata.uid}
                    className="border rounded-lg p-4"
                  >
                    <p className="font-medium">{cookie.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cookie.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Third Parties */}
          {privacyData.third_parties?.enabled && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">
                Third-Party Services
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                {privacyData.third_parties.services.map((s) => (
                  <li key={s._metadata.uid}>
                    <span className="font-medium">{s.name}</span> — {s.purpose}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div className="border rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold mb-1">
              {privacyData.contact.heading}
            </h3>
            <p className="text-muted-foreground">
              {privacyData.contact.email}
            </p>
          </div>

        </section>
      </main>
    </>
  );
}
