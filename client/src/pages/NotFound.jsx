import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "@/lib/iconsConfig";
import Loading from "./Loading";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import {
  fetchEntryById,
  setDataForChromeExtension,
} from "@/contentstack/utils";

export default function NotFound() {
  const [pageData, setPageData] = useState(null);
  const navigate = useNavigate();
  const data = {
    entryUid: "blta6083be0942d0903",
    contenttype: "not_found_page",
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
        setPageData(entry);
        if (entry?.title) document.title = entry.title;
      } catch (error) {
        console.error("Error fetching 404 page data", error);
      }
    };
    onEntryChange(fetchData);
    setDataForChromeExtension(data);
  }, []);

  if(!pageData) return <Loading />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4">
      <div className="max-w-3xl w-full text-center space-y-6">
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto mb-6 animate-floating" {...pageData?.$?.image}>
          <img
            src={pageData?.image?.url}
            alt="404 Error Illustration"
            className="w-full h-auto"
          />
        </div>

        <div className="mt-6">
          <Button
            onClick={() => navigate("/")}
            className="bg-purple-600 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 px-5 py-3 sm:px-6 sm:py-4 text-base sm:text-lg shadow-lg group"
            {...pageData?.$?.button_text}
          >
            <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
            {pageData?.button_text}
          </Button>
        </div>
      </div>
    </div>
  );
}
