import { toast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Toaster } from "./ui/toaster";
import { useEffect, useState, useContext } from "react";
import api from "@/api";
import { onEntryChange } from "@/contentstack/contentstackSDK";
import { fetchEntries } from "@/contentstack/utils";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mail, ArrowRight, Check } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [footerData, setFooterData] = useState({});
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entry = (await fetchEntries("footer"))[0];
        setFooterData(entry || {});
      } catch (error) {
        console.error("Error fetching footer data", error);
      }
    };

    fetchData();
    onEntryChange(fetchData);
  }, []);

  const isInternalLink = (href = "") =>
    href.startsWith("/") && !href.startsWith("//");

  const isExternalLink = (href = "") =>
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:");

  const getAnchorAttrs = (href = "") =>
    isExternalLink(href)
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};

  const handleFooterLinkClick = (event, href) => {
    if (!href) return;
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

  const handleSubscribe = async () => {
    if (isAlreadySubscribed) {
      return toast({ title: "You are already subscribed." });
    }
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
        url: `${window.location.origin}`,
      });
      toast({ title: "Thank you for subscribing to TravelTribe!" });
      setEmail("");
      setIsAlreadySubscribed(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title:
          error?.response?.data?.message ||
          "Subscription failed. Please try again.",
      });
    }
  };

  return (
    <footer className="relative overflow-hidden bg-[#0f0d0c] text-white print:hidden">
      <Toaster />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary) / 0.18) 1.2px, transparent 1.3px)",
          backgroundSize: "24px 24px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2
              className="pacifico-regular text-2xl font-semibold tracking-tight sm:text-3xl"
              {...footerData?.$?.title}
            >
              {footerData?.title}
            </h2>
            <p
              className="mt-4 max-w-xs text-[0.9rem] font-light leading-[1.6] text-white/60"
              {...footerData?.$?.subtext}
            >
              {footerData?.subtext}
            </p>

            {footerData?.email && (
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </span>
                <a
                  href={`mailto:${footerData.email}`}
                  className="text-[0.85rem] font-medium text-white/85 transition-colors hover:text-primary"
                  {...footerData?.$?.email}
                >
                  {footerData.email}
                </a>
              </div>
            )}
          </div>

          {footerData?.section_group?.map((section) => (
            <div key={section._metadata.uid} className="lg:col-span-2">
              <h3
                className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/50"
                {...section?.$?.group_title}
              >
                {section?.group_title}
              </h3>
              <ul className="mt-5 space-y-3">
                {section.link_group?.map((item) => (
                  <li key={item._metadata.uid}>
                    {renderCmsLink(
                      item,
                      "inline-block text-[0.88rem] font-light text-white/75 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0d0c]"
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="sm:col-span-2 lg:col-span-4">
            <h3
              className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/50"
              {...footerData?.$?.email_title}
            >
              {footerData?.email_title}
            </h3>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={footerData?.email_placeholder}
                disabled={isAlreadySubscribed}
                className="h-10 w-full rounded-full border border-white/15 bg-white/[0.04] px-4 text-[0.85rem] text-white placeholder:text-white/40 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                {...footerData?.$?.email_placeholder}
              />

              {isAlreadySubscribed ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-full sm:w-auto">
                        <Button
                          onClick={handleSubscribe}
                          disabled
                          className="h-10 w-full  rounded-full cursor-pointer bg-primary/60 px-5 text-[0.82rem] font-semibold text-on-primary sm:w-auto"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            <span {...footerData?.$?.subscribe_button_text}>
                              Subscribed
                            </span>
                          </span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-full border border-white/10 bg-[#1a1614] px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                      You are already subscribed to newsletter updates.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  className="h-10 w-full cursor-pointer  rounded-full bg-primary px-5 text-[0.82rem] font-semibold text-on-primary shadow-md transition hover:bg-primary-hover sm:w-auto"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span {...footerData?.$?.subscribe_button_text}>
                      {footerData?.subscribe_button_text}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="text-[0.78rem] text-white/50"
            {...footerData?.$?.copyright_text}
          >
            {footerData?.copyright_text}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a
              href={footerData?.terms_of_service_link?.href}
              onClick={(event) =>
                handleFooterLinkClick(
                  event,
                  footerData?.terms_of_service_link?.href
                )
              }
              className="text-[0.78rem] text-white/50 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0d0c]"
              {...getAnchorAttrs(footerData?.terms_of_service_link?.href)}
              {...footerData?.terms_of_service_link?.$?.title}
            >
              {footerData?.terms_of_service_link?.title}
            </a>
            <a
              href={footerData?.privacy_policy_link?.href}
              onClick={(event) =>
                handleFooterLinkClick(
                  event,
                  footerData?.privacy_policy_link?.href
                )
              }
              className="text-[0.78rem] text-white/50 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0d0c]"
              {...getAnchorAttrs(footerData?.privacy_policy_link?.href)}
              {...footerData?.privacy_policy_link?.$?.title}
            >
              {footerData?.privacy_policy_link?.title}
            </a>
          </div>
        </div>
      </div>

      <div className="h-24" aria-hidden="true" />
    </footer>
  );
};

export default Footer;