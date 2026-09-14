import { StickyBanner } from "@/components/ui/sticky-banner";

export const StickyBar = () => {
  return (
    <div className="fixed top-2 inset-x-0 z-50 flex justify-center px-3 pointer-events-none">
      <StickyBanner 
        className="pointer-events-auto bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800 shadow-md rounded-2xl sm:rounded-full px-3.5 py-2 sm:py-1.5 max-w-[95vw] sm:max-w-max flex items-center justify-center will-change-transform"
        hideOnScroll={true}
      >
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-x-1.5 gap-y-1 text-xs sm:text-sm font-medium text-center leading-tight">
          <span>Backend on free tier of</span>
          <a 
            href="https://render.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm py-0.5"
            aria-label="Render Cloud Hosting"
          >
            <img 
              src="/render-logo.svg" 
              alt="" 
              aria-hidden="true"
              width={64}
              height={16}
              className="w-12 sm:w-16 h-auto" 
            />
          </a>
          <span> expect cold-start delays :)</span>
        </div>
      </StickyBanner>
    </div>
  );
};