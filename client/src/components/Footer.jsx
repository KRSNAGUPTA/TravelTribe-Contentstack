import { toast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Toaster } from "./ui/toaster";
import { useEffect, useState } from "react";
import api from "@/api";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntryById, setDataForChromeExtension } from "@/contentstack/utils";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [footerData, setFooterData] = useState({});
  const navigate = useNavigate();

  const {user} = useContext(AuthContext);

  const isInternalLink = (href = "") => {
    return href.startsWith("/") && !href.startsWith("//");
  };

  const isExternalLink = (href = "") => {
    return (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("//") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    );
  };

  const getAnchorAttrs = (href = "") => {
    if (isExternalLink(href)) {
      return {
        target: "_blank",
        rel: "noopener noreferrer",
      };
    }

    return {};
  };

  const handleFooterLinkClick = (event, href) => {
    if (!href) {
      return;
    }

    if (isInternalLink(href)) {
      event.preventDefault();
      navigate(href);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  const renderCmsLink = (item, className = "") => {
    const href = item?.link?.href || "#";

    return (
      <a
        href={href}
        onClick={(event) => handleFooterLinkClick(event, href)}
        className={className}
        {...getAnchorAttrs(href)}
        {...item?.link?.$?.title}
      >
        {item?.link?.title}
      </a>
    );
  };

  const footerEntryMeta = {
    entryUid: "bltf643a3bf4a1a7316",
    contenttype: "footer",
    locale: import.meta.env.VITE_CS_LOCALE,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = await fetchEntryById(
          footerEntryMeta.contenttype,
          footerEntryMeta.entryUid,
          import.meta.env.VITE_SDK,
          null,
        );
        setFooterData(entry || {});
      } catch (error) {
        console.error("Error fetching footer data", error);
      }
    };

    onEntryChange(fetchData);
    setDataForChromeExtension(footerEntryMeta);
  }, []);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

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
    jstag.send({
      _e: "newsletter_subscribe",
      newsletter_email: email,
    });

    try {
      await api.post("/api/subscribe", {
        email,
        url: `${window.location.origin}`,
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
    <footer className="relative overflow-hidden bg-black text-white">
      <Toaster />
      <div className="pointer-events-none absolute -top-20 -left-16 h-56 w-56 rounded-full bg-[var(--primary)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div
        className="container relative  mx-auto grid grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Brand */}
        <div>
          <h2
            className="pacifico-regular text-3xl font-bold text-white md:text-4xl"
            {...footerData?.$?.title}
          >
            {footerData?.title}
          </h2>
          <p
            className="mt-4 max-w-xs text-sm leading-relaxed text-gray-300"
            {...footerData?.$?.subtext}
          >
            {footerData?.subtext}
          </p>
        </div>

        {/* CMS Sections */}
        {footerData?.section_group?.map((section) => (
          <div key={section._metadata.uid}>
            <h3
              className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gray-200"
              {...section?.$?.group_title}
            >
              {section?.group_title}
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              {section.link_group?.map((item) => (
                <li key={item._metadata.uid}>
                  {renderCmsLink(
                    item,
                    "inline-block rounded-sm transition hover:-translate-y-[1px] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Subscribe */}
        <div>
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gray-200"
            {...footerData?.$?.email_title}
          >
            {footerData?.email_title}
          </h3>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={footerData?.email_placeholder}
              className="h-10 w-full rounded-md border border-gray-700 bg-gray-900/80 px-4 text-sm text-white outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/40"
              {...footerData?.$?.email_placeholder}
            />
            <Button
              onClick={handleSubscribe}
              className="h-10 w-full rounded-md bg-[var(--primary)] px-5 text-sm font-semibold transition hover:bg-[var(--primary-hover)] sm:w-auto"
            >
              <span {...footerData?.$?.subscribe_button_text}>
                {footerData?.subscribe_button_text}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative mt-4 border-t border-gray-800/80 px-4 py-5 pb-28 text-center text-xs text-gray-400">
        <p {...footerData?.$?.copyright_text}>{footerData?.copyright_text}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          <a
            href={footerData?.terms_of_service_link?.href}
            onClick={(event) =>
              handleFooterLinkClick(event, footerData?.terms_of_service_link?.href)
            }
            className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            {...getAnchorAttrs(footerData?.terms_of_service_link?.href)}
            {...footerData?.terms_of_service_link?.$?.title}
          >
            {footerData?.terms_of_service_link?.title}
          </a>
          <a
            href={footerData?.privacy_policy_link?.href}
            onClick={(event) =>
              handleFooterLinkClick(event, footerData?.privacy_policy_link?.href)
            }
            className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            {...getAnchorAttrs(footerData?.privacy_policy_link?.href)}
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
