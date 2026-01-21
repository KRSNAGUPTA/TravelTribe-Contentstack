import { toast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Toaster } from "./ui/toaster";
import { useEffect, useState } from "react";
import api from "@/api";
import cmsClient from "@/contentstackClient";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [footerData, setFooterData] = useState({});
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = (
          await cmsClient.get(
            "/content_types/footer/entries/bltf643a3bf4a1a7316"
          )
        ).data.entry;
        setFooterData(data);
      } catch (error) {
        console.error("Failed to fetch data from cms", error);
      }
    };

    fetchData();
  }, []);

  const handleSubscribe = async () => {
    if (!email) {
      return toast({
        variant: "destructive",
        title: "Please, Enter your email",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast({
        variant: "destructive",
        title: "Please, Enter a valid email",
      });
    }
    try {
      await api.post("/api/subscribe", {
        email,
        url:`${window.location.origin}`
      });
      toast({
        title: "Thank you for subscribing to TravelTribe!",
      });
      setEmail("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subscription failed. Please try again.",
      });
    }
  };

  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold">{footerData?.title}</h2>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed">
            {footerData?.subtext}
          </p>
        </div>

        {/* CMS Sections */}
        {footerData?.section_group?.map((section) => (
          <div key={section._metadata.uid}>
            <h3 className="text-lg font-semibold mb-4">
              {section.group_title}
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {section.link_group?.map((item) => (
                <li key={item._metadata.uid}>
                  <a
                    href={item.link.href}
                    className="hover:text-white transition"
                  >
                    {item.link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Subscribe */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {footerData?.email_title}
          </h3>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={footerData?.email_placeholder}
              className="w-full bg-gray-800 text-white px-4 py-1 rounded-md outline-none"
            />
            <Button
              onClick={handleSubscribe}
              className="w-full sm:w-auto bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-md"
            >
              {footerData?.subscribe_button_text}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 mt-6 pb-28 py-4 text-center text-xs text-gray-500 px-4">
        <p>{footerData?.copyright_text}</p>
        <div className="mt-2 flex justify-center gap-4 flex-wrap">
          <a
            href={footerData?.terms_of_service_link?.href}
            className="hover:text-white"
          >
            {footerData?.terms_of_service_link?.title}
          </a>
          <a
            href={footerData?.privacy_policy_link?.href}
            className="hover:text-white"
          >
            {footerData?.privacy_policy_link?.title}
          </a>
        </div>
      </div>
    </footer>


  );
};

export default Footer;
