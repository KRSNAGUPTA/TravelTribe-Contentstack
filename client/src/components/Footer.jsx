import { toast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Toaster } from "./ui/toaster";
import { useEffect, useState } from "react";
import api from "@/api";
import cmsClient from "@/contentstack/contentstackClient";
import Stack, { onEntryChange } from "@/contentstack/contentstackSDK";
import { setDataForChromeExtension } from "@/contentstack/utils";
import { addEditableTags } from "@contentstack/utils";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [footerData, setFooterData] = useState({});
  
  useEffect(() => {
    const fetchCDAData = async () => {
      try {
        const entry = (
          await cmsClient.get(
            "/content_types/footer/entries/bltf643a3bf4a1a7316"
          )
        ).data.entry;
        setFooterData(entry);
      } catch (error) {
        console.error("CDA: Failed to fetch footer data from cms", error);
      }
    };

    const fetchSDKData = async () => {
      try {
        const entry = await Stack
          .ContentType("footer")
          .Entry("bltf643a3bf4a1a7316")
          .toJSON()
          .fetch();
        addEditableTags(entry, "footer", true, 'en-us')
        setFooterData(entry);

        // for live preview 
        const data = {
          "entryUid": "bltf643a3bf4a1a7316",
          "contenttype": "footer",
          "locale": "en-us"
        }
        setDataForChromeExtension(data)
      } catch (error) {
        console.error("SDK: Failed to fetch footer data", error);
      }
    };

    if (import.meta.env.VITE_SDK === "true") {
      fetchSDKData()
      onEntryChange(fetchSDKData);
    } else {
      fetchCDAData();
    }
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
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-t border-gray-200">
      <Toaster/>
      <div className="container mx-auto px-4 py-12
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div>
          <h2 className="text-2xl md:text-4xl font-bold pacifico-regular text-gray-900" {...footerData?.$?.title}>{footerData?.title}</h2>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed" {...footerData?.$?.subtext}>
            {footerData?.subtext}
          </p>
        </div>

        {/* CMS Sections */}
        {footerData?.section_group?.map((section) => (
          <div key={section._metadata.uid}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900" {...section?.$?.group_title}>
              {section?.group_title}
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {section.link_group?.map((item) => (
                <li key={item._metadata.uid}>
                  <a
                    href={item?.link?.href}
                    className="hover:text-gray-900 transition"
                    {...item?.link?.$?.title}
                  >
                    {item?.link?.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Subscribe */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900" {...footerData?.$?.email_title}>
            {footerData?.email_title}
          </h3>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={footerData?.email_placeholder}
              className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-1 rounded-md outline-none focus:border-gray-400"
              {...footerData?.$?.email_placeholder}
            />
            <Button
              onClick={handleSubscribe}
              className="w-full sm:w-auto bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-md"
            >
              <span {...footerData?.$?.subscribe_button_text}>{footerData?.subscribe_button_text}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-300 mt-6 pb-28 py-4 text-center text-xs text-gray-500 px-4">
        <p {...footerData?.$?.copyright_text}>{footerData?.copyright_text}</p>
        <div className="mt-2 flex justify-center gap-4 flex-wrap">
          <a
            href={footerData?.terms_of_service_link?.href}
            className="hover:text-gray-900"
            {...footerData?.terms_of_service_link?.$?.title}
          >
            {footerData?.terms_of_service_link?.title}
          </a>
          <a
            href={footerData?.privacy_policy_link?.href}
            className="hover:text-gray-900"
            {...footerData?.privacy_policy_link?.$?.title}
          >
            {footerData?.privacy_policy_link?.title}
          </a>
        </div>
      </div>
    </footer>


  );
};

export default Footer;
