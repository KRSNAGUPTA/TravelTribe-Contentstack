import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import cmsClient from "@/contentstack/contentstackClient";
import Loading from "./Loading";
import Stack from "@/contentstack/contentstackSDK";

export default function NotFound() {
  const [data,setData] = useState(null)
  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const entry = (
          await cmsClient.get(
            "/content_types/not_found_page/entries/blta6083be0942d0903"
          )
        ).data.entry;
        setData(entry);
        if (entry?.title) document.title = entry.title;
      } catch (error) {
        console.error("CDA: Error fetching 404 Page data:", error?.message);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack
          .ContentType("not_found_page")
          .Entry("blta6083be0942d0903")
          .toJSON()
          .fetch();
        setData(entry);
      } catch (error) {
        console.error("CDA: Error fetching 404 Page data:", error?.message);
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
  
  const navigate = useNavigate();

  if(!data) return <Loading />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4">
      <div className="max-w-3xl w-full text-center space-y-6">
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto mb-6 animate-floating">
          <img
            src={data?.image?.url}
            alt="404 Error Illustration"
            className="w-full h-auto"
          />
        </div>

        <div className="mt-6">
          <Button
            onClick={() => navigate("/")}
            className="bg-purple-600 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 px-5 py-3 sm:px-6 sm:py-4 text-base sm:text-lg shadow-lg group"
          >
            <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
            {data?.button_text}
          </Button>
        </div>
      </div>
    </div>
  );
}
