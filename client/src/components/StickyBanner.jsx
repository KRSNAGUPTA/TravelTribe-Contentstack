import { StickyBanner } from "@/components/ui/sticky-banner";

export const StickyBar = () => {
  return (
    <div className="fixed top-2 inset-x-0 z-50 flex justify-center pointer-events-none">
      <StickyBanner 
        className="pointer-events-auto bg-white/35 backdrop-blur-md text-neutral-800 border border-neutral-200 shadow-md rounded-full px-4 py-1.5 w-auto flex items-center gap-x-3"
        hideOnScroll={true}
      >
        <div className="flex flex-row gap-x-2 items-center text-sm font-medium">
          <span>Backend is running on free tier of</span>
          <a 
            href="https://render.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity"
          >
            <img src="/render-logo.svg" alt="Render" className="w-16 h-auto" />
          </a>
          <span>expect initial cold-start delays :)</span>
        </div>
      </StickyBanner>
    </div>
  );
};